#!/usr/bin/env bash
# ship-merge.sh — merge-local-first (ADR-0052) : le LOCAL décide, GitHub exécute le squash.
#
# En clair : piloter un squash "en local" pour GitHub ne marche jamais proprement — un
# squash fabriqué en local puis poussé ne fait jamais voir la PR comme "mergée", et la
# fermer à la main la marque "closed unmerged". Donc, avec un remote, on demande à `gh`
# de faire LUI-MÊME le squash (`gh pr merge --squash`), avec le message conventional du
# local (`--subject`/`--body`) — c'est le seul chemin qui laisse une vraie PR "Merged".
# Sans remote, on squash nous-mêmes sur `<base>`, puis on purge les branches absorbées
# (même classification que `skills/ezk-archive/scripts/check.sh:classify_ref`, fiche 0076 —
# fast-path "le merge ne changerait rien à la base").
#
# Chemin fantôme REFUSÉ STRUCTURELLEMENT : ce script n'a AUCUNE combinaison d'options qui
# pousse un squash local puis referme la pull request à la main — la seule sortie remote
# est `gh pr merge --squash`, la seule sortie sans remote reste locale (jamais de push).
#
# Usage:
#   ship-merge.sh --repo <dir> --branch <br> --base <base> --subject <s> --body <b>
#       Sans remote (ou avec --local) : refuse si le dépôt est sale, squash local, prune
#       les branches absorbées, fetch --prune si un remote existe quand même, puis réaligne
#       les vues vers <base> LOCAL (refresh-worktrees.sh).
#   ship-merge.sh --repo <dir> --remote --pr <n> --branch <br> --subject <s> --body <b> \
#                 [--head-sha <sha>] [--dry-run]
#       Construit `gh pr merge <n> --squash --delete-branch --subject <s> --body <b>`, et
#       `--match-head-commit <sha>` si --head-sha est fourni (refuse le merge si le head de
#       la PR a bougé depuis la validation). --dry-run : imprime la commande, n'exécute rien.
#       Sans --dry-run : exécute, puis fetch --prune + réaligne les vues vers origin/<base>.
set -euo pipefail

repo="."
branch=""
base="main"
subject=""
body=""
pr=""
head_sha=""
mode="local"
dry_run=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --branch) branch="$2"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    --subject) subject="$2"; shift 2 ;;
    --body) body="$2"; shift 2 ;;
    --pr) pr="$2"; shift 2 ;;
    --head-sha) head_sha="$2"; shift 2 ;;
    --remote) mode="remote"; shift ;;
    --local) mode="local"; shift ;;
    --dry-run) dry_run=1; shift ;;
    *) echo "ship-merge.sh: option inconnue: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$branch" ]] || { echo "ship-merge.sh: --branch requis" >&2; exit 2; }
[[ -n "$subject" ]] || { echo "ship-merge.sh: --subject requis" >&2; exit 2; }

git_c() { git -C "$repo" "$@"; }
has_remote() { git_c remote 2>/dev/null | grep -q .; }

refresh() {
  local target="${1:-}"
  local args=(--repo "$repo" --base "$base")
  [[ -n "$target" ]] && args+=(--target-ref "$target")
  bash "$(dirname "$0")/refresh-worktrees.sh" "${args[@]}"
}

# --- Branches absorbées : même algorithme que classify_ref (check.sh, fiche 0076), en
# version fast-path : après le squash, merger la branche sur le nouveau <base> ne change
# plus rien à son arbre → elle est absorbée, on peut la supprimer sans perte.
# Prérequis : `git merge-tree --write-tree` (git ≥ 2.38). Sur un git plus ancien,
# `merged_tree` est vide → aucune branche n'est jugée absorbée (dégradé SÛR : on ne
# supprime rien plutôt que de risquer une suppression à tort).
is_absorbed() {
  local ref="$1" base_tree merged_tree
  base_tree="$(git_c rev-parse "$base^{tree}" 2>/dev/null)" || return 1
  merged_tree="$(git_c merge-tree --write-tree "$base" "$ref" 2>/dev/null | head -1)"
  [[ -n "$merged_tree" && "$merged_tree" == "$base_tree" ]]
}

prune_absorbed_branches() {
  local b
  while IFS= read -r b; do
    [[ -z "$b" || "$b" == "$base" ]] && continue
    if is_absorbed "$b"; then
      # La branche peut être tenue par un AUTRE worktree (scénario multi-worktree normal
      # ici) : `git branch -D` échoue alors avec "used by worktree". On signale et on
      # continue — jamais d'abandon en plein ship (sinon <base> a avancé mais le refresh
      # ne tourne pas, et le reste du ship non plus).
      if ! git_c branch -D "$b" >/dev/null 2>&1; then
        echo "ship-merge.sh: branche absorbée '$b' non supprimée (tenue par un worktree ?) — ignorée" >&2
      fi
    fi
  done < <(git_c for-each-ref --format='%(refname:short)' refs/heads/)
}

ship_local() {
  # Garde-fou de propreté AVANT de basculer sur <base> : un changement stagé non
  # conflictuel SURVIT au `checkout` puis est embarqué par le commit de squash — ce qui
  # publierait du travail non validé à côté du squash. On refuse net un dépôt sale.
  if [[ -n "$(git_c status --porcelain)" ]]; then
    echo "ship-merge.sh: index/working tree non propre dans $repo — squash local refusé (risque d'embarquer du travail non validé avec le squash)" >&2
    exit 1
  fi
  git_c checkout -q "$base"
  git_c merge --squash "$branch" >/dev/null
  git_c commit -q -m "$subject" -m "$body"
  prune_absorbed_branches
  if has_remote; then
    git_c fetch --prune --quiet 2>/dev/null || true
  fi
  # <base> LOCAL vient d'avancer ; c'est LUI la vérité fraîche (origin/<base> n'a pas été
  # poussé par ce chemin) — on vise donc <base> local, pas origin/<base> (périmé).
  refresh "$base"
}

ship_remote() {
  [[ -n "$pr" ]] || { echo "ship-merge.sh: --pr requis avec --remote" >&2; exit 2; }
  # Épingle le merge sur le head VALIDÉ (--match-head-commit) quand l'appelant fournit le
  # SHA : si un commit arrive sur la PR entre la validation et le merge, `gh` refuse plutôt
  # que de squasher un head jamais testé (course inter-sessions, fréquente ici).
  local cmd=(gh pr merge "$pr" --squash --delete-branch --subject "$subject" --body "$body")
  [[ -n "$head_sha" ]] && cmd+=(--match-head-commit "$head_sha")
  if (( dry_run )); then
    local guard=""
    [[ -n "$head_sha" ]] && guard=" --match-head-commit $head_sha"
    # Lisible et rejouable tel quel (chaque argument contenant un espace est cité).
    printf 'DRY-RUN: gh pr merge %s --squash --delete-branch%s --subject "%s" --body "%s"\n' \
      "$pr" "$guard" "$subject" "$body"
    return 0
  fi
  ( cd "$repo" && "${cmd[@]}" )
  git_c fetch --prune --quiet 2>/dev/null || true
  # GitHub a exécuté le squash : origin/<base> est la vérité fraîche.
  refresh "origin/$base"
}

if [[ "$mode" == "remote" ]]; then
  ship_remote
else
  ship_local
fi
