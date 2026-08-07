#!/usr/bin/env bash
# Remet le banc cobaye à l'état vierge (runtime uniquement — fixtures conservées).
# Usage : bash cobaye/reset.sh   (depuis n'importe où)
set -euo pipefail

COBAYE="$(cd "$(dirname "$0")" && pwd)"

rm -rf \
  "$COBAYE/.supervision" \
  "$COBAYE/.claude" \
  "$COBAYE/.cop1" \
  "$COBAYE/.mcp.json" \
  "$COBAYE/node_modules"

# Artefacts locaux éventuels (screenshots, logs)
find "$COBAYE" -maxdepth 1 \( -name 'cobaye-*.png' -o -name '*.log' \) -delete 2>/dev/null || true

echo "cobaye reset OK — $COBAYE"
