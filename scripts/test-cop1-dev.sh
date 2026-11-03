#!/usr/bin/env bash
# DoD de cop1-dev.sh (fiche 20261102124306840) : un port mal écrit est refusé avant tout lancement.
#
# Les commandes que le lanceur appellerait ensuite (node, pnpm, lsof) sont remplacées par des
# leurres qui laissent une trace : un refus correct ne les appelle jamais.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/cop1-dev.sh"
SANDBOX="$(mktemp -d)"
trap 'rm -rf "$SANDBOX"' EXIT
mkdir -p "$SANDBOX/bin"
for cmd in node pnpm lsof; do
  printf '#!/usr/bin/env bash\necho %s >> "%s/appels"\nexit 1\n' "$cmd" "$SANDBOX" > "$SANDBOX/bin/$cmd"
  chmod +x "$SANDBOX/bin/$cmd"
done

FAILS=0
# <port web> <port daemon> <variable attendue dans le refus>
expect_refused() {
  local web="$1" daemon="$2" var="$3" out code
  rm -f "$SANDBOX/appels"
  out="$(PATH="$SANDBOX/bin:$PATH" COP1_WEB_PORT="$web" COP1_DAEMON_PORT="$daemon" \
    bash "$SCRIPT" --no-build 2>&1)"
  code=$?
  if [[ $code -ne 1 ]]; then
    echo "✗ web=$web daemon=$daemon : code $code, attendu 1"; FAILS=$((FAILS + 1)); return
  fi
  if [[ "$out" != *"port invalide : $var="* ]]; then
    echo "✗ web=$web daemon=$daemon : le refus ne nomme pas $var — $out"; FAILS=$((FAILS + 1)); return
  fi
  if [[ -e "$SANDBOX/appels" ]]; then
    echo "✗ web=$web daemon=$daemon : le lanceur a appelé $(tr '\n' ' ' < "$SANDBOX/appels")"
    FAILS=$((FAILS + 1)); return
  fi
  echo "✓ web=$web daemon=$daemon : refusé sur $var, rien lancé"
}

for bad in abc 0 65536 080 -1 "80 80" 1e3 99999; do
  expect_refused "$bad" 4399 COP1_WEB_PORT
done
expect_refused 5299 abc COP1_DAEMON_PORT # le port web valide passe, le daemon mal écrit est refusé
expect_refused 65535 0 COP1_DAEMON_PORT  # 65535 est la borne haute, valide

if (( FAILS > 0 )); then
  echo "❌ test-cop1-dev : $FAILS échec(s)"
  exit 1
fi
echo "✅ test-cop1-dev : un port mal écrit est refusé avant tout lancement"
