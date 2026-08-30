#!/usr/bin/env bash
# DoD exécutable de la fiche 20260829123707100 (« labo de cuisine ») — MVP CAPTURE seule.
# AC1 : le gabarit SPRINT.md (ezk-sprint) porte la section « Galères & gestes (labo) ».
# AC2 : le format de session (ezk-archive) documente comment la figer (fiches: + section).
# AC3 : l'entrée demo réelle (samplerz 2026-08-29) existe, porte `fiches: 20260829123707100`,
#       et contient les 2 gestes vécus (Vercel Root Directory, DNS IONOS).
# AC4 : retrouvable par `grep -rl <id> docs/sessions/` (le lien fiche <-> récit — ADR-0018).
set -uo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"
ROOT="$(cd "$MC/../.." && pwd)"
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

SPRINT_SKILL="$MC/skills/ezk-sprint/SKILL.md"
ARCHIVE_SKILL="$MC/skills/ezk-archive/SKILL.md"
ARCHIVE_AGENT="$MC/agents/ezk-archive.md"
DEMO="$ROOT/docs/sessions/2026-08-29-samplerz-cablage-domaine.md"
FICHE_ID="20260829123707100"

echo "AC1 — gabarit SPRINT.md (ezk-sprint) porte la section labo :"
check "SKILL.md ezk-sprint existe" '[ -f "$SPRINT_SKILL" ]'
check "le gabarit cite '## Galères & gestes (labo)'" \
  'grep -qF "## Galères & gestes (labo)" "$SPRINT_SKILL"'

echo "AC2 — ezk-archive documente la capture à la clôture :"
check "SKILL.md ezk-archive existe" '[ -f "$ARCHIVE_SKILL" ]'
check "le rituel de clôture cite la section labo à archiver" \
  'grep -qF "Galères & gestes (labo)" "$ARCHIVE_SKILL"'
check "le rituel de clôture cite le champ d'\''entête \`fiches:\`" \
  'grep -qF "fiches:" "$ARCHIVE_SKILL"'

echo "AC2bis — l'AGENT ezk-archive est à parité avec le SKILL (chemin délégué DIRTY) :"
check "l'agent ezk-archive existe" '[ -f "$ARCHIVE_AGENT" ]'
check "l'agent cite le champ d'\''entête \`fiches:\`" \
  'grep -qF "fiches:" "$ARCHIVE_AGENT"'
check "l'agent cite la section labo à archiver" \
  'grep -qF "Galères & gestes (labo)" "$ARCHIVE_AGENT"'

echo "AC3 — l'entrée demo réelle (samplerz 2026-08-29) existe et porte la matière :"
check "le récit demo existe" '[ -f "$DEMO" ]'
check "porte l'entête \`fiches: $FICHE_ID\`" \
  'grep -qE "^fiches: *$FICHE_ID" "$DEMO"'
check "porte la section '## Galères & gestes (labo)'" \
  'grep -qF "## Galères & gestes (labo)" "$DEMO"'
check "décrit le geste Vercel (Root Directory)" \
  'grep -qi "Root Directory" "$DEMO"'
check "décrit le geste DNS IONOS" \
  'grep -qi "IONOS" "$DEMO" && grep -qi "DNS" "$DEMO"'

echo "AC4 — retrouvable par id (le lien fiche <-> récit, ADR-0018) :"
check "grep -rl <id> docs/sessions/ retrouve le récit" \
  '[ -n "$(grep -rl "$FICHE_ID" "$ROOT/docs/sessions/" 2>/dev/null)" ]'

if [ "$FAIL" -eq 0 ]; then echo "test-labo-cuisine : TOUS VERTS"; else echo "test-labo-cuisine : DES ÉCHECS"; exit 1; fi
