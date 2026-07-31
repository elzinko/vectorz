#!/usr/bin/env bash
# check-pr-body.sh — vérifie qu'un corps de PR porte les 3 blocs 0079.
# Usage:
#   bash check-pr-body.sh                 # lit stdin
#   bash check-pr-body.sh path/to/body.md
#   gh pr view N --json body -q .body | bash check-pr-body.sh
set -euo pipefail

if [[ $# -ge 1 && -f "$1" ]]; then
  body=$(cat "$1")
else
  body=$(cat)
fi

missing=()
for heading in '## Summary' '## Lien fiche' '## Comment tester'; do
  if ! grep -qF "$heading" <<<"$body"; then
    missing+=("$heading")
  fi
done

if ((${#missing[@]})); then
  echo "PR body incomplete (fiche 0079) — missing:" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "OK — Summary + Lien fiche + Comment tester présents"
