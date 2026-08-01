#!/usr/bin/env bash
# Skema migration 002 — applique README curé + regen BACKLOG.md (layout v1 → v2).
# Usage : apply-002-readme-vs-backlog.sh [racine] [titre-index]
# Idempotent sur le scaffold README (n'écrase PAS un README déjà layout_version: 2).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"
TITLE="${2:-Backlog features & bugs}"
FEATURES="$ROOT/features"
TEMPLATE="$SKILL_DIR/templates/features-README.md"

[[ -d "$FEATURES" ]] || { echo "erreur: pas de features/ dans ${ROOT}" >&2; exit 1; }
[[ -f "$TEMPLATE" ]] || { echo "erreur: template manquant ${TEMPLATE}" >&2; exit 1; }

# Localiser regen-backlog.sh (monorepo vectorz ou copie locale)
REGEN=""
if [[ -x "$ROOT/products/mega-city/bin/regen-backlog.sh" ]]; then
  REGEN="$ROOT/products/mega-city/bin/regen-backlog.sh"
elif [[ -x "$ROOT/bin/regen-backlog.sh" ]]; then
  REGEN="$ROOT/bin/regen-backlog.sh"
else
  # skill embarquée dans mega-city : remonter jusqu'au bin du produit
  CANDIDATE="$(cd "$SKILL_DIR/../.." && pwd)/bin/regen-backlog.sh"
  [[ -x "$CANDIDATE" ]] && REGEN="$CANDIDATE"
fi
[[ -n "$REGEN" ]] || { echo "erreur: regen-backlog.sh introuvable" >&2; exit 1; }

README="$FEATURES/README.md"
if [[ -f "$README" ]] && grep -q '^layout_version:[[:space:]]*2' "$README" 2>/dev/null; then
  echo "README déjà layout_version: 2 — skip scaffold"
else
  # Si l'ancien README est un index généré, le laisser écraser par le scaffold.
  cp "$TEMPLATE" "$README"
  echo "README curé écrit → $README"
fi

bash "$REGEN" "$ROOT" "$TITLE"
echo "migration 002 appliquée (layout_version: 2)."
