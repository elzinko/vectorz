#!/usr/bin/env bash
# DoD exécutable de la fiche 20261023120000001 — `ezk recipes` : découverte LECTURE SEULE depuis un
# projet hôte. Cas : A recette déclarée du projet listée · B node_modules ignoré · C recette de la
# méthode nommée avec son `makes` (ezk-secret via secrets-trousseau = rejeu du cas muti) · D lecture
# seule (git status propre après exécution).
set -euo pipefail

MEGA="$(cd "$(dirname "$0")/.." && pwd)"          # products/mega-city
BIN="$MEGA/bin/ezk-recipes.ts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi }

# ── Projet-fixture hôte : un dossier qui se déclare recette ───────────────────
PROJ="$TMP/projet"
mkdir -p "$PROJ/apps/outil"
cat > "$PROJ/apps/outil/RECIPE.md" <<'EOF'
---
id: "20261018110931402"
title: Harnais de validation
makes: une procédure de validation rejouable
source: apps/outil
status: ready
---
corps
EOF
# Un RECIPE.md sous node_modules NE DOIT PAS apparaître (dossier ignoré par la marche).
mkdir -p "$PROJ/node_modules/paquet"
cp "$PROJ/apps/outil/RECIPE.md" "$PROJ/node_modules/paquet/RECIPE.md"

out="$(cd "$MEGA" && pnpm exec tsx "$BIN" --root "$PROJ" 2>/dev/null)"

check "A — recette déclarée du projet listée"        'echo "$out" | grep -q "apps/outil — Harnais de validation"'
check "B — node_modules ignoré"                       '! echo "$out" | grep -q "node_modules"'
check "C — recette de méthode nommée (makes ezk-secret, rejeu muti)" 'echo "$out" | grep -q "ezk-secret"'
check "section projet présente"                        'echo "$out" | grep -q "Recettes déclarées dans ce projet"'

# --json : la même découverte, en données (fiche 20261104090518008).
json="$(cd "$MEGA" && pnpm exec tsx "$BIN" --root "$PROJ" --json 2>/dev/null)"
check "J1 — --json rend un JSON au schéma v1"            'echo "$json" | node -e "const d=JSON.parse(require(\"fs\").readFileSync(0,\"utf8\"));process.exit(d.schema_version===1&&Array.isArray(d.catalogue)?0:1)"'
check "J2 — la recette du projet et son dossier"        'echo "$json" | node -e "const d=JSON.parse(require(\"fs\").readFileSync(0,\"utf8\"));process.exit(d.projet.some(r=>r.dir===\"apps/outil\"&&r.complete)?0:1)"'
check "J3 — node_modules ignoré en JSON aussi"           '! echo "$json" | grep -q "node_modules"'

# ── E : parité avec le livre — autant de recettes de méthode que de recipes/*.md ──────────────
REPO="$(cd "$MEGA/../.." && pwd)"
# Attendu = recettes INDEXABLES (règle du livre : un `id` non vide), pas le brut `ls`.
expected="$(grep -lE '^id:[[:space:]]*[^[:space:]]' "$REPO"/recipes/*.md 2>/dev/null | grep -v -e 'RECIPES.md' -e 'RECIPE_TEMPLATE.md' | wc -l | tr -d ' ')"
got="$(echo "$out" | sed -n 's/^En clair : \([0-9][0-9]*\) recette.*/\1/p')"
check "E — parité livre ($got recettes de méthode == $expected fichiers recipes/*.md)" '[ -n "$got" ] && [ "$got" = "$expected" ]'
jgot="$(echo "$json" | node -e "console.log(JSON.parse(require(\"fs\").readFileSync(0,\"utf8\")).catalogue.length)")"
check "J4 — parité livre en JSON ($jgot == $expected)"   '[ "$jgot" = "$expected" ]'

# ── D : lecture seule — git status propre après exécution ─────────────────────
(
  cd "$PROJ"
  git init -q
  git -c user.email=t@test -c user.name=test add -A
  git -c user.email=t@test -c user.name=test commit -qm init
)
(cd "$MEGA" && pnpm exec tsx "$BIN" --root "$PROJ" >/dev/null 2>&1)
check "D — lecture seule (git status propre après exécution)" '[ -z "$(git -C "$PROJ" status --porcelain)" ]'

if [ "$FAIL" -eq 0 ]; then echo "test-ezk-recipes.sh : OK"; else echo "test-ezk-recipes.sh : ÉCHEC" >&2; exit 1; fi
