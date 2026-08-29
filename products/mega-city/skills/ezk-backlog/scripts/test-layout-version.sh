#!/usr/bin/env bash
# DoD exécutable — Skema check-layout-version + apply-002 (fixtures jetables).
set -euo pipefail

SKILL="$(cd "$(dirname "$0")/.." && pwd)"
CHECK="$SKILL/scripts/check-layout-version.sh"
APPLY="$SKILL/scripts/apply-002-readme-vs-backlog.sh"
REGEN="$(cd "$SKILL/../.." && pwd)/bin/regen-backlog.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() {
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# Cas A : pas de features/ → missing
echo "Cas A (missing) :"
mkdir -p "$TMP/empty"
out_a="$("$CHECK" "$TMP/empty")"
check "STATUS=missing" "printf '%s' \"\$out_a\" | grep -q 'STATUS=missing'"
check "CURRENT=2" "printf '%s' \"\$out_a\" | grep -q 'CURRENT=2'"

# Cas B : legacy README index généré → behind, pending 002
B="$TMP/legacy"
mkdir -p "$B/features"
cat > "$B/features/README.md" <<'EOF'
# Backlog — test

> Index auto-généré — ne pas éditer.

| # | Titre |
|---|-------|
EOF
printf -- '---\nid: 0001\ntitle: demo\ntype: feature\npriority: P1\nstatus: todo\ncreated: 2026-08-01\n---\n' \
  > "$B/features/0001-demo.md"
out_b="$("$CHECK" "$B")"
echo "Cas B (legacy behind) :"
check "STATUS=behind" "printf '%s' \"\$out_b\" | grep -q 'STATUS=behind'"
check "INSTALLED=1" "printf '%s' \"\$out_b\" | grep -q 'INSTALLED=1'"
check "PENDING contient 002" "printf '%s' \"\$out_b\" | grep -q '002-readme-vs-backlog'"

# Cas C : apply-002 → ok + backup
echo "Cas C (apply 002) :"
mkdir -p "$B/products/mega-city/bin"
cp "$REGEN" "$B/products/mega-city/bin/regen-backlog.sh"
bash "$APPLY" "$B" "Backlog — test C" >/dev/null
check "BACKLOG.md créé" "test -s '$B/features/BACKLOG.md'"
check "README a layout_version: 2" "grep -q '^layout_version: 2' '$B/features/README.md'"
check "README n'est plus index auto" "! grep -q 'Index auto-généré' '$B/features/README.md'"
check "backup .bak-skema-002" "test -f '$B/features/README.md.bak-skema-002'"
check "backup contient Index auto" "grep -q 'Index auto-généré' '$B/features/README.md.bak-skema-002'"
out_c="$("$CHECK" "$B")"
check "STATUS=ok après migrate" "printf '%s' \"\$out_c\" | grep -q 'STATUS=ok'"
check "INSTALLED=2" "printf '%s' \"\$out_c\" | grep -q 'INSTALLED=2'"

# Cas D : init sur projet vierge
D="$TMP/fresh"
mkdir -p "$D"
bash "$SKILL/init.sh" "$D" "Backlog — fresh" >/dev/null
echo "Cas D (init) :"
check "README curé" "grep -q '^layout_version: 2' '$D/features/README.md'"
check "BACKLOG.md présent" "test -f '$D/features/BACKLOG.md'"
check "done/ présent" "test -d '$D/features/done'"
check "template présent" "test -f '$D/features/feature-template.md'"
out_d="$("$CHECK" "$D")"
check "init → STATUS=ok" "printf '%s' \"\$out_d\" | grep -q 'STATUS=ok'"

# Cas E : init refuse half-migrate v1 (pas de BACKLOG créé, exit 2)
E="$TMP/v1-init"
mkdir -p "$E/features"
cat > "$E/features/README.md" <<'EOF'
# Backlog — legacy

> Index auto-généré — ne pas éditer.

| # | Titre |
|---|-------|
EOF
echo "Cas E (init refuse v1) :"
set +e
out_e="$(bash "$SKILL/init.sh" "$E" "Backlog — E" 2>&1)"
rc_e=$?
set -e
check "exit 2" "test '$rc_e' -eq 2"
check "pas de BACKLOG.md" "! test -f '$E/features/BACKLOG.md'"
check "message STATUS=behind" "printf '%s' \"\$out_e\" | grep -q 'STATUS=behind'"
check "pointe apply-002" "printf '%s' \"\$out_e\" | grep -q 'apply-002-readme-vs-backlog'"

# Cas F : README curé / tombstone sans marqueur → pas behind, pas de pending 002
F="$TMP/ambiguous"
mkdir -p "$F/features"
echo '# Guide sans marqueur (tombstone / curé)' > "$F/features/README.md"
cat > "$F/features/BACKLOG.md" <<'EOF'
# Backlog

> Index auto-généré — ne pas éditer.

| # | Titre | Type | Prio | Statut | PR |
|---|-------|------|------|--------|----|
EOF
out_f="$("$CHECK" "$F")"
echo "Cas F (curé sans marqueur → ok, pas migrate) :"
check "INSTALLED=0" "printf '%s' \"\$out_f\" | grep -q 'INSTALLED=0'"
check "STATUS=ok" "printf '%s' \"\$out_f\" | grep -q 'STATUS=ok'"
check "PENDING=none" "printf '%s' \"\$out_f\" | grep -q 'PENDING=none'"

# Cas G : resolve-regen via EZK_REGEN_BACKLOG (repo externe sans mega-city tree)
G="$TMP/external"
mkdir -p "$G/features" "$G/bin"
cp "$REGEN" "$G/bin/regen-backlog.sh"
chmod +x "$G/bin/regen-backlog.sh"
printf -- '---\nid: 0001\ntitle: ext\ntype: feature\npriority: P2\nstatus: todo\ncreated: 2026-08-01\n---\n' \
  > "$G/features/0001-ext.md"
cat > "$G/features/README.md" <<'EOF'
# Backlog

> Index auto-généré — ne pas éditer.
EOF
echo "Cas G (EZK_REGEN_BACKLOG) :"
EZK_REGEN_BACKLOG="$G/bin/regen-backlog.sh" bash "$APPLY" "$G" "Backlog — ext" >/dev/null
check "migrate externe OK" "grep -q '^layout_version: 2' '$G/features/README.md'"
check "BACKLOG regen externe" "grep -q '^| \[0001\]' '$G/features/BACKLOG.md'"

# Cas H : apply-002 refuse README curé / tombstone
H="$TMP/tombstone"
mkdir -p "$H/features" "$H/products/mega-city/bin"
cp "$REGEN" "$H/products/mega-city/bin/regen-backlog.sh"
cat > "$H/features/README.md" <<'EOF'
# features/ (mega-city) — migrées

Depuis la fiche 0064, tombstone curée — ne pas écraser.
EOF
echo "Cas H (refuse curated) :"
set +e
out_h="$(bash "$APPLY" "$H" "Backlog — H" 2>&1)"
rc_h=$?
set -e
check "exit 1" "test '$rc_h' -eq 1"
check "README intact" "grep -q 'tombstone curée' '$H/features/README.md'"
check "pas de scaffold" "! grep -q 'layout_version' '$H/features/README.md'"
check "message refuse" "printf '%s' \"\$out_h\" | grep -q 'pas un index v1'"

# Cas I : init deux fois — BACKLOG peuplé non écrasé
I="$TMP/init-twice"
mkdir -p "$I"
bash "$SKILL/init.sh" "$I" "Backlog — I" >/dev/null
cat > "$I/features/BACKLOG.md" <<'EOF'
# Backlog — I

> Index auto-généré — ne pas éditer.

| # | Titre | Type | Prio | Statut | PR |
|---|-------|------|------|--------|----|
| 0099 | keep-me | feature | P1 | 🔴 todo | |

> Livrées (`done/`) : .
EOF
cp "$I/features/BACKLOG.md" "$I/features/BACKLOG.md.before"
bash "$SKILL/init.sh" "$I" "Backlog — I" >/dev/null
echo "Cas I (init ne clobber pas BACKLOG) :"
check "BACKLOG inchangé" "diff -q '$I/features/BACKLOG.md' '$I/features/BACKLOG.md.before' >/dev/null"
check "ligne keep-me" "grep -q 'keep-me' '$I/features/BACKLOG.md'"

# Cas J : racine inexistante → missing, exit 0
echo "Cas J (racine inexistante) :"
set +e
out_j="$("$CHECK" "/tmp/does-not-exist-skema-$$" 2>&1)"
rc_j=$?
set -e
check "exit 0" "test '$rc_j' -eq 0"
check "STATUS=missing" "printf '%s' \"\$out_j\" | grep -q 'STATUS=missing'"

# Cas K : skill-vendored regen — skill copiée hors monorepo (hermétique)
K="$TMP/skill-vendor"
mkdir -p "$K/features"
cat > "$K/features/README.md" <<'EOF'
# Backlog

> Index auto-généré — ne pas éditer.
EOF
printf -- '---\nid: 0002\ntitle: vendor\ntype: feature\npriority: P2\nstatus: todo\ncreated: 2026-08-01\n---\n' \
  > "$K/features/0002-vendor.md"
# Isoler la skill : SKILL_DIR/../.. ne doit plus résoudre vers le bin monorepo.
SKILL_ISO="$TMP/skill-iso/ezk-backlog"
mkdir -p "$TMP/skill-iso"
cp -R "$SKILL" "$SKILL_ISO"
APPLY_ISO="$SKILL_ISO/scripts/apply-002-readme-vs-backlog.sh"
RESOLVE_ISO="$SKILL_ISO/scripts/resolve-regen-backlog.sh"
VENDORED="$SKILL_ISO/scripts/regen-backlog.sh"
echo "Cas K (regen vendored skill) :"
resolved_k="$(env -i PATH="/usr/bin:/bin" HOME="$HOME" bash "$RESOLVE_ISO" "$K")"
check "resolve → copie vendored" "[[ \"\$resolved_k\" == \"$VENDORED\" ]]"
env -i PATH="/usr/bin:/bin" HOME="$HOME" bash "$APPLY_ISO" "$K" "Backlog — vendor" >/dev/null
check "migrate via skill regen" "grep -q '^layout_version: 2' '$K/features/README.md'"
check "BACKLOG via skill regen" "grep -q '^| \[0002\]' '$K/features/BACKLOG.md'"

# Cas L : init sur racine inexistante → exit 1 + message clair
echo "Cas L (init racine inexistante) :"
set +e
out_l="$(bash "$SKILL/init.sh" "/tmp/does-not-exist-init-skema-$$" 2>&1)"
rc_l=$?
set -e
check "exit 1" "test '$rc_l' -eq 1"
check "message racine inexistante" "printf '%s' \"\$out_l\" | grep -q 'racine inexistante'"

if [ "$FAIL" = 0 ]; then echo 'test-layout-version: TOUT VERT'; else echo 'test-layout-version: ÉCHECS' >&2; exit 1; fi
