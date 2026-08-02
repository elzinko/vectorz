#!/usr/bin/env bash
# Skema migration 002 — applique README curé + regen BACKLOG.md (layout v1 → v2).
# Usage : apply-002-readme-vs-backlog.sh [--force] [racine] [titre-index]
#
# Ne migre le README que s'il est clairement un **index legacy v1**
# (marqueur « Index auto-généré »), ou avec --force. Sinon refuse — ne touche
# pas aux README curés / tombstones (ex. products/mega-city/features/README.md).
# Avant tout écrasement : backup → features/README.md.bak-skema-002
# Résout regen **avant** toute mutation ; échoue clairement si introuvable.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
FORCE=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --force) FORCE=1 ;;
    *) ARGS+=("$a") ;;
  esac
done
ROOT="${ARGS[0]:-.}"
ROOT="$(cd "$ROOT" && pwd)"
TITLE="${ARGS[1]:-Backlog features & bugs}"
FEATURES="$ROOT/features"
TEMPLATE="$SKILL_DIR/templates/features-README.md"
RESOLVE="$SKILL_DIR/scripts/resolve-regen-backlog.sh"
BAK_SUFFIX=".bak-skema-002"

is_legacy_v1_index() {
  local f="$1"
  [[ -f "$f" ]] || return 1
  grep -q 'Index auto-généré' "$f" 2>/dev/null
}

[[ -d "$FEATURES" ]] || { echo "erreur: pas de features/ dans ${ROOT}" >&2; exit 1; }
[[ -f "$TEMPLATE" ]] || { echo "erreur: template manquant ${TEMPLATE}" >&2; exit 1; }

README="$FEATURES/README.md"

# Resolve regen before any write — fail loud, no half-migrate.
REGEN="$("$RESOLVE" "$ROOT")"

if [[ -f "$README" ]] && grep -q '^layout_version:[[:space:]]*2' "$README" 2>/dev/null; then
  echo "README déjà layout_version: 2 — skip scaffold"
elif [[ -f "$README" ]] && ! is_legacy_v1_index "$README" && [[ "$FORCE" -ne 1 ]]; then
  echo "erreur: ${README} n'est pas un index v1 (pas de marqueur « Index auto-généré »)." >&2
  echo "        Rien écrasé (README curé / tombstone préservé)." >&2
  echo "        Relance avec --force si tu veux vraiment le remplacer (backup ${BAK_SUFFIX})." >&2
  exit 1
else
  if [[ -f "$README" ]]; then
    bak="${README}${BAK_SUFFIX}"
    cp "$README" "$bak"
    echo "sauvegarde → $bak"
  fi
  cp "$TEMPLATE" "$README"
  echo "README curé écrit → $README"
fi

bash "$REGEN" "$ROOT" "$TITLE"
echo "migration 002 appliquée (layout_version: 2)."
