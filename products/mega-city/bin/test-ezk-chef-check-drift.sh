#!/usr/bin/env bash
# DoD exécutable de la fiche 20261028130229418 — garde-fou de dérive des recettes.
# Cas : A source présente → muette · B source absente → signalée + nommée + exit 1 ·
# C brouillon (source vide) et D source externe (~/…) → comptés hors périmètre, pas une dérive ·
# E lecture seule (git status propre) · F fixture sans dérive → exit 0 « Aucune dérive ».
set -uo pipefail

MEGA="$(cd "$(dirname "$0")/.." && pwd)"          # products/mega-city
BIN="bin/ezk-chef-check-drift.ts"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi }

run() { # $1 = racine ; imprime la sortie, met EXIT dans la variable globale RC
  out="$(cd "$MEGA" && pnpm exec tsx "$BIN" --root "$1" 2>/dev/null)"
  RC=$?
}

# ── Fixture avec les quatre cas ───────────────────────────────────────────────
PROJ="$TMP/projet"
mkdir -p "$PROJ/apps/present" "$PROJ/apps/outil-vivant" "$PROJ/apps/menteuse" "$PROJ/apps/brouillon" "$PROJ/apps/externe"
# A — source présente
cat > "$PROJ/apps/outil-vivant/RECIPE.md" <<'EOF'
---
id: "20261018110931001"
title: Outil vivant
makes: une procédure
source: apps/present
status: ready
---
EOF
# B — source absente (apps/disparu n'existe pas)
cat > "$PROJ/apps/menteuse/RECIPE.md" <<'EOF'
---
id: "20261018110931002"
title: Recette qui ment
makes: une procédure
source: apps/disparu
status: ready
---
EOF
# C — brouillon : source vide
cat > "$PROJ/apps/brouillon/RECIPE.md" <<'EOF'
---
id: "20261018110931003"
title: Brouillon sans source
makes: une procédure
source:
status: draft
---
EOF
# D — source externe (~/…) : non vérifiée, comptée hors périmètre
cat > "$PROJ/apps/externe/RECIPE.md" <<'EOF'
---
id: "20261018110931004"
title: Recette externe
makes: une procédure
source: ~/git/ailleurs/outil
status: ready
---
EOF
# Critère 1 (LIVRE) : une recette de recipes/*.md à source locale absente doit aussi être signalée.
mkdir -p "$PROJ/recipes"
cat > "$PROJ/recipes/menteuse-livre.md" <<'EOF'
---
id: "20261018110931005"
title: Recette de livre qui ment
makes: une procédure
source: apps/disparu-livre
status: ready
---
EOF

run "$PROJ"
check "B — dérive détectée → exit 1"                  '[ "$RC" -eq 1 ]'
check "B — la recette (projet) qui ment est nommée (id + source)" 'echo "$out" | grep -q "Recette qui ment (20261018110931002) → source: apps/disparu"'
check "critère 1 — la recette de LIVRE qui ment est nommée" 'echo "$out" | grep -q "Recette de livre qui ment (20261018110931005) → source: apps/disparu-livre"'
check "A — la source présente n'est PAS signalée"     '! echo "$out" | grep -q "Outil vivant"'
check "C+D — un externe et un brouillon comptés hors périmètre" 'echo "$out" | grep -q "1 source(s) externe(s).*1 brouillon(s)"'
check "En clair en tête"                               'echo "$out" | grep -q "^En clair :"'

# ── E : lecture seule — git status propre après exécution ─────────────────────
(
  cd "$PROJ"
  git init -q
  git -c user.email=t@test -c user.name=test add -A
  git -c user.email=t@test -c user.name=test commit -qm init
)
run "$PROJ"
check "E — lecture seule (git status propre après exécution)" '[ -z "$(git -C "$PROJ" status --porcelain)" ]'

# ── F : fixture SANS dérive → exit 0 ──────────────────────────────────────────
CLEAN="$TMP/clean"
mkdir -p "$CLEAN/apps/present/outil-vivant"
cat > "$CLEAN/apps/present/outil-vivant/RECIPE.md" <<'EOF'
---
id: "20261018110931009"
title: Toute résolue
makes: une procédure
source: apps/present
status: ready
---
EOF
run "$CLEAN"
check "F — aucune dérive → exit 0"                     '[ "$RC" -eq 0 ]'
check "F — dit « Aucune dérive »"                      'echo "$out" | grep -q "Aucune dérive"'

if [ "$FAIL" -eq 0 ]; then echo "test-ezk-chef-check-drift.sh : OK"; else echo "test-ezk-chef-check-drift.sh : ÉCHEC" >&2; exit 1; fi
