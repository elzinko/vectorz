#!/usr/bin/env bash
# DoD exécutable — `retro:reports` liste les comptes rendus de sprint depuis la dernière capture
# (fiche 20261008072306360, ADR-0068). La logique pure est prouvée dans src/__tests__/sprint-reports-since.test.ts ;
# ici on vérifie le bord réel (lit docs/captures/ + docs/sprints/ d'un projet), dont le cas « deux sessions ».
set -uo pipefail

MC="$(cd "$(dirname "$0")/.." && pwd)"
TSX="$MC/node_modules/.bin/tsx"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT
FAIL=0
ok() { if ( set +o pipefail; eval "$2" ); then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

mkdir -p "$ROOT/docs/captures" "$ROOT/docs/sprints"
: > "$ROOT/docs/captures/2026-10-07-retro-socle.md"
: > "$ROOT/docs/sprints/2026-10-05-sprint-vieux.md"                 # avant la capture → écarté
: > "$ROOT/docs/sprints/2026-10-08-sprint-session-un.md"           # après → gardé
: > "$ROOT/docs/sprints/2026-10-08-sprint-session-deux.md"         # même jour, AUTRE session → gardé
run() { "$TSX" "$MC/bin/retro-reports.ts" --root "$ROOT" 2>/dev/null; }

echo "R — liste les comptes rendus depuis la dernière capture, y compris deux sessions :"
OUT="$(run)"
ok "le compte rendu antérieur à la capture est écarté" "! printf '%s' \"\$OUT\" | grep -q 'sprint-vieux'"
ok "le compte rendu de la session un est listé"         "printf '%s' \"\$OUT\" | grep -q 'docs/sprints/2026-10-08-sprint-session-un.md'"
ok "le compte rendu de la session deux (même jour) est listé" "printf '%s' \"\$OUT\" | grep -q 'docs/sprints/2026-10-08-sprint-session-deux.md'"

echo "V — sans aucune capture : tous les comptes rendus sont listés :"
rm -f "$ROOT/docs/captures/2026-10-07-retro-socle.md"
OUT2="$(run)"
ok "le plus ancien réapparaît (aucune capture pour borner)" "printf '%s' \"\$OUT2\" | grep -q 'sprint-vieux'"

echo
if (( FAIL )); then echo "test-retro-reports: ÉCHECS"; exit 1; fi
echo "test-retro-reports: TOUT VERT"
