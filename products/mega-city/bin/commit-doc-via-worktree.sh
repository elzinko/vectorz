#!/usr/bin/env bash
# commit-doc-via-worktree.sh — committe UN document dans `main` via un worktree jetable (ADR-0068).
#
# EN CLAIR. Un skill vient d'écrire un document (archive de session, compte rendu de sprint…) dans le
# worktree de session. Ce helper le range dans git à la place de « proposer le commit » sans le faire :
# il construit le commit dans un WORKTREE GIT JETABLE issu de `main`, pour que SEUL ce document entre
# dans le commit (jamais le travail en cours du worktree de session, ni un « already checked out »).
# Puis, en mode local, il COMPOSE `ship-merge.sh --local` ; en mode PR, il laisse la branche et imprime
# la commande d'ouverture. NE POUSSE JAMAIS (le push reste un geste du PO).
#
# C'est la généralisation de `skills/ezk-archive/scripts/archive-commit.sh` (ADR-0063) : les deux skills
# qui committent un document (ezk-archive, ezk-sprint) en dépendent, au lieu de dupliquer la mécanique
# sensible aux pertes de données (frontière ADR-0001 : ce script RANGE ; le SKILL a JUGÉ le contenu).
#
# Usage :
#   commit-doc-via-worktree.sh --repo <principal> --file <doc-absolu> --dest-rel <chemin/dans/le/dépôt> \
#       --branch-base <nom-de-branche-souhaité> --subject "<message de commit>" \
#       [--kind-tag ARCHIVE] [--kind-noun archive] [--base main] [--ship-merge <chemin>]
#
# --dest-rel    : où le document atterrit dans le dépôt (ex. docs/sprints/2026-10-11-sprint-x.md).
# --branch-base : nom de branche souhaité ; un suffixe -2, -3… est ajouté si elle existe déjà.
# --kind-tag    : préfixe MAJUSCULE de la ligne « committée sur » (défaut DOC).
# --kind-noun   : nom du document dans « <noun> intégrée sur main » (défaut « document »).
# --ship-merge  : chemin de ship-merge.sh (défaut : relatif à ce script ; surchargeable pour les tests).

set -uo pipefail

repo="" file="" dest_rel="" branch_base="" subject="" base="main" kind_tag="DOC" kind_noun="document" ship_merge=""
usage() { sed -n '2,25p' "$0"; }
while (( $# )); do
  case "$1" in
    --repo)        repo="${2:-}"; shift 2 ;;
    --file)        file="${2:-}"; shift 2 ;;
    --dest-rel)    dest_rel="${2:-}"; shift 2 ;;
    --branch-base) branch_base="${2:-}"; shift 2 ;;
    --subject)     subject="${2:-}"; shift 2 ;;
    --kind-tag)    kind_tag="${2:-}"; shift 2 ;;
    --kind-noun)   kind_noun="${2:-}"; shift 2 ;;
    --base)        base="${2:-}"; shift 2 ;;
    --ship-merge)  ship_merge="${2:-}"; shift 2 ;;
    -h|--help)     usage; exit 0 ;;
    *) echo "commit-doc-via-worktree.sh : option inconnue « $1 »" >&2; exit 2 ;;
  esac
done
for req in repo file dest_rel branch_base subject; do
  [[ -n "${!req}" ]] || { echo "commit-doc-via-worktree.sh : --$req requis" >&2; exit 2; }
done
[[ -f "$file" ]] || { echo "commit-doc-via-worktree.sh : document introuvable : $file" >&2; exit 2; }
git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "commit-doc-via-worktree.sh : $repo n'est pas un dépôt git" >&2; exit 2; }
git -C "$repo" show-ref --verify --quiet "refs/heads/$base" || { echo "commit-doc-via-worktree.sh : base « $base » absente dans $repo" >&2; exit 2; }
# dest_rel ne doit jamais sortir du dépôt : un `..` casserait la garde anti-perte.
case "$dest_rel" in /*|*..*) echo "commit-doc-via-worktree.sh : --dest-rel doit être relatif, sans « .. » : « $dest_rel »" >&2; exit 2 ;; esac

# Chemin de ship-merge, surchargeable en test pour éprouver le repli d'échec.
SHIP_MERGE="${ship_merge:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../skills/ezk-pr/scripts" 2>/dev/null && pwd)/ship-merge.sh}"

# --- mode : local (github.pr off / absent de la capacité) ou PR -----------------------------------
# Le script LIT le mode (il ne le re-dérive pas côté SKILL). `ezk config show` d'abord, grep en repli.
mode="pr"   # défaut prudent : config/capacité absente = tout ON (cf. ezk-sprint « Capacités GitHub »)
cfg_line=""
if command -v ezk >/dev/null 2>&1; then
  cfg_line="$(ezk --root "$repo" config show 2>/dev/null | grep -i 'github\.pr' || true)"
fi
if [[ -n "$cfg_line" ]]; then
  case "$cfg_line" in *OFF*) mode="local" ;; *) mode="pr" ;; esac
elif [[ -f "$repo/.vectorz/config.yml" ]]; then
  grep -qE '^[[:space:]]*pr:[[:space:]]*false([[:space:]#]|$)' "$repo/.vectorz/config.yml" && mode="local"
fi

# --- nom de branche libre (jamais écraser une branche existante) ----------------------------------
branch="$branch_base"
n=2
while git -C "$repo" show-ref --verify --quiet "refs/heads/$branch"; do
  branch="$branch_base-$n"; n=$((n + 1))
done

# --- worktree jetable issu de `base` : le commit n'y voit QUE base + le document ------------------
TMP="$(mktemp -d)"
wt_live=1
cleanup() { (( wt_live )) && git -C "$repo" worktree remove --force "$TMP" >/dev/null 2>&1; rm -rf "$TMP" 2>/dev/null || true; }
trap cleanup EXIT
if ! git -C "$repo" worktree add -q "$TMP" -b "$branch" "$base" 2>/dev/null; then
  echo "commit-doc-via-worktree.sh : worktree jetable impossible (git trop ancien ?) — document laissé écrit, non committé : $file" >&2
  exit 2
fi
# `set` n'a pas `-e` ici : on vérifie EXPLICITEMENT chaque étape qui précède la suppression de
# l'original, sinon une étape ratée (cp, hook de commit, rien à committer) laisserait `rm` détruire la
# seule copie. Toutes ces commandes DOIVENT réussir avant le `rm -f "$file"` plus bas.
if ! mkdir -p "$TMP/$(dirname "$dest_rel")" \
   || ! cp "$file" "$TMP/$dest_rel" \
   || ! git -C "$TMP" add "$dest_rel" \
   || ! git -C "$TMP" commit -q -m "$subject"; then
  echo "commit-doc-via-worktree.sh : commit du document échoué — RIEN retiré, le document reste écrit : $file" >&2
  exit 2   # le trap EXIT retire le worktree jetable ; l'original n'est jamais supprimé sans commit
fi
# Retrait EXPLICITE avant toute intégration : libère la branche pour que ship-merge puisse la prune.
git -C "$repo" worktree remove --force "$TMP" >/dev/null 2>&1 && wt_live=0
# Le commit a RÉUSSI (vérifié ci-dessus) : la copie non suivie du worktree de session vit désormais
# sur la branche. On la retire pour que `git status` du worktree de session ne la montre plus.
rm -f "$file"

# --- intégration ----------------------------------------------------------------------------------
echo "$kind_tag: committée sur $branch ($dest_rel)"
if [[ "$mode" == "local" ]]; then
  if [[ -n "$(git --no-optional-locks -C "$repo" status --porcelain 2>/dev/null)" ]]; then
    # Principal sale : on NE merge PAS (ship-merge l'embarquerait). Le document est sauvé sur sa branche.
    echo "LOCAL-DEFERRED: dossier principal non propre → pas de merge. Le commit reste sur la branche $branch."
    echo "  Intègre quand le principal est propre :"
    echo "  bash $SHIP_MERGE --local --repo $repo --branch $branch --base $base --subject \"$subject\""
  elif bash "$SHIP_MERGE" --local --repo "$repo" --branch "$branch" --base "$base" --subject "$subject"; then
    echo "LOCAL: $kind_noun intégrée sur $base (local). Rien n'est poussé — pousse toi-même : git -C $repo push origin $base"
  else
    # ship-merge a refusé (git trop ancien, course sur le principal…) : on ne ment pas sur l'intégration.
    echo "LOCAL-FAILED: intégration refusée (cf. ci-dessus) — le $kind_noun reste committé sur $branch." >&2
    echo "  Réessaie : bash $SHIP_MERGE --local --repo $repo --branch $branch --base $base --subject \"$subject\"" >&2
  fi
else
  echo "PR: $kind_noun committée sur $branch, rien n'est poussé. Ouvre la PR :"
  echo "  git -C $repo push -u origin $branch && gh pr create --head $branch --title \"$subject\""
fi
