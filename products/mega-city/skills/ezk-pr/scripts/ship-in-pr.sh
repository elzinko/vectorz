#!/usr/bin/env bash
# ship-in-pr.sh — le ship d'une story voyage DANS sa PR (ADR-0049, fiche 20261002114435782).
#
# En clair : la fiche d'une story passe en `features/done/` par un dernier commit de SA
# branche, après le GO de revue et AVANT le merge. Le squash fait alors atterrir le code et
# la fiche d'un seul coup, quel que soit le canal de merge (UI GitHub, `gh`, flux). Plus de
# PR de rangement après coup.
#
#   revue GO ──▶ ship-in-pr.sh add (commit ship dans la PR) ──▶ merge (n'importe quel canal)
#   NO-GO après le ship ──▶ ship-in-pr.sh undo (la fiche revient sous features/)
#
# Usage:
#   ship-in-pr.sh check --repo <dir> --ref <ref> --fiche-id <id>
#       Lecture seule. L'arbre de <ref> range-t-il la fiche dans features/done/, en status: shipped ?
#       `SHIP: present` (exit 0) · `SHIP: missing` (exit 1) · ref inconnue (exit 2).
#   ship-in-pr.sh add --repo <dir> --fiche-id <id> --pr <n> [--base <base>]
#       Sur la branche de la story : lance la transaction `ship:fiche` du dépôt (statut, git mv,
#       liens, BACKLOG, PLAN), puis committe `docs(features): ship <id> #<n>`. Ne pousse pas.
#       `SHIP: already` si la fiche est déjà en done/ · `SHIP: added <sha>`.
#   ship-in-pr.sh undo --repo <dir> --fiche-id <id> [--base <base>]
#       NO-GO arrivé après le ship : annule le commit ship par un commit de revert (aucune
#       réécriture d'historique, aucun push --force). `SHIP: undone <sha>` · `SHIP: none`.
#
# Codes de sortie : 0 fait · 1 refusé, rien écrit · 2 erreur (rien committé).
set -euo pipefail

cmd="${1:-}"
[[ $# -gt 0 ]] && shift
repo="."
ref=""
id=""
pr=""
base="main"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --repo) repo="$2"; shift 2 ;;
    --ref) ref="$2"; shift 2 ;;
    --fiche-id) id="$2"; shift 2 ;;
    --pr) pr="${2#\#}"; shift 2 ;;
    --base) base="$2"; shift 2 ;;
    *) echo "ship-in-pr.sh: option inconnue: $1" >&2; exit 2 ;;
  esac
done

die() { echo "ship-in-pr.sh: $2" >&2; exit "$1"; }
git_c() { git -C "$repo" "$@"; }

# Le CATALOGUE (products/mega-city) porte le loader des fiches et le regen de l'index. Comme
# sprint.sh : en LIEN, le chemin physique du script y mène ; en COPIE, $MEGA_CITY_ROOT le désigne.
HERE="$(cd "$(dirname "$0")" && pwd -P)"
MC="$(cd "$HERE/../../.." && pwd)"
loader_root() {
  local c
  for c in "${MEGA_CITY_ROOT:-}" "$MC"; do
    if [[ -n "$c" && -f "$c/bin/fiche-rows.ts" && -x "$c/node_modules/.bin/tsx" ]]; then echo "$c"; return 0; fi
  done
  die 2 "loader des fiches introuvable : lance le script depuis le catalogue, ou exporte MEGA_CITY_ROOT=<dépôt>/products/mega-city (après pnpm install)"
}
TMPD="$(mktemp -d)"
trap 'rm -rf "$TMPD"' EXIT

[[ -n "$id" ]] || die 2 "--fiche-id requis"

# La fiche est-elle livrée dans l'arbre de $1 ? Rangée dans done/ (`<id>_slug.md`, legacy
# `<id>-slug.md`) ET `status: shipped`, lu par le loader (règle development/fiche-read-via-loader) :
# un simple déplacement à la main ne compte pas. Pas de `grep -q` : sous pipefail, le SIGPIPE de
# git sur un gros done/ ferait répondre « absente » à tort.
shipped_in() {
  local path status
  path="$(git_c ls-tree --name-only "$1" -- features/done/ | grep -E "^features/done/${id}[_-]" || true)"
  [[ -n "$path" ]] || return 1
  git_c show "$1:${path%%$'\n'*}" > "$TMPD/fiche.md"
  # `|| die` explicite : appelée sous `if`, la fonction ne profite pas de `set -e`.
  status="$("$LOADER/node_modules/.bin/tsx" "$LOADER/bin/fiche-rows.ts" "$TMPD/fiche.md" | cut -d $'\x1f' -f 5)" \
    || die 2 "lecture de la fiche ${id} par le loader impossible ($LOADER)"
  [[ "$status" == "shipped" ]]
}

require_clean() {
  [[ -z "$(git_c status --porcelain)" ]] \
    || die 1 "working tree non propre dans $repo — refusé (le commit embarquerait du travail non validé)"
}

# La branche courante, jamais <base> ni une tête détachée : le ship voyage dans la PR.
require_story_branch() {
  local current
  current="$(git_c symbolic-ref --quiet --short HEAD)" || die 1 "tête détachée — place-toi sur la branche de la story"
  [[ "$current" != "$base" ]] || die 1 "tu es sur '$base' — le ship se committe sur la branche de la story, jamais sur '$base'"
}

# Le dernier commit « ship <id> » de la branche. `-1` plutôt que `| head -1` : après un
# re-ship, plusieurs commits correspondent et `head` couperait git (SIGPIPE sous pipefail).
last_ship_commit() {
  git_c rev-parse --verify --quiet "${base}^{commit}" >/dev/null || die 2 "base '$base' introuvable dans $repo (--base ?)"
  git_c log -1 --format='%H' -E --grep="^docs\(features\): ship ${id}( |$)" "$base..HEAD"
}

do_check() {
  [[ -n "$ref" ]] || die 2 "--ref requis"
  git_c rev-parse --verify --quiet "${ref}^{commit}" >/dev/null || die 2 "ref inconnue dans $repo : $ref (fetch d'abord)"
  if shipped_in "$ref"; then echo "SHIP: present"; exit 0; fi
  echo "SHIP: missing"
  exit 1
}

do_add() {
  [[ -n "$pr" ]] || die 2 "--pr requis (le numéro de la PR ouverte)"
  require_story_branch
  require_clean
  if shipped_in HEAD; then echo "SHIP: already"; exit 0; fi

  local fiches=() f
  while IFS= read -r f; do fiches+=("$f"); done < <(git_c ls-files -- "features/${id}_*.md" "features/${id}-*.md")
  [[ ${#fiches[@]} -eq 1 ]] || die 2 "fiche ${id} introuvable (ou ambiguë) sous features/ : ${#fiches[@]} candidate(s)"

  local mc="$repo/products/mega-city"
  [[ -f "$mc/package.json" ]] \
    || die 2 "ship:fiche introuvable dans ce dépôt ($mc) — fais le ship à la main (ezk-backlog ship), puis committe"
  pnpm --dir "$mc" ship:fiche -- --pr "#$pr" "${fiches[0]}" \
    || die 2 "ship:fiche a refusé ou échoué — rien committé (voir son message ci-dessus)"

  # Arbre propre au départ : tout ce qui a bougé vient du ship. Le `git mv` est déjà dans
  # l'index ; on y ajoute, fichier par fichier, ce que la transaction a écrit à côté.
  local changed=()
  while IFS= read -r f; do [[ -n "$f" ]] && changed+=("$f"); done < <(
    git_c diff --name-only
    git_c ls-files --others --exclude-standard
  )
  git_c add -- ${changed[@]+"${changed[@]}"}
  git_c commit -q -m "docs(features): ship ${id} #${pr}" \
    -m "Le ship voyage dans la PR (ADR-0049) : la fiche arrive en done/ avec son code, quel que soit le canal de merge."
  echo "SHIP: added $(git_c rev-parse --short HEAD)"
}

do_undo() {
  require_story_branch
  require_clean
  if ! shipped_in HEAD; then echo "SHIP: none"; exit 0; fi
  local sha
  sha="$(last_ship_commit)"
  [[ -n "$sha" ]] || die 1 "la fiche ${id} est en done/ sans commit ship sur cette branche (héritée de '$base' ?) — rien retiré"
  if ! git_c revert --no-commit "$sha" >/dev/null 2>&1; then
    # Cas courant : la branche a fusionné main après le ship d'une autre PR, et l'index généré
    # porte les deux ships. Ce conflit-là se résout mécaniquement (ADR-0049 §3) : on régénère
    # l'index depuis les fiches. Tout autre conflit (PLAN.md, une fiche) se tranche à la main.
    if [[ "$(git_c diff --name-only --diff-filter=U)" != "features/BACKLOG.md" ]]; then
      git_c revert --abort
      die 2 "le revert du ship ${sha:0:8} conflicte avec un commit plus récent — rien retiré, résous à la main"
    fi
    git_c checkout --ours -- features/BACKLOG.md
    bash "$LOADER/bin/regen-backlog.sh" "$repo" >/dev/null
    git_c add -- features/BACKLOG.md
  fi
  git_c commit -q -m "revert(features): retire le ship ${id} après un no-go de revue" \
    -m "Annule ${sha:0:8} (ADR-0049) : la branche ne présente plus la story comme livrée."
  echo "SHIP: undone ${sha:0:8}"
}

# Résolu une fois, au niveau du script : un loader absent arrête tout (exit 2), jamais un faux
# « absente » qui ferait répondre `undo` « SHIP: none » en silence.
LOADER="$(loader_root)"

case "$cmd" in
  check) do_check ;;
  add) do_add ;;
  undo) do_undo ;;
  *) die 2 "usage : ship-in-pr.sh check|add|undo --repo <dir> --fiche-id <id> [--ref <ref>] [--pr <n>] [--base <base>]" ;;
esac
