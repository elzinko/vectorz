#!/usr/bin/env bash
# DoD exécutable de l'app de démonstration d'ezk-scout (fiche 20260910165637000).
# `examples/demo-app.mjs` porte des défauts VOLONTAIRES : l'exemple de rapport livré
# (`examples/demo-report.md`) les décrit, donc ils doivent rester là, rejouables. Ce test
# démarre l'app sur un port libre, dans un état et un HOME jetables, et rejoue chaque défaut.
# Il prouve aussi l'isolation : rien n'est écrit sous le HOME (jetable) de l'app.
set -uo pipefail

APP="$(cd "$(dirname "$0")/../examples" && pwd)/demo-app.mjs"
TMP="$(mktemp -d)"
PID=""
cleanup() { [ -n "$PID" ] && kill "$PID" 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

mkdir -p "$TMP/home"
touch "$TMP/un-fichier"
HOME="$TMP/home" DEMO_STATE_DIR="$TMP/etat" PORT=0 node "$APP" > "$TMP/out.log" 2>&1 &
PID=$!
disown "$PID" 2>/dev/null || true # pas de message « Terminated » à l arrêt (le résumé reste la dernière ligne)

PORT=""
for _ in $(seq 1 50); do
  PORT="$(sed -n 's/.*listening on \([0-9][0-9]*\).*/\1/p' "$TMP/out.log" 2>/dev/null | head -1)"
  [ -n "$PORT" ] && break
  sleep 0.1
done
check "l'app démarre et annonce son port" "[ -n '$PORT' ]"
[ -n "$PORT" ] || { echo "demo-app : ÉCHEC (app non démarrée)"; exit 1; }

code() { # $1=méthode $2=chemin $3=corps JSON (vide = aucun) → code HTTP
  if [ -n "${3:-}" ]; then
    curl -s -o /dev/null -w '%{http_code}' -X "$1" "http://127.0.0.1:$PORT$2" -d "$3"
  else
    curl -s -o /dev/null -w '%{http_code}' -X "$1" "http://127.0.0.1:$PORT$2"
  fi
}

echo "Nominal :"
check "GET /health → 200"                          "[ \"\$(code GET /health)\" = 200 ]"
check "POST /export {bpm:120} → 200"               "[ \"\$(code POST /export '{\"bpm\":120}')\" = 200 ]"

echo "Défauts connus (la cible de la passe) :"
check "n°1 export bpm=0 → 500 au lieu de 400"      "[ \"\$(code POST /export '{\"bpm\":0}')\" = 500 ]"
check "n°1 export bpm=-5 → 500 au lieu de 400"     "[ \"\$(code POST /export '{\"bpm\":-5}')\" = 500 ]"
check "n°2 export dossier non inscriptible → 500"  "[ \"\$(code POST /export '{\"bpm\":120,\"dir\":\"$TMP/un-fichier/sous\"}')\" = 500 ]"
check "n°3 crop fin < début → 200 au lieu de 400"  "[ \"\$(code POST /crop '{\"start\":9,\"end\":2}')\" = 200 ]"
check "n°3 la durée renvoyée est négative (-7)"    "curl -s -X POST 'http://127.0.0.1:$PORT/crop' -d '{\"start\":9,\"end\":2}' | grep -q '\"duration\":-7'"

echo "Isolation de l'état :"
check "l'export nominal est sous DEMO_STATE_DIR"   "[ -f '$TMP/etat/exports/export.txt' ]"
check "rien n'est écrit sous le HOME de l'app"     "[ -z \"\$(ls -A '$TMP/home')\" ]"

echo
if [ "$FAIL" -eq 0 ]; then echo "demo-app : tous les cas passent."; else echo "demo-app : ÉCHEC."; fi
exit "$FAIL"
