#!/usr/bin/env bash
# refresh-worktrees.sh — merge-local-first (ADR-0052) : réalignement APRÈS un merge.
#
# En clair : une fois que `<base>` (main) a avancé — squash GitHub ou squash local —,
# ce script rafraîchit les refs partagées (`git fetch --prune` si un remote existe), puis
# regarde chaque worktree qui a `<base>` sous les pieds. Un worktree PROPRE et qui peut
# avancer en FAST-FORWARD strict est réaligné tout seul (aucun risque : rien n'est réécrit,
# on avance juste un pointeur). Un worktree SALE ou DIVERGENT n'est JAMAIS touché : on
# se contente de le SIGNALER (règle `run-freshness-origin-main`, ADR-0042).
#
# C'est le même prédicat de sûreté (« D4 ») qu'utilise la gate de fraîcheur à l'intake
# d'un run : propre + fast-forward possible = seul cas où on écrit.
#
# Sortie, une ligne par worktree concerné (silence total si rien à signaler) :
#   FF <path> <ancien-sha>..<nouveau-sha>   — fast-forwardé
#   SIGNAL <path> dirty                     — working tree sale, jamais touché
#   SIGNAL <path> diverged                  — a un commit local que <base> n'a pas
#
# Usage: refresh-worktrees.sh --repo <dir> [--base <branche>]
set -euo pipefail

repo="."
base="main"
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    *) echo "refresh-worktrees.sh: option inconnue: $1" >&2; exit 2 ;;
  esac
done

git_c() { git -C "$repo" "$@"; }

# Un remote existe ⇒ c'est LUI la source de vérité partagée : on la rafraîchit d'abord
# (bord offline déjà couvert par `run-freshness-origin-main` : pas de remote joignable
# = on ignore silencieusement cette étape, jamais bloquant).
target_ref="$base"
if git_c remote 2>/dev/null | grep -q .; then
  git_c fetch --prune --quiet 2>/dev/null || true
  if git_c rev-parse --verify -q "origin/$base" >/dev/null; then
    target_ref="origin/$base"
  fi
fi
target_sha="$(git_c rev-parse "$target_ref")"

# Prédicat de sûreté D4 : PROPRE et fast-forward strict possible, sinon on ne fait QUE
# signaler — jamais d'écriture (ADR-0042 : un worktree tenu par une session vivante, ou
# simplement sale, n'est jamais déplacé).
is_clean() { [[ -z "$(git -C "$1" status --porcelain 2>/dev/null)" ]]; }
is_ancestor() { git -C "$1" merge-base --is-ancestor "$2" "$3" 2>/dev/null; }

while IFS= read -r line; do
  [[ "$line" == "worktree "* ]] || continue
  wt="${line#worktree }"
  branch="$(git -C "$wt" symbolic-ref -q --short HEAD || true)"
  [[ "$branch" == "$base" ]] || continue   # seules les vues qui PORTENT <base> nous concernent

  head_sha="$(git -C "$wt" rev-parse HEAD)"
  [[ "$head_sha" == "$target_sha" ]] && continue   # déjà à jour, rien à dire

  if ! is_clean "$wt"; then
    echo "SIGNAL $wt dirty"
    continue
  fi
  if is_ancestor "$wt" "$head_sha" "$target_sha"; then
    git -C "$wt" merge --ff-only --quiet "$target_ref"
    echo "FF $wt $head_sha..$target_sha"
  else
    # Ni ancêtre ni descendant propre de la cible : un commit local que <base> n'a pas.
    echo "SIGNAL $wt diverged"
  fi
done < <(git_c worktree list --porcelain)
