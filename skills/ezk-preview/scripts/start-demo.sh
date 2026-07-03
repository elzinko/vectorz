#!/usr/bin/env bash
# Open a Cloudflare quick tunnel to a local dev server and print the public URL.
# Usage: start-demo.sh [port]   (auto-detects a common dev port if omitted)
set -uo pipefail

port="${1:-}"
if [ -z "$port" ]; then
  for p in 3000 5173 8080 4321 3080 8000 4200; do
    if lsof -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then
      port="$p"
      break
    fi
  done
fi

if [ -z "$port" ]; then
  echo "❌ Aucun dev server en écoute détecté. Lance ton app, puis : start-demo.sh <port>" >&2
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "❌ cloudflared manquant → 'brew install cloudflared' (macOS), sinon https://github.com/cloudflare/cloudflared" >&2
  exit 1
fi

echo "▶ Tunnel Cloudflare → http://localhost:$port   (Ctrl-C pour arrêter)"
exec cloudflared tunnel --url "http://localhost:$port"
