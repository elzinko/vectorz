#!/usr/bin/env bash
# DoD exécutable — contrat du gate ezk-sprint:check (fiche 0090 tâche 1).
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
chmod +x "$CHECK"
TMP="$(mktemp -d)"
# Restaure aussi la lib partagée si S6 l'a déplacée (même si un futur --gate sortait ≠ 0 au mauvais moment).
LIB_BAK=""
trap 'rm -rf "$TMP"; [[ -n "$LIB_BAK" && -f "$LIB_BAK" ]] && mv -f "$LIB_BAK" "${LIB_BAK%.bak}"' EXIT
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
status: idea
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

echo "S4 — copies voisines PROPRES (principal + réserves détachées + branche fusionnée) → CLEAR (fiche 20261003011750521)"
# Un repo neuf, pour un décor de worktrees maîtrisé. Une branche absorbée = contenu squashé sur main.
R2="$TMP/repo2"
git init -q -b main "$R2" && ( cd "$R2"
  git config user.email t@t && git config user.name t && git config commit.gpgsign false
  echo base > a.txt && git add . && git commit -qm base
  # branche absorbée (le résidu d'un squash-merge)
  git checkout -q -b fused main && echo f > f.txt && git add f.txt && git commit -qm f
  git checkout -q main && echo f > f.txt && git add f.txt && git commit -qm "squash f"
  # deux branches réelles (contenu jamais livré sur main)
  git checkout -q -b reelleA main && echo a > ra.txt && git add ra.txt && git commit -qm ra && git checkout -q main
  git checkout -q -b reelleB main && echo b > rb.txt && git add rb.txt && git commit -qm rb && git checkout -q main
  # voisins SANS RISQUE : 2 réserves détachées sur main + 1 worktree sur la branche fusionnée
  git worktree add -q --detach "$TMP/w-res1" main
  git worktree add -q --detach "$TMP/w-res2" main
  git worktree add -q "$TMP/w-fused" fused
  # le worktree d'où l'on lancera le portier (exclu de l'analyse)
  git worktree add -q --detach "$TMP/w-runner" main )
OUT4="$(cd "$TMP/w-runner" && bash "$CHECK" --gate)"
ok "P2 CLEAR : rien à signaler"            "echo \"\$OUT4\" | grep -q '^P2_WORKTREES: CLEAR'"
ok "VERDICT CLEAR"                         "echo \"\$OUT4\" | grep -qx 'VERDICT: CLEAR'"
ok "le principal est ignoré (raison=principal)"  "echo \"\$OUT4\" | grep -q 'ignoré .*repo2 branch=main raison=principal'"
ok "réserve détachée ignorée (raison=reserve)"   "echo \"\$OUT4\" | grep -q 'ignoré .*w-res1 .*raison=reserve'"
ok "branche fusionnée ignorée (raison=fusionnee)" "echo \"\$OUT4\" | grep -q 'ignoré .*w-fused .*raison=fusionnee'"
ok "aucune copie signalée"                 "echo \"\$OUT4\" | grep -q 'copies_voisines=4 signalées=0 ignorées=4'"

echo "S5 — une copie à risque (sale / branche non fusionnée / détachée réelle) → ALERT, chacune nommée"
( cd "$TMP/repo2"
  git worktree add -q --detach "$TMP/w-dirty" main && echo wip > "$TMP/w-dirty/wip.txt"   # dirty
  git worktree add -q "$TMP/w-unmerged" reelleA                                           # unmerged
  git worktree add -q --detach "$TMP/w-detreal" reelleB )                                 # detached-real
OUT5="$(cd "$TMP/w-runner" && bash "$CHECK" --gate)"
ok "P2 ALERT"                              "echo \"\$OUT5\" | grep -q '^P2_WORKTREES: ALERT'"
ok "sale signalée (raison=dirty)"          "echo \"\$OUT5\" | grep -q 'ALERT .*w-dirty .*raison=dirty'"
ok "branche non fusionnée signalée (unmerged)" "echo \"\$OUT5\" | grep -q 'ALERT .*w-unmerged .*raison=unmerged'"
ok "détachée réelle signalée (detached-real)"  "echo \"\$OUT5\" | grep -q 'ALERT .*w-detreal .*raison=detached-real'"
ok "les propres restent ignorées"          "echo \"\$OUT5\" | grep -q 'signalées=3 ignorées=4'"

echo "S6 — lib absente : repli sur le comptage (toute copie voisine alerte), best-effort sans erreur"
LIB="$(cd "$(dirname "$CHECK")/../../ezk-archive/scripts" && pwd)/lib-worktree-safety.sh"
LIB_BAK="$LIB.bak"; mv "$LIB" "$LIB_BAK"      # le trap EXIT la restaure quoi qu'il arrive
OUT6="$(cd "$TMP/w-runner" && bash "$CHECK" --gate)"; RC6=$?
mv "$LIB_BAK" "$LIB"; LIB_BAK=""
ok "repli : ALERT par comptage"            "echo \"\$OUT6\" | grep -q 'repli comptage'"
ok "le portier ne plante pas (exit 0)"     "[ \"\$RC6\" = 0 ]"

if (( FAIL )); then
  echo "FAIL"
  exit 1
fi
echo "PASS"
