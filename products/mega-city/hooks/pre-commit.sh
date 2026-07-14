#!/usr/bin/env bash
# TypeScript gate — installed by `iamthelaw setup claude` (typescript-2026 ruleset).
# Niveau-2 enforcement of `strict-config`: typecheck (+ lint if present) before a
# commit; blocks on error. Defensive: skips quietly if it isn't a TS project.
set -uo pipefail
[ -f tsconfig.json ] || exit 0   # not a TS project → nothing to enforce

pm=npm; [ -f pnpm-lock.yaml ] && pm=pnpm; [ -f yarn.lock ] && pm=yarn
fail() { echo "❌ commit bloqué (iamthelaw / typescript-2026 / strict-config) : '$1' a échoué."; exit 1; }

if [ -f package.json ] && grep -qE '"typecheck"[[:space:]]*:' package.json; then
  echo "▶ $pm run typecheck"; "$pm" run typecheck || fail "$pm run typecheck"
elif command -v npx >/dev/null 2>&1; then
  echo "▶ npx tsc --noEmit"; npx --no-install tsc --noEmit || fail "tsc --noEmit"
fi

if [ -f package.json ] && grep -qE '"lint"[[:space:]]*:' package.json; then
  echo "▶ $pm run lint"; "$pm" run lint || fail "$pm run lint"
fi
exit 0
