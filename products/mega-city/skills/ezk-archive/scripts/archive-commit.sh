#!/usr/bin/env bash
# archive-commit.sh — la clôture committe ET intègre l'archive de session (fiche 20261005100026946, ADR-0063).
#
# EN CLAIR. `ezk-archive run` écrit l'archive dans `docs/sessions/<date>-<slug>.md`, puis appelle ce
# script : il range le commit, à la place de « proposer le commit » sans le faire. Sans lui, l'archive
# restait hors de git dans le worktree de session, et partait avec lui si l'app le supprimait.
#
# Le commit se construit dans un WORKTREE GIT JETABLE issu de `main` — jamais via le checkout principal
# (pas de « already checked out »), jamais via la branche de session (le worktree part de `main`, donc
# seul le fichier d'archive entre dans le commit). Puis, en mode local, on COMPOSE `ship-merge.sh
# --local` (merge-squash sur le `main` local + prune + refresh) ; en mode PR, on laisse la branche et
# on imprime la commande d'ouverture. NE POUSSE JAMAIS (le push reste un geste du PO).
#
# Usage :
#   archive-commit.sh --repo <principal> --file <archive-absolue> --date <YYYY-MM-DD> --slug <slug> \
#                     --subject "<message de commit>" [--base main]
#
# Frontière ADR-0001 : ce script RANGE (déterministe) ; le SKILL (LLM) a JUGÉ quoi écrire dans l'archive.

set -uo pipefail

repo="" file="" date="" slug="" subject="" base="main"
usage() { sed -n '2,20p' "$0"; }
while (( $# )); do
  case "$1" in
    --repo)    repo="${2:-}"; shift 2 ;;
    --file)    file="${2:-}"; shift 2 ;;
    --date)    date="${2:-}"; shift 2 ;;
    --slug)    slug="${2:-}"; shift 2 ;;
    --subject) subject="${2:-}"; shift 2 ;;
    --base)    base="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "archive-commit.sh : option inconnue « $1 »" >&2; exit 2 ;;
  esac
done
for req in repo file date slug subject; do
  [[ -n "${!req}" ]] || { echo "archive-commit.sh : --$req requis" >&2; exit 2; }
done
[[ -f "$file" ]] || { echo "archive-commit.sh : archive introuvable : $file" >&2; exit 2; }
git -C "$repo" rev-parse --is-inside-work-tree >/dev/null 2>&1 || { echo "archive-commit.sh : $repo n'est pas un dépôt git" >&2; exit 2; }
git -C "$repo" show-ref --verify --quiet "refs/heads/$base" || { echo "archive-commit.sh : base « $base » absente dans $repo" >&2; exit 2; }
# Valide slug et date EN AMONT : un slug avec « / » casserait le `cp` et le nom de branche (c'est la
# racine du risque de perte de données) ; une date non conforme casserait `docs/archive-session-<date>`.
case "$slug" in */*|*' '*|"") echo "archive-commit.sh : --slug invalide (ni « / », ni espace, non vide) : « $slug »" >&2; exit 2 ;; esac
[[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "archive-commit.sh : --date attendu AAAA-MM-JJ : « $date »" >&2; exit 2; }

# Chemin de ship-merge, surchargeable en test (EZK_ARCHIVE_SHIP_MERGE) pour éprouver le repli d'échec.
SHIP_MERGE="${EZK_ARCHIVE_SHIP_MERGE:-$(cd "$(dirname "${BASH_SOURCE[0]}")/../../ezk-pr/scripts" 2>/dev/null && pwd)/ship-merge.sh}"

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
  # repli sans ezk : une clé `pr: false` sous `github:` coupe la PR.
  # POSIX : `\s`/`\b` ne sont pas portables (BSD grep de macOS les ignore). Classe + ancrage explicites.
  grep -qE '^[[:space:]]*pr:[[:space:]]*false([[:space:]#]|$)' "$repo/.vectorz/config.yml" && mode="local"
fi

# --- nom de branche libre (jamais écraser une branche existante) ----------------------------------
branch="docs/archive-session-$date"
n=2
while git -C "$repo" show-ref --verify --quiet "refs/heads/$branch"; do
  branch="docs/archive-session-$date-$n"; n=$((n + 1))
done

# --- worktree jetable issu de `main` : le commit n'y voit QUE main + l'archive ---------------------
TMP="$(mktemp -d)"
wt_live=1
cleanup() { (( wt_live )) && git -C "$repo" worktree remove --force "$TMP" >/dev/null 2>&1; rm -rf "$TMP" 2>/dev/null || true; }
trap cleanup EXIT
if ! git -C "$repo" worktree add -q "$TMP" -b "$branch" "$base" 2>/dev/null; then
  echo "archive-commit.sh : worktree jetable impossible (git trop ancien ?) — archive laissée écrite, non committée : $file" >&2
  exit 2
fi
dest_rel="docs/sessions/$date-$slug.md"
# `set` n'a pas `-e` ici : on vérifie EXPLICITEMENT chaque étape qui précède la suppression de
# l'original, sinon une étape ratée (cp, hook de commit, rien à committer) laisserait `rm` détruire la
# seule copie. Toutes ces commandes DOIVENT réussir avant le `rm -f "$file"` plus bas.
if ! mkdir -p "$TMP/docs/sessions" \
   || ! cp "$file" "$TMP/$dest_rel" \
   || ! git -C "$TMP" add "$dest_rel" \
   || ! git -C "$TMP" commit -q -m "$subject"; then
  echo "archive-commit.sh : commit de l'archive échoué — RIEN retiré, l'archive reste écrite : $file" >&2
  exit 2   # le trap EXIT retire le worktree jetable ; l'original n'est jamais supprimé sans commit
fi
# Retrait EXPLICITE avant toute intégration : libère la branche pour que ship-merge puisse la prune.
# `wt_live=0` seulement si le retrait a RÉUSSI — sinon le trap EXIT retente la purge git (pas qu'un rm).
git -C "$repo" worktree remove --force "$TMP" >/dev/null 2>&1 && wt_live=0
# Le commit a RÉUSSI (vérifié ci-dessus) : la copie non suivie du worktree de session vit désormais
# sur la branche. On la retire pour que `git status` du worktree de session ne la montre plus (critère 1).
rm -f "$file"

# --- intégration ----------------------------------------------------------------------------------
echo "ARCHIVE: committée sur $branch ($dest_rel)"
if [[ "$mode" == "local" ]]; then
  if [[ -n "$(git --no-optional-locks -C "$repo" status --porcelain 2>/dev/null)" ]]; then
    # Principal sale : on NE merge PAS (ship-merge l'embarquerait). L'archive est sauvée sur sa branche.
    echo "LOCAL-DEFERRED: dossier principal non propre → non intégrée. L'archive est committée sur $branch."
    echo "  Intègre quand le principal est propre :"
    echo "  bash $SHIP_MERGE --local --repo $repo --branch $branch --base $base --subject \"$subject\""
  elif bash "$SHIP_MERGE" --local --repo "$repo" --branch "$branch" --base "$base" --subject "$subject"; then
    echo "LOCAL: archive intégrée sur $base (local). Rien n'est poussé — pousse toi-même : git -C $repo push origin $base"
  else
    # ship-merge a refusé (git trop ancien, course sur le principal…) : on ne ment pas sur l'intégration.
    echo "LOCAL-FAILED: intégration refusée (cf. ci-dessus) — l'archive reste committée sur $branch." >&2
    echo "  Réessaie : bash $SHIP_MERGE --local --repo $repo --branch $branch --base $base --subject \"$subject\"" >&2
  fi
else
  echo "PR: archive committée sur $branch, rien n'est poussé. Ouvre la PR :"
  echo "  git -C $repo push -u origin $branch && gh pr create --head $branch --title \"$subject\""
fi
