#!/usr/bin/env bash
# refresh-worktrees.sh — merge-local-first (ADR-0052) : réalignement APRÈS un merge.
#
# En clair : une fois que `<base>` (main) a avancé — squash GitHub ou squash local —,
# ce script rafraîchit les refs partagées (`git fetch --prune`), puis regarde chaque
# worktree qui a `<base>` sous les pieds.
#
# ADR-0052 **D3** (= ADR-0042) : on ne touche JAMAIS au worktree d'une AUTRE session. Un
# working tree « propre » ne prouve PAS qu'il est inutilisé — un build, un test ou un agent
# peut être en train de lire cet arbre. Donc, en transverse, on se contente de **signaler**
# les autres worktrees en retard ; **seule la vue INVOQUANTE** (celle dont la session pilote
# ce geste, `--repo`) peut être avancée en fast-forward, et seulement si elle est propre et
# strictement en retard (prédicat D4). Chaque autre worktree se réalignera lui-même à son
# prochain geste, via la gate de fraîcheur `run-freshness-origin-main`.
#
# Sortie, une ligne par worktree concerné (silence total si rien à signaler) :
#   FF <path> <ancien-sha>..<nouveau-sha>   — vue invoquante, fast-forwardée
#   SIGNAL <path> behind                    — en retard sur <base> (autre worktree : jamais touché)
#   SIGNAL <path> dirty                     — vue invoquante sale : jamais touchée
#   SIGNAL <path> ahead                     — a des commits que <base> n'a pas
#   SIGNAL <path> diverged                  — a divergé de <base>
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

# Cible du réalignement. Si l'appelant l'a imposée (ship_local : <base> LOCAL), on ne
# refetch pas. Sinon : on vise l'upstream CONFIGURÉ de <base> (`<base>@{upstream}`, qui peut
# suivre un remote nommé autrement qu'`origin`) et on fetch CE remote-là explicitement — pas
# un `git fetch` nu qui irait chercher le remote de la branche courante (faux en fork).
if [[ -z "$target_ref" ]]; then
  upstream="$(git_c rev-parse --abbrev-ref --symbolic-full-name "$base@{upstream}" 2>/dev/null || true)"
  if [[ -n "$upstream" ]]; then
    remote="${upstream%%/*}"                       # origin/main -> origin ; upstream/main -> upstream
    if ! git_c fetch --prune --quiet "$remote" 2>/dev/null; then
      # Remote injoignable / hors ligne : on ne bloque pas (repli de la règle), mais on ne
      # fait pas SEMBLANT d'avoir vérifié — sinon un upstream périmé égal au local ferait
      # croire, à tort, que tout est aligné.
      echo "SIGNAL fetch-failed (réalignement non vérifié)"
    fi
    target_ref="$upstream"
  else
    target_ref="$base"                             # pas d'upstream configuré : <base> local
  fi
fi
target_sha="$(git_c rev-parse --verify -q "$target_ref^{commit}" 2>/dev/null || true)"
[[ -n "$target_sha" ]] || { echo "refresh-worktrees.sh: cible '$target_ref' introuvable" >&2; exit 2; }

# La vue INVOQUANTE = le worktree pointé par --repo (sa session pilote ce geste).
invoking_wt="$(cd "$repo" 2>/dev/null && pwd -P || echo "$repo")"

is_clean() { [[ -z "$(git -C "$1" status --porcelain 2>/dev/null)" ]]; }
is_ancestor() { git -C "$1" merge-base --is-ancestor "$2" "$3" 2>/dev/null; }

while IFS= read -r line; do
  [[ "$line" == "worktree "* ]] || continue
  wt="${line#worktree }"
  branch="$(git -C "$wt" symbolic-ref -q --short HEAD || true)"
  [[ "$branch" == "$base" ]] || continue   # seules les vues qui PORTENT <base> nous concernent

  head_sha="$(git -C "$wt" rev-parse HEAD)"
  [[ "$head_sha" == "$target_sha" ]] && continue   # déjà à jour, rien à dire

  # Position relative de la vue par rapport à la cible (pour le libellé du signal).
  if is_ancestor "$wt" "$head_sha" "$target_sha"; then pos="behind"
  elif is_ancestor "$wt" "$target_sha" "$head_sha"; then pos="ahead"
  else pos="diverged"; fi

  wt_abs="$(cd "$wt" 2>/dev/null && pwd -P || echo "$wt")"
  if [[ "$wt_abs" != "$invoking_wt" ]]; then
    # AUTRE session : JAMAIS d'écriture (D3) — on signale seulement qu'elle est en retard /
    # en avance / divergente, à charge pour SA propre session de se réaligner.
    echo "SIGNAL $wt $pos"
    continue
  fi

  # Vue INVOQUANTE : on peut l'avancer, mais seulement propre ET strictement en retard (D4).
  if [[ "$pos" != "behind" ]]; then
    echo "SIGNAL $wt $pos"
    continue
  fi
  if ! is_clean "$wt"; then
    echo "SIGNAL $wt dirty"
    continue
  fi
  # Fast-forward strict. Le `--ff-only` est un second verrou : s'il échoue (vue salie entre
  # le contrôle et ici — une course), on SIGNALE et on continue, jamais d'écrasement.
  if git -C "$wt" merge --ff-only --quiet "$target_ref" 2>/dev/null; then
    echo "FF $wt $head_sha..$target_sha"
  else
    echo "SIGNAL $wt ff-failed"
  fi
done < <(git_c worktree list --porcelain)
