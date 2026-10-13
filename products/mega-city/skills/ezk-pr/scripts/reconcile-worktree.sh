#!/usr/bin/env bash
# reconcile-worktree.sh — réaligne le worktree de session sur <base> après un ship local.
#
# En clair : une session qui vit dans un worktree livre sur le `main` du PRINCIPAL (le seul
# checkout où `main` est sorti). Après le squash, son propre worktree reste sur sa branche
# `feat/…`, EN RETARD sur `main`. Les gates y passent alors au rouge sur des états déjà
# corrigés — un faux rouge. Le remède manuel « git reset --hard main » marche, mais sans
# garde : lancé au mauvais moment, il efface du travail pas encore absorbé.
#
# Ce geste fait ce reset, mais GARDÉ :
#   - worktree PROPRE ET rien qui lui soit propre (tout son contenu est déjà dans `main` —
#     soit ancêtre, soit absorbé par le squash) → on l'avance sur `main` (RECONCILED) ;
#   - sinon → on REFUSE de toucher et on rend un verdict explicite « N commits de retard,
#     lance X » plutôt qu'un rouge trompeur présenté comme une régression.
#
# Sens unique PRINCIPAL→worktree : ce geste LIT `main` et réécrit le worktree ; il n'écrit
# JAMAIS côté principal. Un champ qu'un script vient d'écrire sur `main` (split_from,
# merged_from…) est donc préservé — jamais écrasé par une copie périmée du worktree
# (fiche 20261010114132970, critère 3).
#
# D3 (ADR-0052 / ADR-0042) tenu : on ne touche QUE le worktree visé par --repo (celui de la
# session qui lance ce geste), jamais un autre.
#
# Usage: reconcile-worktree.sh [--repo <worktree>] [--base <branche>]
#   --repo : le worktree de session (défaut : le dépôt courant).
#   --base : la branche de référence (défaut : main).
# Sorties (une ligne, exit 0 — c'est un verdict, pas une erreur) :
#   UPTODATE <repo>                                  — déjà sur <base>, rien à faire
#   RECONCILED <repo> <old>..<new>                   — worktree avancé sur <base>
#   BEHIND <repo> behind=<n> proper=<a> dirty=<0|1> — <cause> — lance : <remède>
set -euo pipefail

repo="."
base="main"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo|--root) repo="$2"; shift 2 ;;   # --root : alias pour le routeur `ezk` (projet = worktree de session)
    --base) base="$2"; shift 2 ;;
    *) echo "reconcile-worktree.sh: option inconnue: $1" >&2; exit 2 ;;
  esac
done

git_c() { git -C "$repo" "$@"; }

base_sha="$(git_c rev-parse --verify -q "$base^{commit}" 2>/dev/null || true)"
[[ -n "$base_sha" ]] || { echo "reconcile-worktree.sh: base '$base' introuvable dans $repo" >&2; exit 2; }
head_sha="$(git_c rev-parse HEAD 2>/dev/null || true)"
[[ -n "$head_sha" ]] || { echo "reconcile-worktree.sh: HEAD illisible dans $repo" >&2; exit 2; }

if [[ "$head_sha" == "$base_sha" ]]; then
  echo "UPTODATE $repo"
  exit 0
fi

behind="$(git_c rev-list --count "HEAD..$base" 2>/dev/null || echo 0)"
ahead="$(git_c rev-list --count "$base..HEAD" 2>/dev/null || echo 0)"

dirty=0
[[ -n "$(git_c status --porcelain 2>/dev/null)" ]] && dirty=1

# Ancêtre : tous les commits de HEAD sont déjà dans <base> (fast-forward pur possible).
ancestor=0
git_c merge-base --is-ancestor HEAD "$base" 2>/dev/null && ancestor=1

# Absorbé : merger HEAD dans <base> ne changerait rien à son arbre (cas du squash — HEAD
# n'est pas ancêtre, mais son contenu est déjà dans <base>). Même prédicat que ship-merge.sh.
# Git < 2.38 : `merge-tree --write-tree` absent → merged_tree vide → non absorbé (dégradé SÛR :
# on ne bouge rien plutôt que de risquer d'effacer du travail).
absorbed=0
base_tree="$(git_c rev-parse "$base^{tree}" 2>/dev/null || true)"
merged_tree="$(git_c merge-tree --write-tree "$base" HEAD 2>/dev/null | head -1 || true)"
[[ -n "$base_tree" && -n "$merged_tree" && "$merged_tree" == "$base_tree" ]] && absorbed=1

# Sûr d'avancer : propre, en retard, et rien de propre qui ne soit déjà dans <base>.
if [[ "$dirty" == 0 && "$behind" -gt 0 && ( "$ancestor" == 1 || "$absorbed" == 1 ) ]]; then
  git_c reset --hard "$base" >/dev/null
  echo "RECONCILED $repo ${head_sha:0:9}..${base_sha:0:9}"
  exit 0
fi

# Refus : verdict explicite (jamais un rouge silencieux), étiqueté selon l'état RÉEL.
if [[ "$dirty" == 1 ]]; then
  echo "DIRTY $repo — worktree sale (modifications non validées) — lance : valide ou mets de côté ton travail, puis relance"
  exit 0
fi
if [[ "$behind" == 0 ]]; then
  # Pas en retard : rien à réconcilier. Un worktree en avance a du travail non livré.
  echo "AHEAD $repo ahead=$ahead — rien à réconcilier : $ahead commit(s) non encore livré(s)"
  exit 0
fi
# En retard ET pas sûr d'avancer : du propre non absorbé (ou état git indéterminé, ex. git ancien).
if [[ "$ahead" -gt 0 ]]; then
  cause="$ahead commit(s) propre(s) non absorbé(s) par $base"
else
  cause="état indéterminé (merge-base/merge-tree indisponibles ?)"
fi
echo "BEHIND $repo behind=$behind proper=$ahead — $cause — lance : git -C $repo log $base..HEAD"
exit 0
