#!/usr/bin/env bash
# DoD exécutable de la fiche 20261126170000114 — `ezk recipes add <id>` : ajoute une recette du catalogue
# au projet. Cas : A ajout puis lecture (ici: true) · B le fichier passe le contrat des recettes ·
# C recette inconnue refusée · D brouillon refusé · E déjà ajoutée refusée · F aucun refus n'écrit ·
# G usage sans id · H fichier déjà au chemin visé · I rien n'est commité · J la commande `ezk` route le verbe.
set -euo pipefail

MEGA="$(cd "$(dirname "$0")/.." && pwd)"          # products/mega-city
ADD="$MEGA/bin/ezk-recipes-add.ts"
READ="$MEGA/bin/ezk-recipes.ts"
EZK="$MEGA/bin/ezk.ts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi }
GIT() { command git -c user.email=t@test -c user.name=test "$@"; }

READY_ID="20260830104013793"   # plan-distribution-app (status: ready)
DRAFT_ID="20261001004228784"   # lanceur-dev-universel (status: draft)
PROJ="$TMP/projet"
mkdir -p "$PROJ"
(cd "$PROJ" && GIT init -q && GIT commit -q --allow-empty -m init)

add() { (cd "$MEGA" && pnpm exec tsx "$ADD" "$@" 2>&1); }
tree_hash() { (cd "$1" && find . -path ./.git -prune -o -type f -print | sort | xargs cat | cksum); }
ici_of() { # $1 = id → "true"/"false", lu dans le catalogue de `ezk recipes --json`
  (cd "$MEGA" && pnpm exec tsx "$READ" --root "$PROJ" --json 2>/dev/null) |
    node -e "const d=JSON.parse(require('fs').readFileSync(0,'utf8'));console.log(String(d.catalogue.find(r=>r.id==='$1').ici))"
}

check "A0 — avant l'ajout, la recette n'est pas ici" '[ "$(ici_of $READY_ID)" = "false" ]'

code=0; out="$(add "$READY_ID" --root "$PROJ")" || code=$?
FILE="$PROJ/.vectorz/recipes/plan-distribution-app/RECIPE.md"
check "A1 — l'ajout réussit (code 0) et dit ce qu'il a écrit" '[ $code -eq 0 ] && echo "$out" | grep -q "$FILE"'
check "A2 — le fichier existe" '[ -f "$FILE" ]'
check "A3 — ezk recipes --json publie la recette comme ajoutée (ici: true)" '[ "$(ici_of $READY_ID)" = "true" ]'
check "A4 — elle figure aussi dans projet[], complète" '(cd "$MEGA" && pnpm exec tsx "$READ" --root "$PROJ" --json 2>/dev/null) | node -e "const d=JSON.parse(require(\"fs\").readFileSync(0,\"utf8\"));process.exit(d.projet.some(r=>r.id===\"$READY_ID\"&&r.complete&&r.ici)?0:1)"'

# B : le fichier passe le contrat strict (les cinq champs) et le livre (regen-recipes.sh) le lit.
check "B1 — les cinq champs du contrat sont présents" 'for f in id title makes source status; do grep -q "^$f: " "$FILE" || exit 1; done'
check "B2 — l'id est celui du catalogue, entre guillemets" 'grep -q "^id: \"$READY_ID\"" "$FILE"'
mkdir -p "$TMP/livre/recipes" && cp "$FILE" "$TMP/livre/recipes/plan-distribution-app.md"
check "B3 — regen-recipes.sh range ce fichier au livre" 'bash "$MEGA/bin/regen-recipes.sh" "$TMP/livre" >/dev/null 2>&1 && grep -q "$READY_ID" "$TMP/livre/recipes/RECIPES.md"'

# E, C, D, G : refus, code non nul, message, et rien d'écrit (F).
before="$(tree_hash "$PROJ")"
code=0; out="$(add "$READY_ID" --root "$PROJ")" || code=$?
check "E — déjà ajoutée : code non nul et message" '[ $code -ne 0 ] && echo "$out" | grep -q "déjà ajoutée" && echo "$out" | grep -q "Rien n.a été écrit"'
code=0; out="$(add 99999 --root "$PROJ")" || code=$?
check "C — recette inconnue : code non nul et message" '[ $code -ne 0 ] && echo "$out" | grep -q "inconnue"'
code=0; out="$(add "$DRAFT_ID" --root "$PROJ")" || code=$?
check "D — brouillon : code non nul et message" '[ $code -ne 0 ] && echo "$out" | grep -q "brouillon"'
code=0; out="$(add --root "$PROJ")" || code=$?
check "G — sans id : usage et code 2" '[ $code -eq 2 ] && echo "$out" | grep -q "usage"'
check "F — aucun refus n'a écrit un fichier" '[ "$before" = "$(tree_hash "$PROJ")" ]'

# H : un fichier déjà au chemin visé (sans id lisible) → refus, contenu intact.
PROJ2="$TMP/projet2"
mkdir -p "$PROJ2/.vectorz/recipes/plan-distribution-app"
echo "à moi" > "$PROJ2/.vectorz/recipes/plan-distribution-app/RECIPE.md"
code=0; out="$(add "$READY_ID" --root "$PROJ2")" || code=$?
check "H — fichier déjà là : refus, contenu intact" '[ $code -ne 0 ] && echo "$out" | grep -q "existe déjà" && [ "$(cat "$PROJ2/.vectorz/recipes/plan-distribution-app/RECIPE.md")" = "à moi" ]'

# I : rien n'est commité (un projet neuf : le fichier reste non suivi).
PROJ3="$TMP/projet3"
mkdir -p "$PROJ3"
(cd "$PROJ3" && GIT init -q && GIT commit -q --allow-empty -m init)
add "$READY_ID" --root "$PROJ3" >/dev/null
check "I — rien n'est commité (fichier non suivi, un seul commit)" '[ "$(GIT -C "$PROJ3" rev-list --count HEAD)" = "1" ] && GIT -C "$PROJ3" status --porcelain | grep -q "^?? .vectorz/"'

# J : par la commande `ezk` — le routeur choisit le verbe, et la lecture par défaut marche toujours.
PROJ4="$TMP/projet4"
mkdir -p "$PROJ4"
(cd "$MEGA" && pnpm exec tsx "$EZK" --root "$PROJ4" recipes add "$READY_ID" >/dev/null 2>&1)
check "J1 — « ezk recipes add » écrit dans le projet désigné" '[ -f "$PROJ4/.vectorz/recipes/plan-distribution-app/RECIPE.md" ]'
check "J2 — « ezk recipes --json » lit toujours (commande par défaut)" '(cd "$MEGA" && pnpm exec tsx "$EZK" --root "$PROJ4" recipes --json 2>/dev/null) | node -e "const d=JSON.parse(require(\"fs\").readFileSync(0,\"utf8\"));process.exit(d.schema_version===1?0:1)"'
code=0; out="$(cd "$MEGA" && pnpm exec tsx "$EZK" --root "$PROJ4" recipes ad "$READY_ID" 2>&1)" || code=$?
check "J4 — un verbe mal tapé (« recipes ad ») est refusé (code 2), sans lecture à la place" '[ $code -eq 2 ] && echo "$out" | grep -q "argument inattendu" && ! echo "$out" | grep -q "plan-distribution-app"'
check "J3 — « ezk help recipes » nomme le verbe add" '(cd "$MEGA" && pnpm exec tsx "$EZK" help recipes 2>/dev/null) | grep -q "recipes add"'

if [ "$FAIL" -eq 0 ]; then echo "test-ezk-recipes-add.sh : OK"; else echo "test-ezk-recipes-add.sh : ÉCHEC" >&2; exit 1; fi
