#!/usr/bin/env bash
# DoD exécutable — Skema check-layout-version + apply-001 (fixtures jetables).
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
check "PENDING contient 002" "printf '%s' \"\$out_b\" | grep -q '002-readme-vs-backlog'"

# Cas C : apply-002 → ok
echo "Cas C (apply 002) :"
# Copier regen dans une structure type monorepo pour le helper
mkdir -p "$B/products/mega-city/bin"
cp "$REGEN" "$B/products/mega-city/bin/regen-backlog.sh"
bash "$APPLY" "$B" "Backlog — test C" >/dev/null
check "BACKLOG.md créé" "test -s '$B/features/BACKLOG.md'"
check "README a layout_version: 2" "grep -q '^layout_version: 2' '$B/features/README.md'"
check "README n'est plus index auto" "! grep -q 'Index auto-généré' '$B/features/README.md'"
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

if [ "$FAIL" = 0 ]; then echo 'test-layout-version: TOUT VERT'; else echo 'test-layout-version: ÉCHECS' >&2; exit 1; fi
