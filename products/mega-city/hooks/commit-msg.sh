#!/usr/bin/env bash
# Conventional Commits gate — installed by `iamthelaw setup claude`.
# Niveau-2 enforcement (deterministic, blocking) of the `format` rule.
set -euo pipefail
msg_file="$1"

first_line="$(grep -vE '^[[:space:]]*#' "$msg_file" | grep -vE '^[[:space:]]*$' | head -n1 || true)"
pattern='^(feat|fix|docs|style|refactor|perf|test|build|ci|chore|revert)(\([a-z0-9 ._/-]+\))?(!)?: .+'

# Let auto-generated merge/revert messages through.
if [[ "$first_line" =~ ^(Merge|Revert) ]]; then
  exit 0
fi

if [[ "$first_line" =~ $pattern ]]; then
  exit 0
fi

echo "❌ Commit rejected — Conventional Commits required (iamthelaw / rule 'format')."
echo "   Got     : $first_line"
echo "   Expected: <type>(scope)?: description    e.g. 'feat(auth): add login'"
echo "   types   : feat fix docs style refactor perf test build ci chore revert"
exit 1
