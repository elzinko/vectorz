#!/usr/bin/env bash
# ezk-diagram — rend un diagramme Mermaid (.mmd) en image SVG.
# Transformation DÉTERMINISTE (ADR-0001 : le LLM génère le .mmd, le script rend l'image).
# Le LLM n'appelle jamais mmdc à la main — il passe par ce script.
#
# usage : render.sh <input.mmd> [output.svg]
#   - défaut output = <input sans .mmd>.svg
#   - sortie stdout = chemin de l'image produite (pour capture par l'appelant)
#   - fallback gracieux : si mmdc/npx absents ou échec, garde le .mmd, message sur stderr, exit != 0
set -euo pipefail

usage() { echo "usage: render.sh <input.mmd> [output.svg]" >&2; exit 2; }
[ "$#" -ge 1 ] || usage

IN="$1"
[ -f "$IN" ] || { echo "render: fichier introuvable: $IN" >&2; exit 1; }
OUT="${2:-${IN%.mmd}.svg}"

# Résout le moteur mermaid : binaire mmdc sur le PATH, sinon npx (mermaid-cli).
if command -v mmdc >/dev/null 2>&1; then
  RENDER=(mmdc)
elif command -v npx >/dev/null 2>&1; then
  RENDER=(npx --yes @mermaid-js/mermaid-cli)
else
  {
    echo "render: mmdc/npx absents — .mmd conservé ($IN), image NON générée."
    echo "  → installe mermaid-cli (npm i -g @mermaid-js/mermaid-cli),"
    echo "    ou rends le .mmd via un MCP mermaid / l'outil visualize."
  } >&2
  exit 3
fi

if "${RENDER[@]}" -i "$IN" -o "$OUT" >/dev/null 2>&1; then
  echo "$OUT"
else
  echo "render: échec du rendu Mermaid sur $IN (.mmd conservé, image non produite)." >&2
  exit 4
fi
