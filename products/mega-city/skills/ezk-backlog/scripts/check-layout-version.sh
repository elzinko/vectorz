#!/usr/bin/env bash
# Skema — compare layout_version projet vs skill ; liste les migrations pending.
# Usage : check-layout-version.sh [racine-projet]
# Sortie machine (une ligne) :
#   CURRENT=<n> INSTALLED=<n|0> PENDING=<csv|none> STATUS=ok|behind|ahead|missing
# Exit 0 toujours (sauf usage) — le statut passe par stdout (comme ezk-archive gate).
#
# Détection INSTALLED (ordre) :
#   1. front-matter layout_version de features/README.md
#   2. legacy v1 : README contient « Index auto-généré » → INSTALLED=1
#   3. sinon 0 (inconnu / curé sans marqueur / tombstone) → STATUS=ok, PENDING=none
#      — ne PAS proposer de migration destructrice sans preuve d'index v1
# Ne PAS inférer 1 uniquement parce qu'un README ou BACKLOG.md existe.
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT_ARG="${1:-.}"

CURRENT="$(tr -d '[:space:]' < "$SKILL_DIR/migrations/VERSION")"

emit() {
  echo "CURRENT=${CURRENT} INSTALLED=${1} PENDING=${2} STATUS=${3}"
}

if ! ROOT="$(cd "$ROOT_ARG" 2>/dev/null && pwd)"; then
  emit 0 none missing
  exit 0
fi

README="$ROOT/features/README.md"

if [[ ! -d "$ROOT/features" ]]; then
  emit 0 none missing
  exit 0
fi

# features/ présent mais pas de README → init, pas migrer
if [[ ! -f "$README" ]]; then
  emit 0 none missing
  exit 0
fi

INSTALLED=0
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

# Legacy v1 : index généré dans README, pas de marqueur → traité comme 1.
if [[ "$INSTALLED" -eq 0 ]] \
  && grep -q 'Index auto-généré' "$README" 2>/dev/null; then
  INSTALLED=1
fi

# Inconnu / curé / tombstone sans layout_version : ne pas proposer 002.
if [[ "$INSTALLED" -eq 0 ]]; then
  emit 0 none ok
  exit 0
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

emit "$INSTALLED" "$PENDING" "$STATUS"
