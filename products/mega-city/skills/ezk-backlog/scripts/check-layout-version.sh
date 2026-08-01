#!/usr/bin/env bash
# Skema — compare layout_version projet vs skill ; liste les migrations pending.
# Usage : check-layout-version.sh [racine-projet]
# Sortie machine (une ligne) :
#   CURRENT=<n> INSTALLED=<n|0> PENDING=<csv|none> STATUS=ok|behind|ahead|missing
# Exit 0 toujours (sauf usage) — le statut passe par stdout (comme ezk-archive gate).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"

CURRENT="$(tr -d '[:space:]' < "$SKILL_DIR/migrations/VERSION")"
README="$ROOT/features/README.md"
BACKLOG="$ROOT/features/BACKLOG.md"

if [[ ! -d "$ROOT/features" ]]; then
  echo "CURRENT=${CURRENT} INSTALLED=0 PENDING=none STATUS=missing"
  exit 0
fi

INSTALLED=0
if [[ -f "$README" ]]; then
  INSTALLED="$(awk '
    BEGIN { infm=0; v=0 }
    /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
    infm==1 && $0 ~ /^layout_version:/ {
      sub(/^layout_version:[[:space:]]*/, "")
      sub(/[[:space:]]*#.*$/, "")
      v=$0+0
    }
    END { print v+0 }
  ' "$README")"
fi

# Legacy v1 : index généré dans README, pas de marqueur → traité comme 1
if [[ "$INSTALLED" -eq 0 ]]; then
  if [[ -f "$README" ]] && grep -q 'Index auto-généré' "$README" 2>/dev/null; then
    INSTALLED=1
  elif [[ -f "$BACKLOG" ]]; then
    # BACKLOG présent sans marqueur : probablement v2 partiel — forcer check
    INSTALLED=1
  elif [[ -f "$README" ]]; then
    INSTALLED=1
  fi
fi

PENDING=""
for f in "$SKILL_DIR"/migrations/[0-9][0-9][0-9]-*.md; do
  [[ -e "$f" ]] || continue
  base="$(basename "$f" .md)"
  num="${base%%-*}"
  num=$((10#$num))
  if (( num > INSTALLED && num <= CURRENT )); then
    PENDING="${PENDING}${PENDING:+,}${base}"
  fi
done
[[ -z "$PENDING" ]] && PENDING=none

STATUS=ok
if (( INSTALLED < CURRENT )); then STATUS=behind
elif (( INSTALLED > CURRENT )); then STATUS=ahead
fi

echo "CURRENT=${CURRENT} INSTALLED=${INSTALLED} PENDING=${PENDING} STATUS=${STATUS}"
