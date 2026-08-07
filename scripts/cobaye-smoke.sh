#!/usr/bin/env bash
# Cobaye smoke Pareto (fiche 0041) — mécanique dogfood + Moniteur Playwright.
# Usage (racine vectorz) : bash scripts/cobaye-smoke.sh
# Prérequis : pnpm install && pnpm build && pnpm --filter @cop1/web build
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

COBAYE="$ROOT/cobaye"
DAEMON_CLI="$ROOT/products/cop1/packages/app/dist/cli/index.js"
WEB_DIST="$ROOT/products/cop1/packages/web/dist"
SMOKE_HOME="$(mktemp -d "${TMPDIR:-/tmp}/vectorz-cobaye-smoke-XXXXXX")"
DAEMON_PORT="${COBAYE_DAEMON_PORT:-$((4200 + RANDOM % 200))}"
WEB_PORT="${COBAYE_WEB_PORT:-$((5200 + RANDOM % 200))}"
WEB_PID=""

cleanup() {
  if [[ -n "$WEB_PID" ]] && kill -0 "$WEB_PID" 2>/dev/null; then
    kill "$WEB_PID" 2>/dev/null || true
    wait "$WEB_PID" 2>/dev/null || true
  fi
  if [[ -f "$DAEMON_CLI" ]]; then
    (cd "$SMOKE_HOME" && node "$DAEMON_CLI" stop >/dev/null 2>&1) || true
  fi
  rm -rf "$SMOKE_HOME"
}
trap cleanup EXIT

run_moniteur_smoke() {
  local url="$1"
  node "$ROOT/scripts/e2e/moniteur-smoke.mjs" "$url"
}

echo "== cobaye-smoke =="
echo "cobaye=$COBAYE"
echo "smoke_home=$SMOKE_HOME"
echo "daemon_port=$DAEMON_PORT web_port=$WEB_PORT"

[[ -f "$DAEMON_CLI" ]] || { echo "FAIL: build manquant ($DAEMON_CLI) — lance pnpm build"; exit 1; }
[[ -d "$WEB_DIST" ]] || { echo "FAIL: web dist manquant — lance pnpm --filter @cop1/web build"; exit 1; }
[[ -f "$COBAYE/fixtures/seed-run/events.jsonl" ]] || { echo "FAIL: fixture seed absente"; exit 1; }

echo "-- reset cobaye"
bash "$COBAYE/reset.sh"

echo "-- seed fixtures → cobaye/.supervision/runs/"
SEED_ID="cobaye-seed-run"
mkdir -p "$COBAYE/.supervision/runs/$SEED_ID"
cp "$COBAYE/fixtures/seed-run/events.jsonl" "$COBAYE/.supervision/runs/$SEED_ID/events.jsonl"

echo "-- dogfood mécanique (projet jetable, indépendant du banc)"
bash "$ROOT/scripts/dogfood-smoke.sh"

echo "-- preuve de porte (sabotage) : smoke contre URL morte → doit échouer"
if run_moniteur_smoke "http://127.0.0.1:9/" >/tmp/cobaye-sabotage.log 2>&1; then
  echo "FAIL: moniteur-smoke a passé sur une URL morte (porte cassée)"
  cat /tmp/cobaye-sabotage.log
  exit 1
fi
echo "   porte OK (échec attendu sur :9)"

echo "-- config daemon isolée (watch_roots = cobaye)"
cat >"$SMOKE_HOME/cop1.config.yaml" <<EOF
daemon:
  port: ${DAEMON_PORT}
supervision:
  watch_roots:
    - ${COBAYE}
EOF

echo "-- start daemon (cwd=$SMOKE_HOME)"
(cd "$SMOKE_HOME" && node "$DAEMON_CLI" start --port "$DAEMON_PORT")

echo "-- wait /health"
for _ in $(seq 1 50); do
  if curl -fsS --max-time 1 "http://127.0.0.1:${DAEMON_PORT}/health" >/dev/null 2>&1; then
    break
  fi
  sleep 0.2
done
curl -fsS "http://127.0.0.1:${DAEMON_PORT}/health" >/dev/null

echo "-- sanity API runs"
RUNS_JSON="[]"
for _ in $(seq 1 50); do
  RUNS_JSON="$(curl -fsS --max-time 2 "http://127.0.0.1:${DAEMON_PORT}/api/supervision/runs" 2>/dev/null || echo '[]')"
  if echo "$RUNS_JSON" | grep -qE '"runId"|"projectRoot"'; then
    break
  fi
  sleep 0.2
done
echo "$RUNS_JSON" | grep -qE '"runId"|"projectRoot"' || {
  echo "FAIL: runs API vide ou inattendu après attente: $RUNS_JSON"
  exit 1
}

echo "-- start web (vite dev + proxy → daemon)"
(
  cd "$ROOT/products/cop1/packages/web"
  VITE_DAEMON_PORT="$DAEMON_PORT" pnpm exec vite --host 127.0.0.1 --port "$WEB_PORT" --strictPort
) >/tmp/cobaye-web.log 2>&1 &
WEB_PID=$!

echo "-- wait Moniteur"
for _ in $(seq 1 60); do
  if curl -fsS --max-time 1 "http://127.0.0.1:${WEB_PORT}/" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done
curl -fsS "http://127.0.0.1:${WEB_PORT}/" >/dev/null

echo "-- moniteur-smoke Playwright"
if [[ "${CI:-}" == "true" ]]; then
  pnpm exec playwright install --with-deps chromium >/tmp/cobaye-pw-install.log 2>&1 || {
    echo "FAIL: playwright install chromium (CI)"
    tail -40 /tmp/cobaye-pw-install.log
    exit 1
  }
else
  pnpm exec playwright install chromium >/tmp/cobaye-pw-install.log 2>&1 || {
    echo "FAIL: playwright install chromium"
    tail -40 /tmp/cobaye-pw-install.log
    exit 1
  }
fi
run_moniteur_smoke "http://127.0.0.1:${WEB_PORT}/"

echo "OK cobaye-smoke"
