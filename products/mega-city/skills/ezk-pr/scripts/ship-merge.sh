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
#       Sans remote (ou avec --local) : squash local, prune les branches absorbées,
#       fetch --prune si un remote existe quand même, puis réaligne les vues
#       (refresh-worktrees.sh).
#   ship-merge.sh --repo <dir> --remote --pr <n> --branch <br> --subject <s> --body <b> [--dry-run]
#       Construit `gh pr merge <n> --squash --delete-branch --subject <s> --body <b>`.
#       --dry-run : imprime la commande, n'exécute rien (aucun réseau, aucun `gh`).
#       Sans --dry-run : exécute réellement, puis fetch --prune + réaligne les vues.
set -euo pipefail

repo="."
branch=""
base="main"
subject=""
body=""
pr=""
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
  bash "$(dirname "$0")/refresh-worktrees.sh" --repo "$repo" --base "$base"
}

# --- Branches absorbées : même algorithme que classify_ref (check.sh, fiche 0076), en
# version fast-path : après le squash, merger la branche sur le nouveau <base> ne change
# plus rien à son arbre → elle est absorbée, on peut la supprimer sans perte.
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
      git_c branch -D "$b" >/dev/null
    fi
  done < <(git_c for-each-ref --format='%(refname:short)' refs/heads/)
}

ship_local() {
  git_c checkout -q "$base"
  git_c merge --squash "$branch" >/dev/null
  git_c commit -q -m "$subject" -m "$body"
  prune_absorbed_branches
  if has_remote; then
    git_c fetch --prune --quiet 2>/dev/null || true
  fi
  refresh
}

ship_remote() {
  [[ -n "$pr" ]] || { echo "ship-merge.sh: --pr requis avec --remote" >&2; exit 2; }
  local cmd=(gh pr merge "$pr" --squash --delete-branch --subject "$subject" --body "$body")
  if (( dry_run )); then
    # Lisible et rejouable tel quel (chaque argument contenant un espace est cité).
    printf 'DRY-RUN: gh pr merge %s --squash --delete-branch --subject "%s" --body "%s"\n' \
      "$pr" "$subject" "$body"
    return 0
  fi
  ( cd "$repo" && "${cmd[@]}" )
  git_c fetch --prune --quiet 2>/dev/null || true
  refresh
}

if [[ "$mode" == "remote" ]]; then
  ship_remote
else
  ship_local
fi
