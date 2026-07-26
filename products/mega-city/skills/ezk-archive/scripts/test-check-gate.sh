#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — le CONTRAT DU GATE de check.sh.
#
# Ce que ces cas verrouillent, dans l'ordre d'importance :
#   G5  le FAUX CLEAN est impossible sans déclaration de l'appelant (non-régression :
#       une session qui n'a pas tenu ses comptes tombe toujours en délégation complète) ;
#   G1  une session disciplinée produit un verdict CLEAN et une sortie minuscule ;
#   G6  le bruit regex sur handoff.md (96 lignes sur 120) a bien disparu ;
#   G7  le portier reste strictement read-only (il ne fetch pas, n'écrit rien).
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() { # $1=label $2=cmd (0=ok)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# ── fixture : un repo discipliné, sans remote, sans branche en vol ────────────
cd "$TMP"
git init -q -b main repo && cd repo
git config user.email test@test && git config user.name test
git config commit.gpgsign false
mkdir -p features/done
cat > features/README.md <<'EOF'
# Backlog
EOF
cat > features/done/0042-fiche-livree.md <<'EOF'
---
id: 0042
title: une fiche bien livrée
status: shipped
pr: "#123"
---
EOF
cat > features/0043-fiche-en-cours.md <<'EOF'
---
id: 0043
title: une fiche pas encore livrée
status: todo
pr:
---
EOF
echo hello > a.txt
git add . && git commit -qm "base"

echo "G1 — session disciplinée : CLEAN, sortie minuscule, aucun fait :"
OUT="$(bash "$CHECK" --gate --shipped 0042)"
ok "VERDICT: CLEAN"                          "echo \"\$OUT\" | grep -qx 'VERDICT: CLEAN'"
ok "sortie ≤ 15 lignes"                      "[ \"\$(echo \"\$OUT\" | wc -l | tr -d ' ')\" -le 15 ]"
ok "AUCUNE ligne de fait [P…"                "! echo \"\$OUT\" | grep -q '^\['"
ok "les 4 points sont CLEAN"                 "[ \"\$(echo \"\$OUT\" | grep -cE '^P[1-4]_[A-Z]+: CLEAN')\" = 4 ]"
ok "MAINSYNC: NA (pas de remote)"            "echo \"\$OUT\" | grep -q '^MAINSYNC: NA'"
ok "le bloc est terminé par --- END ---"     "echo \"\$OUT\" | tail -1 | grep -q -- '--- END ---'"
ok "exit 0 sur CLEAN"                        "bash \"\$CHECK\" --gate --shipped 0042 >/dev/null"

echo "G5 (LE garde-fou) — sans --shipped, aucune preuve ⇒ jamais CLEAN :"
OUT5="$(bash "$CHECK" --gate)"
ok "P3_BACKLOG: UNKNOWN"                     "echo \"\$OUT5\" | grep -q '^P3_BACKLOG: UNKNOWN'"
ok "VERDICT: DIRTY points=3"                 "echo \"\$OUT5\" | grep -qx 'VERDICT: DIRTY points=3'"
ok "declared=- (rien déclaré ≠ « rien livré »)" "echo \"\$OUT5\" | grep -q 'declared=-'"
ok "exit 0 quand même (le verdict passe par stdout, pas par le code retour)" \
   "bash \"\$CHECK\" --gate >/dev/null"
OUT5b="$(bash "$CHECK" --gate --shipped none)"
ok "--shipped none ⇒ P3 CLEAN et declared=none" \
   "echo \"\$OUT5b\" | grep -q '^P3_BACKLOG: CLEAN declared=none'"

echo "G4 — une fiche déclarée livrée mais restée en todo est détectée :"
OUT4="$(bash "$CHECK" --gate --shipped 0043)"
ok "points contient 3"                       "echo \"\$OUT4\" | grep -q '^VERDICT: DIRTY points=.*3'"
ok "le fait cite la fiche et son statut"     "echo \"\$OUT4\" | grep -q '\[P3\] declared 0043 not shipped:.*status=todo'"
OUT4b="$(bash "$CHECK" --gate --shipped mc-0042)"
ok "le préfixe alpha est toléré (mc-0042 → 0042)" "echo \"\$OUT4b\" | grep -qx 'VERDICT: CLEAN'"
OUT4c="$(bash "$CHECK" --gate --shipped 9999)"
ok "un id inconnu est signalé, pas ignoré"   "echo \"\$OUT4c\" | grep -q '\[P3\] declared 9999 introuvable'"

echo "G2 — working tree sale :"
echo scratch > untracked.txt
OUT2="$(bash "$CHECK" --gate --shipped 0042)"
ok "points contient 1"                       "echo \"\$OUT2\" | grep -q '^VERDICT: DIRTY points=1'"
ok "P1_TREE: DIRTY untracked=1"              "echo \"\$OUT2\" | grep -q '^P1_TREE: DIRTY modified=0 untracked=1'"
ok "le fichier est cité"                     "echo \"\$OUT2\" | grep -q '\[P1\] worktree ?? untracked.txt'"
rm untracked.txt

echo "G6 — le bruit regex du handoff a disparu :"
mkdir -p .claude
{ echo "# Handoff"; echo;
  for i in $(seq 1 100); do
    echo "- entrée $i : \`todo\` \`main\` \`run\` \`INIT_CWD\` \`RunProjection\` PR #$i"
  done; } > .claude/handoff.md
OUT6="$(bash "$CHECK" --gate --shipped 0042)"
ok "aucun \`INIT_CWD\` recraché"              "! echo \"\$OUT6\" | grep -q 'INIT_CWD'"
ok "aucun \`RunProjection\` recraché"         "! echo \"\$OUT6\" | grep -q 'RunProjection'"
ok "aucun numéro de PR du handoff recraché"  "! echo \"\$OUT6\" | grep -qE '#[0-9]+'"
ok "seul le compte est émis (lines=102)"     "echo \"\$OUT6\" | grep -q '^HANDOFF: entries=0 lines=102'"
ok "la sortie reste ≤ 15 lignes malgré un handoff de 102 lignes" \
   "[ \"\$(echo \"\$OUT6\" | wc -l | tr -d ' ')\" -le 15 ]"

echo "G8 — la sortie reste bornée sur une fixture très sale :"
for i in $(seq 1 40); do
  git switch -qc "feat/bruit-$i" 2>/dev/null
  echo "contenu $i" > "f$i.txt" && git add "f$i.txt" && git commit -qm "feat: $i"
  git switch -q main
done
for i in $(seq 1 30); do echo "x" > "untracked-$i.txt"; done
OUT8="$(bash "$CHECK" --gate)"
ok "sortie ≤ 60 lignes malgré 40 branches et 30 untracked" \
   "[ \"\$(echo \"\$OUT8\" | wc -l | tr -d ' ')\" -le 60 ]"
ok "la troncature est ANNONCÉE, pas silencieuse" "echo \"\$OUT8\" | grep -q 'lignes omises\|faits omis'"
ok "les compteurs restent justes malgré la troncature (branch_real=40)" \
   "echo \"\$OUT8\" | grep -q 'branch_real=40'"
ok "--point 1 permet de retrouver le détail d'un point" \
   "[ \"\$(bash \"\$CHECK\" --gate --point 1 | grep -c '^\[P1\]')\" -ge 25 ]"
rm -f untracked-*.txt

echo "G9 — le rendu --full réémet bien les sections humaines :"
FULL="$(bash "$CHECK" --full --shipped 0042)"
for s in "## 1. Working tree" "## 2. PRs & branches en attente" "## 3. Backlog" "## 4. ADR de la session" "## Note de handoff"; do
  ok "section « $s » présente" "echo \"\$FULL\" | grep -qF '$s'"
done
ok "--full affiche aussi le verdict"         "echo \"\$FULL\" | grep -q 'VERDICT : DIRTY'"
# NB on capture d'abord dans une variable : `check.sh | grep -q` ferait sortir grep dès
# le premier match, SIGPIPE-rait check.sh, et sous `pipefail` le pipeline échouerait —
# c'est le piège que check.sh documente pour blob_landed, et il vaut aussi ici.
GATE_AFTER="$(bash "$CHECK" --gate)"
ok "--full et --gate s'accordent sur le nombre de branches réelles" \
   "echo \"\$FULL\" | grep -q 'NON livré' && echo \"\$GATE_AFTER\" | grep -q 'branch_real=40'"

echo "G7 — strictement read-only :"
BEFORE_STATUS="$(git status --porcelain | sort)"
BEFORE_BRANCHES="$(git branch --format='%(refname:short)' | sort)"
BEFORE_HANDOFF="$(stat -f %m .claude/handoff.md 2>/dev/null || stat -c %Y .claude/handoff.md)"
bash "$CHECK" --gate --shipped 0042 >/dev/null
bash "$CHECK" --full --shipped 0042 >/dev/null
ok "working tree inchangé"   "[ \"\$BEFORE_STATUS\" = \"\$(git status --porcelain | sort)\" ]"
ok "branches inchangées"     "[ \"\$BEFORE_BRANCHES\" = \"\$(git branch --format='%(refname:short)' | sort)\" ]"
ok "mtime de handoff.md inchangé (le portier ne le touche pas)" \
   "[ \"\$BEFORE_HANDOFF\" = \"\$(stat -f %m .claude/handoff.md 2>/dev/null || stat -c %Y .claude/handoff.md)\" ]"
ok "aucun FETCH_HEAD créé (le portier ne fetch jamais)" "[ ! -f .git/FETCH_HEAD ]"

echo "G3 — option inconnue et hors dépôt :"
ok "option inconnue ⇒ exit 2"    "! bash \"\$CHECK\" --nawak >/dev/null 2>&1"
ok "hors dépôt git ⇒ exit 2"     "( cd \"\$TMP\" && ! bash \"\$CHECK\" >/dev/null 2>&1 )"
ok "--help n'exécute rien"       "bash \"\$CHECK\" --help | grep -q 'portier de clôture'"

echo
if [ "$FAIL" = 0 ]; then echo "test-check-gate: TOUT VERT"; else echo "test-check-gate: ÉCHECS"; exit 1; fi
