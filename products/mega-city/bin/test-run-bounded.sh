#!/usr/bin/env bash
# DoD exécutable — run-bounded.sh borne une commande sans jamais pendre (fiche 20261016203544694).
# Prouve les deux bords : une commande rapide rend son propre code ; une commande qui pend est tuée
# au plafond (code 124) en bien moins que sa durée. C'est le garde-fou qui rend `ezk-sprint close`
# increvable en worktree.
set -uo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
RB="$HERE/run-bounded.sh"
FAIL=0
pass() { echo "  ok — $1"; }
ko() { echo "  KO — $1" >&2; FAIL=1; }

[[ -f "$RB" ]] || { echo "test-run-bounded: run-bounded.sh introuvable ($RB)"; exit 1; }

# 1) Commande rapide : finit avant le plafond, rend 0.
if bash "$RB" 5 true; then pass "commande rapide rend 0"; else ko "commande rapide aurait dû rendre 0"; fi

# 2) Code de sortie transmis tel quel quand la commande finit à temps.
bash "$RB" 5 sh -c 'exit 3'; rc=$?
(( rc == 3 )) && pass "code de sortie transmis (3)" || ko "code attendu 3, reçu $rc"

# 3) Commande qui pend : tuée au plafond → 124, en bien moins que la durée de la commande.
start=$(date +%s)
bash "$RB" 2 sleep 30; rc=$?
elapsed=$(( $(date +%s) - start ))
(( rc == 124 )) && pass "plafond atteint → code 124" || ko "code attendu 124, reçu $rc"
(( elapsed < 12 )) && pass "interrompu en ${elapsed}s (jamais la durée pleine)" || ko "trop long : ${elapsed}s"

# 4) Usage : 1er argument non numérique → code 2 (erreur d'usage, pas un faux verdict).
bash "$RB" abc true 2>/dev/null; (( $? == 2 )) && pass "arg non numérique → 2" || ko "arg non numérique devait rendre 2"

# 5) Usage : aucune commande → code 2.
bash "$RB" 5 2>/dev/null; (( $? == 2 )) && pass "aucune commande → 2" || ko "aucune commande devait rendre 2"

if (( FAIL )); then echo "test-run-bounded: ÉCHECS"; exit 1; fi
echo "test-run-bounded: TOUT VERT"
