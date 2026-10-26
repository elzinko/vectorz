#!/usr/bin/env bash
# cop1-dev.sh — lance le dashboard cop1 en local, dans le BON ORDRE.
#
# En clair : build → daemon → (on ATTEND qu'il réponde) → web. Comme le web attend
# le daemon, on n'a plus le piège « échantillon · live indisponible » du démarrage
# (le web qui charge avant que le daemon réponde, reste collé sur le décor figé).
#
# Usage :  pnpm cop1:dev            # build + daemon + web
#          pnpm cop1:dev --no-build # saute la compilation (daemon + web seulement)
#
# Ports réglables (défauts choisis HORS des ports de muti, 5173) :
#   COP1_DAEMON_PORT   (défaut 4343)  — le daemon qui sert /api/board
#   COP1_WEB_PORT      (défaut 5273)  — le serveur web (vite dev)
#
# Le daemon tourne en arrière-plan ; Ctrl-C arrête le web ET le daemon (pas de
# processus qui traîne).
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

DAEMON_PORT="${COP1_DAEMON_PORT:-4343}"
WEB_PORT="${COP1_WEB_PORT:-5273}"
BUILD=1
for arg in "$@"; do
  [ "$arg" = "--no-build" ] && BUILD=0
done

if [ "$BUILD" = "1" ]; then
  echo "▶ build cop1 (tsc -b) — pour que le daemon serve le code à jour…"
  pnpm build
fi

echo "▶ daemon cop1 → port $DAEMON_PORT (lit supervision.registry.yaml à la racine)"
node products/cop1/packages/app/dist/cli/daemon-entry.js --port "$DAEMON_PORT" &
DAEMON_PID=$!

# Arrête le daemon quand on quitte (Ctrl-C), pour ne pas le laisser traîner.
cleanup() {
  echo
  echo "▶ arrêt du daemon (pid $DAEMON_PID)"
  kill "$DAEMON_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# Attends que le daemon réponde AVANT de lancer le web (c'est ça qui tue le « live indisponible »).
echo "▶ attente du daemon…"
for i in $(seq 1 40); do
  if curl -s -o /dev/null "http://127.0.0.1:$DAEMON_PORT/api/board"; then
    echo "  daemon prêt."
    break
  fi
  if [ "$i" = "40" ]; then
    echo "  ⚠ daemon pas prêt après 20 s — on lance le web quand même (recharge la page ensuite)."
  fi
  sleep 0.5
done

echo "▶ web cop1 → http://localhost:$WEB_PORT   (proxy /api → daemon $DAEMON_PORT)"
echo "   Ouvre cette adresse, PAS le 4173 (qui est l'aperçu statique = échantillon)."
PORT="$WEB_PORT" VITE_DAEMON_PORT="$DAEMON_PORT" pnpm --dir products/cop1/packages/web dev
