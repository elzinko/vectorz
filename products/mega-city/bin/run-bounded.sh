#!/usr/bin/env bash
# run-bounded.sh — exécute une commande sous un PLAFOND de temps, de façon PORTABLE (fiche 20261016203544694).
#
# EN CLAIR. « Lance cette commande, mais ne la laisse pas pendre. » Passé le plafond, on la tue et on
# rend le code 124 (la convention de `timeout`). Beaucoup de postes macOS n'ont ni `timeout` ni
# `gtimeout` : ce script les utilise s'ils sont là, sinon il surveille lui-même à la seconde et tue.
#
# Pourquoi il existe : `ezk-sprint close` committe un compte rendu via `commit-doc-via-worktree.sh`,
# qui compose `ship-merge.sh --local`, qui fait un `git fetch --prune` (ship-merge.sh:163). En
# worktree avec un remote configuré, ce fetch réseau peut pendre sans fin, et `close` ne rendait
# jamais la main (vécu sur tout le run v0.17). Borné ici, `close` scelle quand même (best-effort).
#
# Usage :
#   run-bounded.sh <secondes> <commande> [args…]
# Codes retour :
#   le code de la commande si elle finit à temps · 124 si le plafond l'a interrompue · 2 = erreur d'usage.
#
# Limite connue (repli sans `timeout`) : on tue le processus lancé, pas forcément toute sa
# descendance. Un enfant déjà bloqué sur le réseau (ex. `git fetch`) peut survivre quelques instants,
# réattaché à init, puis mourir de son propre délai réseau — `close`, lui, a déjà rendu son verdict.
set -uo pipefail

secs="${1:-}"
case "$secs" in
  ''|*[!0-9]*) echo "run-bounded.sh : 1er argument = un nombre de secondes (entier) ; reçu « $secs »" >&2; exit 2 ;;
esac
shift
[[ $# -ge 1 ]] || { echo "run-bounded.sh : aucune commande à lancer" >&2; exit 2; }

# Chemin heureux : un vrai `timeout` fait le travail (et tue le groupe de processus proprement).
if command -v timeout >/dev/null 2>&1; then exec timeout "$secs" "$@"; fi
if command -v gtimeout >/dev/null 2>&1; then exec gtimeout "$secs" "$@"; fi

# Repli portable : la commande en arrière-plan, surveillée à la seconde ; tuée au plafond.
"$@" &
pid=$!
waited=0
while kill -0 "$pid" 2>/dev/null; do
  if (( waited >= secs )); then
    # `disown` avant de tuer : le shell ne crache plus sa ligne « Terminated » sur stderr (sinon elle
    # polluerait la sortie best-effort de `close`). On force 124 sans `wait` — le code propre de la
    # commande ne nous intéresse plus, elle a dépassé le plafond.
    disown %+ 2>/dev/null || true
    kill -TERM "$pid" 2>/dev/null
    sleep 1
    kill -KILL "$pid" 2>/dev/null
    exit 124
  fi
  sleep 1
  waited=$(( waited + 1 ))
done
wait "$pid"
