#!/usr/bin/env bash
# DoD exécutable — contrat du gate ezk-sprint:check (fiche 0090 tâche 1).
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
chmod +x "$CHECK"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() {
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

cd "$TMP"
git init -q -b main repo && cd repo
git config user.email test@test && git config user.name test
git config commit.gpgsign false
mkdir -p features
cat > features/0043-todo.md <<'EOF'
---
id: 0043
title: une fiche todo
status: todo
---
EOF
echo hello > a.txt
git add . && git commit -qm "base"

echo "S1 — repo discipliné : CLEAR"
OUT="$(bash "$CHECK" --gate)"
ok "VERDICT: CLEAR" "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAR'"
ok "P1 CLEAR" "echo \"\$OUT\" | grep -q '^P1_TREE: CLEAR'"
ok "P2 CLEAR" "echo \"\$OUT\" | grep -q '^P2_WORKTREES: CLEAR'"
ok "P3 CLEAR" "echo \"\$OUT\" | grep -q '^P3_IN_PROGRESS: CLEAR'"
ok "END marker" "echo \"\$OUT\" | tail -1 | grep -q -- '--- END ---'"
ok "exit 0" "bash \"$CHECK\" --gate >/dev/null"

echo "S2 — working tree dirty → ALERT point 1"
echo dirty >> a.txt
OUT2="$(bash "$CHECK" --gate)"
ok "VERDICT ALERT points=1" "echo \"\$OUT2\" | grep -q '^VERDICT: ALERT points=1'"
ok "P1 ALERT" "echo \"\$OUT2\" | grep -q '^P1_TREE: ALERT'"
git checkout -- a.txt

echo "S3 — fiche in-progress → ALERT point 3"
cat > features/0099-en-cours.md <<'EOF'
---
id: 0099
title: sprint en vol
status: in-progress
---
EOF
git add features/0099-en-cours.md && git commit -qm "fixture: fiche in-progress"
OUT3="$(bash "$CHECK" --gate)"
ok "VERDICT ALERT points=3" "echo \"\$OUT3\" | grep -q '^VERDICT: ALERT points=3'"
ok "P3 ALERT + id" "echo \"\$OUT3\" | grep -q 'id=0099'"

if (( FAIL )); then
  echo "FAIL"
  exit 1
fi
echo "PASS"
