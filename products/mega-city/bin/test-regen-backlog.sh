#!/usr/bin/env bash
# DoD exécutable de la fiche 0072 — teste regen-backlog.sh sur fixtures jetables.
# Cas : A non-cassant (sans epic:/version:) · B colonnes + section Épics + exclusion du
# tirage · C warnings d'intégrité · D paramétrage racine/titre · E lien PLAN.md conditionnel
# (PR #43 / ADR-0018).
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/regen-backlog.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

fiche() { # $1=dir $2=id $3=slug $4=front-matter-extra (lignes YAML)
  mkdir -p "$1"
  printf -- '---\nid: %s\ntitle: fiche %s\n%s\ncreated: 2026-07-17\n---\n\ncorps\n' \
    "$2" "$2" "$4" > "$1/$2-$3.md"
}

# ── Cas A : backlog sans epic:/version: → aucune colonne/section en plus ──────────
A="$TMP/a"
fiche "$A/features"      0001 story 'type: feature
priority: P1
status: todo'
fiche "$A/features"      0002 idee  'type: chore
priority: P2
status: idea'
fiche "$A/features/done" 0000 vieux 'type: feature
priority: P1
status: shipped
pr: "#1"'
out_a="$("$SCRIPT" "$A" "Backlog — test A" 2>"$TMP/a.err")"
echo "Cas A (non cassant) :"
check "titre paramétré"            "head -1 '$A/features/README.md' | grep -q '^# Backlog — test A$'"
check "pas de colonne Version"     "! grep -q '| Version |' '$A/features/README.md'"
check "pas de colonne Épic"        "! grep -q '| Épic |' '$A/features/README.md'"
check "pas de section Épics"       "! grep -q '## 🧭 Épics' '$A/features/README.md'"
check "section Idées présente"     "grep -q '## 💡 Idées' '$A/features/README.md'"
check "zéro warning"               "! test -s '$TMP/a.err'"
check "stats émises"               "printf '%s' \"\$out_a\" | grep -q 'stats: total=3'"

# ── Cas B : épics + version → colonnes, section, exclusion du tableau actionnable ─
B="$TMP/b"
fiche "$B/features"      0010 epic-pivot 'type: epic
priority: P0
status: todo'
fiche "$B/features"      0011 enfant-a 'type: feature
priority: P1
status: todo
ready: 2026-07-17
epic: 0010'
fiche "$B/features"      0012 jalon 'type: chore
priority: P2
version: V1.1
status: todo'
fiche "$B/features/done" 0009 enfant-livre 'type: feature
priority: P1
status: shipped
epic: 0010
pr: "#2"'
"$SCRIPT" "$B" "Backlog — test B" >/dev/null 2>"$TMP/b.err"
idx="$B/features/README.md"
echo "Cas B (colonnes + section Épics) :"
check "colonne Version présente"   "grep -q '| Version |' '$idx'"
check "colonne Épic présente"      "grep -q '| Épic |' '$idx'"
check "section Épics présente"     "grep -q '## 🧭 Épics' '$idx'"
check "épic 0010 HORS tableau actionnable" \
  "! awk '/^## /{exit} {print}' '$idx' | grep -q '^| 0010 '"
check "épic 0010 dans la section Épics" \
  "sed -n '/## 🧭 Épics/,/## 💡/p' '$idx' | grep -q '^| 0010 '"
check "enfant 0011 porte la réf 0010"  "grep -q '^| 0011 .*| 0010 |' '$idx'"
check "version V1.1 rendue"            "grep -q '^| 0012 .*| V1.1 |' '$idx'"
check "zéro warning (refs valides)"    "! test -s '$TMP/b.err'"

# ── Cas C : intégrité — réf pendante, cible non-epic, sous-épic ───────────────────
C="$TMP/c"
fiche "$C/features" 0020 epic-ok 'type: epic
priority: P1
status: todo'
fiche "$C/features" 0021 pendante 'type: feature
priority: P1
status: todo
epic: 9999'
fiche "$C/features" 0022 vers-non-epic 'type: feature
priority: P2
status: todo
epic: 0021'
fiche "$C/features" 0023 sous-epic 'type: epic
priority: P2
status: todo
epic: 0020'
"$SCRIPT" "$C" "Backlog — test C" >/dev/null 2>"$TMP/c.err"
echo "Cas C (warnings intégrité) :"
check "warning réf pendante (0021→9999)"    "grep -q 'fiche 0021 — epic: 9999 introuvable' '$TMP/c.err'"
check "warning cible non-epic (0022→0021)"  "grep -q 'fiche 0022 — epic: 0021 introuvable ou non-epic' '$TMP/c.err'"
check "warning sous-épic (0023)"            "grep -q 'fiche 0023 — une épic ne référence pas' '$TMP/c.err'"
check "warnings NON bloquants (index écrit)" "test -s '$C/features/README.md'"

# ── Cas D : défauts (racine = parent de bin/, titre mega-city) — hermétique ──────
# (revue Codex PR #30 : ne JAMAIS régénérer le vrai index depuis le banc — copie du
# script dans un produit-fixture, la résolution par défaut opère dedans.)
D="$TMP/d"
mkdir -p "$D/bin"
cp "$SCRIPT" "$D/bin/regen-backlog.sh"
fiche "$D/features" 0030 defaut 'type: feature
priority: P2
status: todo'
echo "Cas D (défauts, hermétique) :"
check "sans args → racine = parent de bin/ (fixture)" \
  "cd '$TMP' && bash '$D/bin/regen-backlog.sh' >/dev/null 2>&1 && test -s '$D/features/README.md'"
check "titre par défaut mega-city" \
  "head -1 '$D/features/README.md' | grep -q '^# Backlog — mega-city$'"

echo ''
# ── Cas E : lien PLAN.md émis seulement si features/PLAN.md existe (PR #43 / ADR-0018) ─
E="$TMP/e"
fiche "$E/features" 0001 story 'type: feature
priority: P1
status: todo'
: > "$E/features/PLAN.md"   # PLAN.md présent (fichier de séquence curé, hors index)
"$SCRIPT" "$E" "Backlog — test E" >/dev/null 2>&1
echo "Cas E (lien PLAN.md conditionnel) :"
check "lien PLAN.md émis quand PLAN.md existe"  "grep -qF '[PLAN.md](PLAN.md)' '$E/features/README.md'"
check "aucun lien PLAN.md quand PLAN.md absent" "! grep -qF 'PLAN.md' '$A/features/README.md'"

if [ "$FAIL" = 0 ]; then echo 'test-regen-backlog: TOUT VERT'; else echo 'test-regen-backlog: ÉCHECS' >&2; exit 1; fi
