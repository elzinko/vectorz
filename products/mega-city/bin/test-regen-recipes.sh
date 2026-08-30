#!/usr/bin/env bash
# DoD exécutable de la fiche 20260824185422122 — teste regen-recipes.sh sur fixtures jetables.
# Cas : A basique (front-matter complet → indexé) · B champ manquant (id vide → hors index,
# signalé) · C statuts (draft/ready) · D lien cliquable relatif au doc · E id en double
# (warning non bloquant) · F paramétrage racine.
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/regen-recipes.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

recette() { # $1=dir $2=slug $3=front-matter-lignes
  mkdir -p "$1"
  printf -- '---\n%s\ncreated: 2026-08-30\n---\n\ncorps\n' "$3" > "$1/$2.md"
}

# ── Cas A : recette bien formée → indexée ─────────────────────────────────────
A="$TMP/a"
recette "$A/recipes" recette-a 'id: "20260830000000001"
title: Recette A
makes: fabrique A
source: ~/git/exemple
status: ready
home: central'
out_a="$("$SCRIPT" "$A" 2>"$TMP/a.err")"
echo "Cas A (basique) :"
check "livre régénéré"          "test -s '$A/recipes/RECIPES.md'"
check "titre du livre"           "head -1 '$A/recipes/RECIPES.md' | grep -q '^# Livre des recettes'"
check "recette A indexée"        "grep -qF '[20260830000000001](recette-a.md)' '$A/recipes/RECIPES.md'"
check "statut ready rendu"       "grep -q '✅ ready' '$A/recipes/RECIPES.md'"
check "compteur stdout"          "printf '%s' \"\$out_a\" | grep -q 'régénéré (1 recettes)'"
check "zéro warning"             "! test -s '$TMP/a.err'"

# ── Cas B : id absent (front-matter incomplet) → hors index, signalé ─────────
B="$TMP/b"
recette "$B/recipes" sans-id 'title: Sans id
makes: rien
status: draft
home: central'
"$SCRIPT" "$B" >/dev/null 2>"$TMP/b.err"
echo "Cas B (id absent → hors index) :"
check "aucune ligne pour sans-id"     "! grep -q 'sans-id' '$B/recipes/RECIPES.md' || grep -q '⚠️ Sans front-matter' '$B/recipes/RECIPES.md'"
check "section « sans front-matter »" "grep -q '## ⚠️ Sans front-matter' '$B/recipes/RECIPES.md'"
check "fichier listé en clair"        "grep -qF 'sans-id.md' '$B/recipes/RECIPES.md'"

# ── Cas C : statuts draft + ready mélangés ────────────────────────────────────
C="$TMP/c"
recette "$C/recipes" draft-c 'id: "20260830000000002"
title: Draft C
makes: fabrique C
source: ~/git/exemple
status: draft
home: central'
recette "$C/recipes" ready-c 'id: "20260830000000003"
title: Ready C
makes: fabrique C2
source: ~/git/exemple
status: ready
home: project'
"$SCRIPT" "$C" >/dev/null 2>"$TMP/c.err"
echo "Cas C (statuts) :"
check "draft rendu"   "grep -q '📝 draft' '$C/recipes/RECIPES.md'"
check "ready rendu"   "grep -q '✅ ready' '$C/recipes/RECIPES.md'"
check "home project rendu" "grep -q '| project |' '$C/recipes/RECIPES.md'"

# ── Cas D : lien cliquable relatif au document (règle human-facing-lisibility) ─
echo "Cas D (lien relatif au doc, pas préfixé recipes/) :"
check "id cliquable vers sa fiche" "grep -qF '[20260830000000002](draft-c.md)' '$C/recipes/RECIPES.md'"
check "aucun lien préfixé recipes/" "! grep -qF '](recipes/' '$C/recipes/RECIPES.md'"

# ── Cas E : id en double → warning non bloquant, index quand même écrit ──────
E="$TMP/e"
recette "$E/recipes" dup-1 'id: "20260830000000009"
title: Dup 1
makes: x
source: ~/git/exemple
status: draft
home: central'
recette "$E/recipes" dup-2 'id: "20260830000000009"
title: Dup 2
makes: y
source: ~/git/exemple
status: draft
home: central'
"$SCRIPT" "$E" >/dev/null 2>"$TMP/e.err"
echo "Cas E (id en double) :"
check "warning id en double"        "grep -q 'id 20260830000000009 en double' '$TMP/e.err'"
check "index quand même écrit"      "test -s '$E/recipes/RECIPES.md'"

# ── Cas F : racine paramétrée, erreur franche si recipes/ absent ─────────────
F="$TMP/f-vide"
mkdir -p "$F"
echo "Cas F (racine sans recipes/) :"
check "erreur franche si pas de recipes/" "! bash '$SCRIPT' '$F' >/dev/null 2>&1"

if [ "$FAIL" = 0 ]; then echo 'test-regen-recipes: TOUT VERT'; else echo 'test-regen-recipes: ÉCHECS' >&2; exit 1; fi
