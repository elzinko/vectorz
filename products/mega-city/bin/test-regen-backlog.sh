#!/usr/bin/env bash
# DoD exécutable de la fiche 0072 — teste regen-backlog.sh sur fixtures jetables.
# Cas : A non-cassant (sans epic:/version:) · B colonnes + section Épics + exclusion du
# tirage · C warnings d'intégrité · D paramétrage racine/titre · E lien PLAN.md conditionnel
# (PR #43 / ADR-0018).
set -euo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/regen-backlog.sh"
VENDOR="$(cd "$(dirname "$0")/../skills/ezk-backlog/scripts" && pwd)/regen-backlog.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# Garde anti-dérive : bin/ et copie skill doivent être byte-identiques
# (en-tête + corps — une seule source de vérité fonctionnelle).
echo "Garde anti-dérive (bin ↔ skill) :"
check "regen-backlog.sh bin ≡ skill" "diff -q '$SCRIPT' '$VENDOR' >/dev/null"

fiche() { # $1=dir $2=id $3=slug $4=front-matter-extra (lignes YAML)
  mkdir -p "$1"
  printf -- '---\nid: %s\ntitle: fiche %s\n%s\ncreated: 2026-07-17\n---\n\ncorps\n' \
    "$2" "$2" "$4" > "$1/$2-$3.md"
}

# ── Cas A : backlog sans epic:/version: → aucune colonne/section en plus ──────────
A="$TMP/a"
fiche "$A/features"      0001 story 'type: feature
priority: P1
status: idea'
fiche "$A/features"      0002 idee  'type: chore
priority: P2
status: idea'
fiche "$A/features/done" 0000 vieux 'type: feature
priority: P1
status: shipped
pr: "#1"'
out_a="$("$SCRIPT" "$A" "Backlog — test A" 2>"$TMP/a.err")"
echo "Cas A (non cassant) :"
check "titre paramétré"            "head -1 '$A/features/BACKLOG.md' | grep -q '^# Backlog — test A$'"
check "pas de colonne Version"     "! grep -q '| Version |' '$A/features/BACKLOG.md'"
check "pas de colonne Épic"        "! grep -q '| Épic |' '$A/features/BACKLOG.md'"
check "pas de section Épics"       "! grep -q '## 🧭 Épics' '$A/features/BACKLOG.md'"
check "section Idées présente"     "grep -q '## 💡 Idées' '$A/features/BACKLOG.md'"
check "zéro warning"               "! test -s '$TMP/a.err'"
check "stats émises"               "printf '%s' \"\$out_a\" | grep -q 'stats: total=3'"
check "résumé Livrées cliquable (done/)" \
  "grep '^> Livrées' '$A/features/BACKLOG.md' | grep -qF '[0000](done/0000-vieux.md)'"

# ── Cas B : épics + version → colonnes, section, exclusion du tableau actionnable ─
B="$TMP/b"
fiche "$B/features"      0010 epic-pivot 'type: epic
priority: P0
status: idea'
fiche "$B/features"      0011 enfant-a 'type: feature
priority: P1
status: idea
ready: 2026-07-17
epic: 0010'
fiche "$B/features"      0012 jalon 'type: chore
priority: P2
version: V1.1
status: idea'
fiche "$B/features/done" 0009 enfant-livre 'type: feature
priority: P1
status: shipped
epic: 0010
pr: "#2"'
"$SCRIPT" "$B" "Backlog — test B" >/dev/null 2>"$TMP/b.err"
idx="$B/features/BACKLOG.md"
echo "Cas B (colonnes + section Épics) :"
check "colonne Version présente"   "grep -q '| Version |' '$idx'"
check "colonne Épic présente"      "grep -q '| Épic |' '$idx'"
check "section Épics présente"     "grep -q '## 🧭 Épics' '$idx'"
check "épic 0010 HORS tableau actionnable" \
  "! awk '/^## /{exit} {print}' '$idx' | grep -q '^| \[0010\]'"
check "épic 0010 dans la section Épics" \
  "sed -n '/## 🧭 Épics/,/## 💡/p' '$idx' | grep -q '^| \[0010\]'"
check "enfant 0011 porte la réf 0010"  "grep -q '^| \[0011\].*| 0010 |' '$idx'"
check "version V1.1 rendue"            "grep -q '^| \[0012\].*| V1.1 |' '$idx'"
check "zéro warning (refs valides)"    "! test -s '$TMP/b.err'"
# Liens cliquables (règle human-facing-lisibility, revue Codex #184) : relatifs au doc.
check "id actif → lien vers sa fiche (relatif au doc)" \
  "grep -qF '| [0011](0011-enfant-a.md) |' '$idx'"
check "id livré → lien vers done/ (relatif au doc)" \
  "grep -qF '[0009](done/0009-enfant-livre.md)' '$idx'"
check "AUCUN lien préfixé features/ (résolution document-relative)" \
  "! grep -qF '](features/' '$idx'"

# ── Cas C : intégrité — réf pendante, cible non-epic, sous-épic ───────────────────
C="$TMP/c"
fiche "$C/features" 0020 epic-ok 'type: epic
priority: P1
status: idea'
fiche "$C/features" 0021 pendante 'type: feature
priority: P1
status: idea
epic: 9999'
fiche "$C/features" 0022 vers-non-epic 'type: feature
priority: P2
status: idea
epic: 0021'
fiche "$C/features" 0023 sous-epic 'type: epic
priority: P2
status: idea
epic: 0020'
"$SCRIPT" "$C" "Backlog — test C" >/dev/null 2>"$TMP/c.err"
echo "Cas C (warnings intégrité) :"
check "warning réf pendante (0021→9999)"    "grep -q 'fiche 0021 — epic: 9999 introuvable' '$TMP/c.err'"
check "warning cible non-epic (0022→0021)"  "grep -q 'fiche 0022 — epic: 0021 introuvable ou non-epic' '$TMP/c.err'"
check "warning sous-épic (0023)"            "grep -q 'fiche 0023 — une épic ne référence pas' '$TMP/c.err'"
check "warnings NON bloquants (index écrit)" "test -s '$C/features/BACKLOG.md'"

# ── Cas D : défauts (racine = parent de bin/, titre mega-city) — hermétique ──────
# (revue Codex PR #30 : ne JAMAIS régénérer le vrai index depuis le banc — copie du
# script dans un produit-fixture, la résolution par défaut opère dedans.)
D="$TMP/d"
mkdir -p "$D/bin"
cp "$SCRIPT" "$D/bin/regen-backlog.sh"
fiche "$D/features" 0030 defaut 'type: feature
priority: P2
status: idea'
echo "Cas D (défauts, hermétique) :"
check "sans args → racine = parent de bin/ (fixture)" \
  "cd '$TMP' && bash '$D/bin/regen-backlog.sh' >/dev/null 2>&1 && test -s '$D/features/BACKLOG.md'"
check "titre par défaut mega-city" \
  "head -1 '$D/features/BACKLOG.md' | grep -q '^# Backlog — mega-city$'"

echo ''
# ── Cas E : lien PLAN.md émis seulement si features/PLAN.md existe (PR #43 / ADR-0018) ─
E="$TMP/e"
fiche "$E/features" 0001 story 'type: feature
priority: P1
status: idea'
: > "$E/features/PLAN.md"   # PLAN.md présent (fichier de séquence curé, hors index)
"$SCRIPT" "$E" "Backlog — test E" >/dev/null 2>&1
echo "Cas E (lien PLAN.md conditionnel) :"
check "lien PLAN.md émis quand PLAN.md existe"  "grep -qF '[PLAN.md](PLAN.md)' '$E/features/BACKLOG.md'"
check "aucun lien PLAN.md quand PLAN.md absent" "! grep -qF 'PLAN.md' '$A/features/BACKLOG.md'"

# ── Cas F : colonne Produit (fiche 0064) + warning id en double ─────────────────
F="$TMP/f"
fiche "$F/features" 0001 story-a 'type: feature
priority: P1
status: idea
product: vectorz'
fiche "$F/features" 0002 story-b 'type: feature
priority: P2
status: idea
product: mega-city'
out_f="$("$SCRIPT" "$F" "Backlog — test F" 2>"$TMP/f.err")"
echo "Cas F (colonne Produit) :"
check "colonne Produit présente"   "grep -q '| Produit |' '$F/features/BACKLOG.md'"
check "produit vectorz rendu"      "grep -q '^| \[0001\].*| vectorz |' '$F/features/BACKLOG.md'"
check "produit mega-city rendu"    "grep -q '^| \[0002\].*| mega-city |' '$F/features/BACKLOG.md'"
check "zéro warning (ids uniques)" "! test -s '$TMP/f.err'"

# Collision volontaire : deux fichiers même id
mkdir -p "$F/features/done"
printf -- '---\nid: 0001\ntitle: doublon\ntype: feature\npriority: P3\nstatus: shipped\nproduct: vectorz\ncreated: 2026-07-30\n---\n' \
  > "$F/features/done/0001-doublon.md"
"$SCRIPT" "$F" "Backlog — test F-dup" >/dev/null 2>"$TMP/f-dup.err"
check "warning id en double" "grep -q 'id 0001 en double' '$TMP/f-dup.err'"

# ── Cas G : id horodaté QUOTÉ (fiche 0180) → index dé-quoté (17 chiffres > MAX_SAFE_INTEGER) ──
G="$TMP/g"; mkdir -p "$G/features/done"
printf -- '---\nid: "20260810143052123"\ntitle: fiche horodatee quotee\ntype: feature\npriority: P2\nstatus: idea\nproduct: vectorz\ncreated: 2026-08-10\n---\n' \
  > "$G/features/20260810143052123_horodatee.md"
"$SCRIPT" "$G" "Backlog — test G" >/dev/null 2>"$TMP/g.err"
echo "Cas G (id horodaté quoté) :"
check "id 17 chiffres dé-quoté dans l'index" "grep -qE '^\| \[20260810143052123\]\(' '$G/features/BACKLOG.md'"
check "aucun guillemet résiduel sur l'id"    "! grep -q '\"20260810143052123\"' '$G/features/BACKLOG.md'"
check "zéro warning (id quoté)"              "! test -s '$TMP/g.err'"

if [ "$FAIL" = 0 ]; then echo 'test-regen-backlog: TOUT VERT'; else echo 'test-regen-backlog: ÉCHECS' >&2; exit 1; fi
