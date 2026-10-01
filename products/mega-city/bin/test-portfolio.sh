#!/usr/bin/env bash
# DoD exécutable de la fiche 20260922160651394 (volet A) — teste portfolio.sh sur fixtures jetables.
# portfolio.sh lit les fiches PAR LE LOADER (bin/fiche-rows.ts), plus par un awk maison. On fige les
# cas où l'ancien awk se trompait : valeur quotée avec `#` ou `:`, commentaire de fin, champ cité
# dans le CORPS, produit absent (repli « vectorz »).
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/portfolio.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

R="$TMP/r"
mkdir -p "$R/features"

cat > "$R/features/0001-prete.md" <<'EOF'
---
id: "0001"
title: "Fix: le deux-points # et le dièse"
type: feature
priority: P1
product: mega-city
status: ready # groomée le 2026-09-01
pr: "#29"
created: 2026-09-01
---

status: shipped
priority: P0
EOF

cat > "$R/features/0002-idee.md" <<'EOF'
---
id: "0002"
title: Une idée sans produit # brouillon
type: chore
priority: P2
status: idea
created: 2026-09-02
---

corps
EOF

cat > "$R/features/0003-en-cours.md" <<'EOF'
---
id: "0003"
title: Un travail en cours
type: bug
priority: P0
product: vectorz
status: "in-progress"
created: 2026-09-03
---

corps
EOF

echo "portfolio.sh sur 3 fiches :"
bash "$SCRIPT" "$R" >/dev/null
OUT="$R/PORTFOLIO.md"

check "PORTFOLIO.md généré"                          "test -s '$OUT'"
check "titre quoté avec : et # gardé en entier"       "grep -qF '| mega-city | 0001 | Fix: le deux-points # et le dièse | feature | P1 | 🔵 ready | #29 |' '$OUT'"
check "commentaire de fin du statut retiré"           "! grep -qF 'groomée le' '$OUT'"
check "statut du corps ignoré (reste ready)"          "! grep -qF '0001 | Fix: le deux-points # et le dièse | feature | P0' '$OUT' && ! grep -qF '✅ shipped | #29' '$OUT'"
check "produit absent → repli vectorz ; commentaire du titre nu retiré" \
  "grep -qF '| vectorz | 0002 | Une idée sans produit | chore | P2 | 💡 idea |' '$OUT'"
check "statut quoté (\"in-progress\") reconnu, pas ❓" "! grep -qF '❓' '$OUT' && grep -qF '🟠 in-progress' '$OUT'"
check "compteur mega-city (1 ready)"                  "grep -qF '| mega-city | 1 | 1 | 0 | 0 | 0 | 0 | 0 |' '$OUT'"
check "compteur vectorz (1 en cours, 1 idée)"         "grep -qF '| vectorz | 2 | 0 | 1 | 0 | 1 | 0 | 0 |' '$OUT'"

echo "portfolio.sh sans aucune fiche :"
E="$TMP/e"
mkdir -p "$E/features"
bash "$SCRIPT" "$E" >/dev/null
check "régénère une vue vide sans planter"           "grep -qF 'Aucune fiche ready' '$E/PORTFOLIO.md'"

if [ "$FAIL" = 0 ]; then echo 'test-portfolio: TOUT VERT'; else echo 'test-portfolio: ÉCHECS' >&2; exit 1; fi
