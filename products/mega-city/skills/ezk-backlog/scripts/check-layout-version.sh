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
#   3. sinon 0 (inconnu / marqueur manquant) → STATUS=behind si CURRENT>0
# Ne PAS inférer 1 uniquement parce qu'un README ou BACKLOG.md existe
# (évite de masquer un half-migrate / marqueur absent).
set -euo pipefail

SKILL_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="${1:-.}"
ROOT="$(cd "$ROOT" && pwd)"

CURRENT="$(tr -d '[:space:]' < "$SKILL_DIR/migrations/VERSION")"
README="$ROOT/features/README.md"

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

# Legacy v1 : index généré dans README, pas de marqueur → traité comme 1.
# Sinon laisser 0 (inconnu / marqueur manquant) → STATUS=behind si CURRENT>0.
# Ne pas inférer INSTALLED=1 depuis BACKLOG.md ou un README quelconque
# (évite de masquer un half-migrate ; propose-then-apply).
if [[ "$INSTALLED" -eq 0 ]] \
  && [[ -f "$README" ]] \
  && grep -q 'Index auto-généré' "$README" 2>/dev/null; then
  INSTALLED=1
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
