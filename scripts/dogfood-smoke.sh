#!/usr/bin/env bash
# Smoke dogfood époque 2 — sans session Claude Code / sans UI Moniteur.
# Usage (depuis la racine vectorz) : bash scripts/dogfood-smoke.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MC="$ROOT/products/mega-city"
COBAYE="$(mktemp -d "${TMPDIR:-/tmp}/vectorz-dogfood-XXXXXX")"
cleanup() { rm -rf "$COBAYE"; }
trap cleanup EXIT

echo "== dogfood-smoke =="
echo "root=$ROOT"
echo "cobaye=$COBAYE"

git -C "$COBAYE" init -q
git -C "$COBAYE" -c user.email=dogfood@local -c user.name=dogfood commit -q --allow-empty -m init

echo "-- lawgiver bind daily (projet jetable, pas ~/.claude)"
pnpm --dir "$MC" exec tsx bin/lawgiver.ts bind daily "$COBAYE"
test -d "$COBAYE/.claude" || { echo "FAIL: .claude absent après bind"; exit 1; }

echo "-- supervision:link + probe"
pnpm --dir "$MC" supervision:link "$COBAYE"
pnpm --dir "$MC" supervision:probe "$COBAYE"

echo "-- supervision-demo-run (journal sans LLM)"
pnpm --dir "$MC" exec tsx bin/supervision-demo-run.ts "$COBAYE"
RUN_DIR="$(find "$COBAYE/.supervision/runs" -mindepth 1 -maxdepth 1 -type d | head -1)"
test -n "$RUN_DIR" || { echo "FAIL: aucun run sous .supervision/runs"; exit 1; }
test -f "$RUN_DIR/events.jsonl" || { echo "FAIL: events.jsonl manquant"; exit 1; }

echo "-- journal-validator"
if [[ ! -f "$ROOT/products/cop1/packages/journal-validator/dist/cli.js" ]]; then
  pnpm --filter @cop1/journal-validator... build
fi
node "$ROOT/products/cop1/packages/journal-validator/dist/cli.js" validate "$RUN_DIR"

echo "-- archive portier --gate (sur vectorz, lecture seule)"
bash "$MC/skills/ezk-archive/scripts/check.sh" --gate --shipped none | tee /tmp/vectorz-archive-gate.txt
grep -E '^VERDICT:' /tmp/vectorz-archive-gate.txt >/dev/null

echo "-- daily profile présent"
test -f "$MC/profiles/daily.yml"

echo "OK dogfood-smoke (mécanique). Reste humain : Claude Code + MCP + Moniteur UI — docs/DOGFOOD.md §D"
