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
# Cible du réalignement (`target_ref`) :
#   --target-ref <ref>  fourni par l'appelant (ship-merge.sh) — <base> LOCAL après un
#                       squash local, origin/<base> après un merge distant. Dans ce cas on
#                       NE refetch PAS (l'appelant l'a déjà fait).
#   sinon (usage direct, ex. gate de fraîcheur) : on fetch --prune, puis on vise l'upstream
#   CONFIGURÉ de <base> (`<base>@{upstream}`, qui n'est pas forcément `origin`), et à défaut
#   <base> local. Un fetch qui échoue est SIGNALÉ (jamais avalé en silence), sans bloquer.
#
# Sortie, une ligne par worktree concerné (silence total si rien à signaler) :
#   FF <path> <ancien-sha>..<nouveau-sha>   — fast-forwardé
#   SIGNAL <path> dirty                     — working tree sale, jamais touché
#   SIGNAL <path> ahead                     — a des commits que <base> n'a pas (en avance)
#   SIGNAL <path> diverged                  — a divergé de <base> (ni ancêtre ni descendant)
#   SIGNAL <path> ff-failed                 — course : sali entre le contrôle et le ff
#   SIGNAL fetch-failed (réalignement non vérifié)  — le remote n'a pas répondu
#
# Usage: refresh-worktrees.sh --repo <dir> [--base <branche>] [--target-ref <ref>]
set -euo pipefail

repo="."
base="main"
target_ref=""
while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    --target-ref) target_ref="$2"; shift 2 ;;
    *) echo "refresh-worktrees.sh: option inconnue: $1" >&2; exit 2 ;;
  esac
done

git_c() { git -C "$repo" "$@"; }

# Cible du réalignement. Si l'appelant ne l'a pas imposée, on rafraîchit le remote puis on
# vise l'upstream CONFIGURÉ de <base> (pas un `origin/<base>` codé en dur : le remote peut
# s'appeler autrement, ou <base> suivre `upstream/<base>`). À défaut d'upstream : <base> local.
if [[ -z "$target_ref" ]]; then
  if git_c remote 2>/dev/null | grep -q .; then
    if ! git_c fetch --prune --quiet 2>/dev/null; then
      # Remote injoignable / hors ligne : on ne bloque pas (repli de la règle), mais on ne
      # fait pas SEMBLANT d'avoir vérifié — on le dit (sinon un origin/<base> périmé égal au
      # local ferait croire, à tort, que tout est aligné).
      echo "SIGNAL fetch-failed (réalignement non vérifié)"
    fi
    target_ref="$(git_c rev-parse --abbrev-ref --symbolic-full-name "$base@{upstream}" 2>/dev/null || true)"
  fi
  [[ -z "$target_ref" ]] && target_ref="$base"
fi
target_sha="$(git_c rev-parse --verify -q "$target_ref^{commit}" 2>/dev/null || true)"
[[ -n "$target_sha" ]] || { echo "refresh-worktrees.sh: cible '$target_ref' introuvable" >&2; exit 2; }

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
    # Fast-forward strict possible ET propre → on avance le pointeur. Le `--ff-only` est un
    # deuxième verrou : s'il échoue (le worktree a été sali entre le contrôle et ici — une
    # course), on SIGNALE et on continue la boucle, jamais d'écrasement ni d'abandon.
    if git -C "$wt" merge --ff-only --quiet "$target_ref" 2>/dev/null; then
      echo "FF $wt $head_sha..$target_sha"
    else
      echo "SIGNAL $wt ff-failed"
    fi
  elif is_ancestor "$wt" "$target_sha" "$head_sha"; then
    # <base> est un ancêtre de HEAD : le worktree a des commits de plus (il est EN AVANCE,
    # pas en divergence). Rien à réaligner, on le signale distinctement.
    echo "SIGNAL $wt ahead"
  else
    # Ni ancêtre ni descendant : vraie divergence (un commit local que <base> n'a pas, et
    # <base> a avancé d'un autre côté).
    echo "SIGNAL $wt diverged"
  fi
done < <(git_c worktree list --porcelain)
