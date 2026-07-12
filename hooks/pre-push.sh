#!/usr/bin/env bash
# Local-CI-before-push gate — installed by `iamthelaw setup claude` (ci-cd ruleset).
# Niveau-2 enforcement of the `local-reproduction` rule: run the project's local
# CI entrypoint BEFORE a push and block on failure.
# Defensive: if no entrypoint is detected, it warns and lets the push through
# (better a warning than blocking a project that has no local-CI command).
set -uo pipefail

fail() { echo "❌ push bloqué (iamthelaw / ci-cd / local-reproduction) : '$1' a échoué."; exit 1; }

if [ -f Makefile ] && grep -qE '^(ci-local|ci|validate):' Makefile; then
  t=$(grep -oE '^(ci-local|ci|validate):' Makefile | head -n1 | tr -d ':')
  echo "▶ make $t"; make "$t" || fail "make $t"
elif [ -f package.json ] && grep -qE '"(ci:local|ci|validate)"[[:space:]]*:' package.json; then
  s=$(grep -oE '"(ci:local|ci|validate)"' package.json | head -n1 | tr -d '"')
  pm=npm; [ -f pnpm-lock.yaml ] && pm=pnpm; [ -f yarn.lock ] && pm=yarn
  echo "▶ $pm run $s"; "$pm" run "$s" || fail "$pm run $s"
elif command -v act >/dev/null 2>&1 && [ -d .github/workflows ]; then
  echo "▶ act -n (dry-run)"; act -n || fail "act -n"
else
  echo "⚠ iamthelaw/ci-cd : aucun entrypoint CI local détecté (make ci-local | pnpm ci:local | act) — push autorisé sans gate."
fi
exit 0
