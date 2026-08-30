#!/usr/bin/env bash
# DoD exécutable de la fiche 20260824122629794 — teste ezk-chef-extract.sh (source b :
# fiche shippée → brouillon de recette) sur fixtures jetables. Calqué sur test-regen-recipes.sh.
# Cas : A basique (fiche complète → recette draft avec sections attendues) · B id introuvable
# (refus net) · C déjà existant (pas d'écrasement silencieux) · D déterminisme du contenu
# dérivé mécaniquement (hors id minté, horodaté par construction).
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/ezk-chef-extract.sh"
TEMPLATE_SRC="$(cd "$(dirname "$0")/../../.." && pwd)/recipes/RECIPE_TEMPLATE.md"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

fixture_root() { # $1=dir → pose recipes/RECIPE_TEMPLATE.md + features/done/
  mkdir -p "$1/recipes" "$1/features/done"
  cp "$TEMPLATE_SRC" "$1/recipes/RECIPE_TEMPLATE.md"
}

fiche_shippee() { # $1=dir $2=id $3=slug
  cat > "$1/features/done/$2_$3.md" <<EOF
---
id: "$2"
title: Titre de test — $3
type: feature
priority: P1
product: mega-city
status: shipped
ready: 2026-08-30
pr: "#999"
created: 2026-08-26
---

## En clair

Ceci est le résumé en clair de la fiche de test, une phrase simple à recopier telle quelle.

## Proposition

1. Première étape de la proposition.
2. Deuxième étape de la proposition.

## Comment vérifier

- Lancer la commande X.
- Vérifier le résultat Y.
EOF
}

# ── Cas A : fiche complète → brouillon de recette avec les sections attendues ─────────────
A="$TMP/a"
fixture_root "$A"
fiche_shippee "$A" "20260830000000101" "feature-test"
out_a="$("$SCRIPT" 20260830000000101 "$A")"
dest_a="$A/$out_a"
echo "Cas A (basique) :"
check "chemin imprimé pointe recipes/"        "[[ '$out_a' == recipes/*.md ]]"
check "fichier de recette créé"               "test -s '$dest_a'"
check "status: draft dans le front-matter"    "grep -q '^status: draft$' '$dest_a'"
check "id minté horodaté (17 chiffres)"       "grep -Eq '^id: \"[0-9]{17}\"$' '$dest_a'"
check "titre repris de la fiche"              "grep -q '^title: Titre de test — feature-test$' '$dest_a'"
check "section En clair recopiée"             "grep -q 'résumé en clair de la fiche de test' '$dest_a'"
check "source pointeur (jamais de code copié)" "grep -q '^source: TODO(jugement)' '$dest_a'"
check "PR repris en note pointeur"            "grep -q 'PR #999' '$dest_a'"
check "playbook amorcé depuis Proposition"    "grep -q 'Première étape de la proposition' '$dest_a'"
check "playbook amorcé depuis Comment vérifier" "grep -q 'Lancer la commande X' '$dest_a'"
check "fiche source pointée (entonnoir)"      "grep -q 'features/done/20260830000000101_feature-test.md' '$dest_a'"
check "toutes les rubriques du gabarit présentes" \
  "grep -q '^## Ingrédients' '$dest_a' && grep -q '^## Ustensiles' '$dest_a' && grep -q '^## Le concept' '$dest_a' && grep -q '^## Checklist' '$dest_a' && grep -q '^## Fichiers de référence' '$dest_a' && grep -q '^## Statut de cette recette' '$dest_a'"

# ── Cas B : id introuvable → refus net ────────────────────────────────────────────────────
B="$TMP/b"
fixture_root "$B"
echo "Cas B (id introuvable) :"
check "refuse un id sans fiche shippée" "! '$SCRIPT' 99999999999999999 '$B' >/dev/null 2>&1"

# ── Cas C : destination déjà existante → pas d'écrasement silencieux ──────────────────────
C="$TMP/c"
fixture_root "$C"
fiche_shippee "$C" "20260830000000102" "deja-la"
mkdir -p "$C/recipes"
echo 'déjà présent' > "$C/recipes/deja-la.md"
echo "Cas C (destination déjà existante) :"
check "refuse d'écraser une recette existante" "! '$SCRIPT' 20260830000000102 '$C' >/dev/null 2>&1"
check "le fichier existant n'est pas touché"    "grep -q 'déjà présent' '$C/recipes/deja-la.md'"

# ── Cas D : déterminisme du contenu dérivé mécaniquement (hors id/dates horodatés) ────────
D="$TMP/d"
fixture_root "$D"
fiche_shippee "$D" "20260830000000103" "determinisme"
out1="$("$SCRIPT" 20260830000000103 "$D")"
strip_volatile() { grep -Ev '^id: "[0-9]{17}"$|^(created|updated): ' "$1"; }
snap1="$(strip_volatile "$D/$out1")"
rm -f "$D/$out1"
out2="$("$SCRIPT" 20260830000000103 "$D")"
snap2="$(strip_volatile "$D/$out2")"
echo "Cas D (déterminisme, hors id/dates) :"
check "même contenu dérivé à deux passes" "[ \"\$snap1\" = \"\$snap2\" ]"

if [ "$FAIL" = 0 ]; then echo 'test-ezk-chef-extract: TOUT VERT'; else echo 'test-ezk-chef-extract: ÉCHECS' >&2; exit 1; fi
