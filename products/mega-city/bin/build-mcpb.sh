#!/usr/bin/env bash
# build-mcpb.sh — construit le bundle Claude Desktop « un double-clic » de l'émetteur
# de supervisabilité (fiche 0078). Produit dist/vectorz-supervision.mcpb :
#   manifest.json (spec MCPB manifest_version 0.3, user_config type directory)
#   server/index.js (serveur MCP bundlé par esbuild — AUCUN prérequis pnpm/tsx côté
#   utilisateur : Claude Desktop le lance avec son propre Node)
# usage : bash products/mega-city/bin/build-mcpb.sh   (depuis la racine vectorz)
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MC="$ROOT/products/mega-city"
OUT="$MC/dist/mcpb"
ESBUILD="$ROOT/node_modules/.pnpm/node_modules/.bin/esbuild"
VERSION="$(node -p "require('$MC/package.json').version || '0.1.0'")"

[ -x "$ESBUILD" ] || { echo "esbuild introuvable ($ESBUILD) — pnpm install d'abord" >&2; exit 1; }

rm -rf "$OUT" && mkdir -p "$OUT/server"

# 1. Bundler le serveur (ESM autonome : deps inlinées, pas de node_modules à livrer ;
#    top-level await du point d'entrée ⇒ ESM, d'où le package.json type:module + un
#    shim require pour les deps CJS inlinées).
"$ESBUILD" "$MC/bin/supervision-mcp.ts" \
  --bundle --platform=node --format=esm --target=node18 \
  --banner:js="import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);" \
  --outfile="$OUT/server/index.js" --log-level=warning
printf '{ "type": "module" }\n' > "$OUT/package.json"

# 2. Le manifest (spec https://github.com/anthropics/mcpb — manifest_version 0.3).
cat > "$OUT/manifest.json" <<MANIFEST
{
  "manifest_version": "0.3",
  "name": "vectorz-supervision",
  "display_name": "Journal de supervision vectorz",
  "version": "0.1.0",
  "description": "La boîte noire des méthodes autonomes : enregistre chaque décision (démarrage, jalon, reprise, alerte, fin) dans un journal local du projet supervisé.",
  "author": { "name": "vectorz" },
  "server": {
    "type": "node",
    "entry_point": "server/index.js",
    "mcp_config": {
      "command": "node",
      "args": ["\${__dirname}/server/index.js"],
      "env": { "SUPERVISION_PROJECT_ROOT": "\${user_config.project_root}" }
    }
  },
  "user_config": {
    "project_root": {
      "type": "directory",
      "title": "Projet à superviser",
      "description": "Le dossier du projet dont les décisions seront enregistrées (le journal .supervision/ y sera écrit).",
      "required": true
    }
  }
}
MANIFEST

# 3. Zipper (un .mcpb est une archive zip, manifest.json à la racine).
( cd "$OUT" && rm -f ../vectorz-supervision.mcpb && zip -qr ../vectorz-supervision.mcpb manifest.json package.json server )
echo "OK → $MC/dist/vectorz-supervision.mcpb"
