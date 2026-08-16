#!/usr/bin/env bash
# DoD exécutable de la fiche 20260816131704335 (/ezk-help) — index de commandes GÉNÉRÉ.
# AC1 : compte + liste dérivés de la source (jamais en dur).
# AC2 : détail d'un skill nommé ; skill inconnu → exit 1.
# AC3 (anti-dérive) : ajout/retrait d'un skill fixture → apparaît/disparaît SANS édition manuelle.
set -euo pipefail

CLI="$(cd "$(dirname "$0")" && pwd)/ezk-help.ts"
TMP="$(mktemp -d)"; trap 'rm -rf "$TMP"' EXIT
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

mkskill() { # $1=nom $2=description $3=argument-hint
  mkdir -p "$TMP/$1"
  printf -- '---\nname: %s\ndescription: %s\nargument-hint: "%s"\n---\n# doc\n' "$1" "$2" "$3" \
    > "$TMP/$1/SKILL.md"
}
run() { pnpm exec tsx "$CLI" --skills-dir "$TMP" "$@" 2>&1; }

mkskill ezk-alpha "Fait des choses alpha." "[help|go]"
mkskill ezk-beta  "Fait des choses beta."  "[help|run]"

echo "AC1 — compte + liste dérivés de la source :"
out="$(run)"
check "liste les 2 skills fixture (nom + argument-hint)" \
  'echo "$out" | grep -q "ezk-alpha" && echo "$out" | grep -q "\[help|run\]"'
check "compte affiché = 2 (dérivé, non codé en dur)" 'echo "$out" | grep -q "2 skills"'

echo "AC2 — détail d'un skill nommé :"
det="$(run ezk-alpha)"
check "affiche l'usage (argument-hint) du skill nommé" 'echo "$det" | grep -q "\[help|go\]"'
check "skill inconnu → code de sortie non nul" '! run ezk-inconnu >/dev/null 2>&1'

echo "AC3 — anti-dérive (le cœur) : ajout/retrait SANS édition manuelle :"
mkskill ezk-gamma "Tout neuf." "[help]"
check "le skill ajouté apparaît tout seul" 'run | grep -q "ezk-gamma"'
check "le compte passe à 3 sans toucher à l'index" 'run | grep -q "3 skills"'
rm -rf "$TMP/ezk-gamma"
after="$(run)"
check "retiré → disparaît + compte revenu à 2" \
  '! echo "$after" | grep -q "ezk-gamma" && echo "$after" | grep -q "2 skills"'

echo "Parsing description — scalaire plain multi-lignes ET bloc plié (>-) recollés :"
# Reproduit le P0 : une description en scalaire plain (valeur 1re ligne + suite indentée)
# était tronquée. On asserte que la DERNIÈRE partie survit dans le détail.
mkdir -p "$TMP/ezk-plain"
cat > "$TMP/ezk-plain/SKILL.md" <<'SK'
---
name: ezk-plain
description: Debut en scalaire simple sur la premiere ligne
  puis une suite indentee qui doit etre recollee jusqu-au FINPLAIN
argument-hint: "[help]"
---
# doc
SK
mkdir -p "$TMP/ezk-folded"
cat > "$TMP/ezk-folded/SKILL.md" <<'SK'
---
name: ezk-folded
description: >-
  Premiere ligne d-un bloc plie.
  Deuxieme ligne qui va jusqu-au FINFOLDED.
argument-hint: "[help]"
---
# doc
SK
check "scalaire plain multi-lignes : dernière partie recollée (détail)" 'run ezk-plain | grep -q "FINPLAIN"'
check "bloc plié >- : dernière partie recollée (détail)" 'run ezk-folded | grep -q "FINFOLDED"'
rm -rf "$TMP/ezk-plain" "$TMP/ezk-folded"

echo "Sécurité — traversée de chemin refusée :"
check "un nom avec ../ → refusé (exit non nul)" '! run "../foo" >/dev/null 2>&1'

echo "Terrain — le vrai catalogue mega-city :"
real="$(pnpm exec tsx "$CLI" 2>&1)"
check "liste le vrai catalogue (ezk-backlog présent)" 'echo "$real" | grep -q "ezk-backlog"'
check "compte réel > 10 skills" \
  'n="$(echo "$real" | sed -n "s/^\([0-9][0-9]*\) skills .*/\1/p" | head -1)"; [ "${n:-0}" -gt 10 ]'

if [ "$FAIL" -eq 0 ]; then echo "test-ezk-help : TOUS VERTS"; else echo "test-ezk-help : DES ÉCHECS"; exit 1; fi
