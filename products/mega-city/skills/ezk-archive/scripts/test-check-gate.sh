#!/usr/bin/env bash
# DoD exécutable de la fiche 0088 — le CONTRAT DU GATE de check.sh.
#
# Ce que ces cas verrouillent, dans l'ordre d'importance :
#   G5  le FAUX CLEAN est impossible sans déclaration de l'appelant (non-régression :
#       une session qui n'a pas tenu ses comptes tombe toujours en délégation complète) ;
#   G1  une session disciplinée produit un verdict CLEAN et une sortie minuscule ;
#   G6  le bruit regex sur handoff.md (96 lignes sur 120) a bien disparu ;
#   G7  le portier reste strictement read-only (il ne fetch pas, n'écrit rien) ;
#   G11 `durable=1` seulement si la note vit sous `<git-common-dir>/ezk/` (fiche 20261003105820077) ;
#   G9  à la clôture, une branche fusionnée en squash sur origin/main est absorbée, même quand le
#       main local est en retard ; une branche jamais fusionnée reste réelle (fiche 20261002155911250).
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
HANDOFF_SH="$(cd "$(dirname "$0")" && pwd)/handoff.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() { # $1=label $2=cmd (0=ok)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

# mtime portable. `stat -f %m … || stat -c %Y …` était FAUX sur GNU coreutils, où `-f`
# signifie `--file-system` : la commande y imprime des statistiques de système de fichiers
# (blocs libres, inodes) avant d'échouer sur `%m`, le `||` ne se déclenche pas toujours, et
# on compare des valeurs qui bougent toutes seules — assertion read-only flaky en CI
# (finding Codex PR #56). On détecte la variante UNE fois, sur une sonde explicite.
if stat -c %Y . >/dev/null 2>&1; then mtime() { stat -c %Y "$1"; }   # GNU coreutils
else                                  mtime() { stat -f %m "$1"; }   # BSD / macOS
fi

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
status: idea
pr:
---
EOF
# fiche HORODATÉE livrée (nom <id>_<slug>.md, fiche 0180) — le gate doit la reconnaître en done/
cat > features/done/20260810143052123_fiche-horodatee.md <<'EOF'
---
id: 20260810143052123
title: fiche horodatée livrée
status: shipped
pr: "#124"
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

echo "G1b — fiche HORODATÉE shippée (nom <id>_<slug>.md, fiche 0180) reconnue CLEAN :"
OUThz="$(bash "$CHECK" --gate --shipped 20260810143052123)"
ok "VERDICT: CLEAN sur id horodaté"          "echo \"\$OUThz\" | grep -qx 'VERDICT: CLEAN'"
ok "P3_BACKLOG: CLEAN (fiche _slug vue en done/)" "echo \"\$OUThz\" | grep -q '^P3_BACKLOG: CLEAN'"

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

echo "G4 — une fiche déclarée livrée mais restée en idea est détectée :"
OUT4="$(bash "$CHECK" --gate --shipped 0043)"
ok "points contient 3"                       "echo \"\$OUT4\" | grep -q '^VERDICT: DIRTY points=.*3'"
ok "le fait cite la fiche et son statut"     "echo \"\$OUT4\" | grep -q '\[P3\] declared 0043 not shipped:.*status=idea'"
# NB cette assertion vérifiait auparavant que le préfixe était JETÉ (« 0147 → 0042 »).
# C'était précisément le bug relevé par Codex (PR #56) : le préfixe DÉSIGNE un backlog, il
# ne décore pas le numéro. Ici la fixture n'a qu'un backlog racine, donc `mc-` ne résout
# rien — et refuser de conclure vaut mieux que valider la fiche d'à côté (cf. G10).
# Préfixe `mc-` (pas l'id nu) : sans backlog mega-city dans la fixture, on refuse
# de conclure. La migration 0064 avait retiré le préfixe par erreur — le rétablir.
OUT4b="$(bash "$CHECK" --gate --shipped mc-0147)"
ok "un préfixe qui ne désigne aucun backlog ⇒ refus de conclure, pas un CLEAN" \
   "echo \"\$OUT4b\" | grep -q 'prefixe .mc. non resolu' && echo \"\$OUT4b\" | grep -q '^VERDICT: DIRTY'"
OUT4c="$(bash "$CHECK" --gate --shipped 9999)"
ok "un id inconnu est signalé, pas ignoré"   "echo \"\$OUT4c\" | grep -q '\[P3\] declared 9999 introuvable'"

echo "G10 — monorepo : le préfixe d'id doit désigner le BON backlog (finding Codex PR #56) :"
# Les numéros ne sont pas uniques entre backlogs — dans ce dépôt, 62 numéros existent des
# deux côtés. Jeter le préfixe et prendre le premier match global validait la mauvaise
# fiche : `--shipped 0110` pouvait être « prouvé » par la fiche RACINE 0005.
mkdir -p products/demo-produit/features/done
echo '# Backlog produit' > products/demo-produit/features/README.md
cat > products/demo-produit/features/0042-homonyme-pas-livree.md <<'EOF'
---
id: 0042
title: même numéro, autre backlog, PAS livrée
status: idea
pr:
---
EOF
git add products features && git commit -qm "fixture: second backlog avec un numéro homonyme"
OUTA="$(bash "$CHECK" --gate --shipped dp-0042)"
ok "dp-0042 vise le backlog demo-produit, pas la racine" \
   "echo \"\$OUTA\" | grep -q 'declared dp-0042 not shipped:.*products/demo-produit'"
ok "…et le verdict est DIRTY (la fiche homonyme n'est PAS livrée)" \
   "echo \"\$OUTA\" | grep -q '^VERDICT: DIRTY points=.*3'"
OUTB="$(bash "$CHECK" --gate --shipped 0042)"
ok "0042 sans préfixe vise la racine, où la fiche EST livrée ⇒ CLEAN" \
   "echo \"\$OUTB\" | grep -qx 'VERDICT: CLEAN'"
OUTC="$(bash "$CHECK" --gate --shipped zz-0042)"
ok "un préfixe non résolvable refuse de conclure au lieu de deviner" \
   "echo \"\$OUTC\" | grep -q 'prefixe .zz. non resolu'"
git rm -rq products && git commit -qm "fixture: retire le second backlog"

echo "G2 — working tree sale :"
echo scratch > untracked.txt
OUT2="$(bash "$CHECK" --gate --shipped 0042)"
ok "points contient 1"                       "echo \"\$OUT2\" | grep -q '^VERDICT: DIRTY points=1'"
ok "P1_TREE: DIRTY untracked=1"              "echo \"\$OUT2\" | grep -q '^P1_TREE: DIRTY modified=0 untracked=1'"
ok "le fichier est cité"                     "echo \"\$OUT2\" | grep -q '\[P1\] worktree ?? untracked.txt'"
rm untracked.txt

echo "G6 — le bruit regex du handoff a disparu :"
HF="$(bash "$HANDOFF_SH" where)"
mkdir -p "$(dirname "$HF")"
{ echo "# Handoff"; echo;
  for i in $(seq 1 100); do
    echo "- entrée $i : \`todo\` \`main\` \`run\` \`INIT_CWD\` \`RunProjection\` PR #$i"
  done; } > "$HF"
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
ok "le compteur dit « affichées/total » quand la liste est coupée (branch_real=X/40)" \
   "echo \"\$OUT8\" | grep -qE 'branch_real=[0-9]+/40 '"
ok "plus jamais le total nu à côté d'une liste tronquée" \
   "! echo \"\$OUT8\" | grep -q 'branch_real=40 '"
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
   "echo \"\$FULL\" | grep -q 'NON livré' && echo \"\$GATE_AFTER\" | grep -qE 'branch_real=([0-9]+/)?40 '"

echo "G7 — strictement read-only :"
BEFORE_STATUS="$(git status --porcelain | sort)"
BEFORE_BRANCHES="$(git branch --format='%(refname:short)' | sort)"
BEFORE_HANDOFF="$(mtime "$HF")"
bash "$CHECK" --gate --shipped 0042 >/dev/null
bash "$CHECK" --full --shipped 0042 >/dev/null
ok "working tree inchangé"   "[ \"\$BEFORE_STATUS\" = \"\$(git status --porcelain | sort)\" ]"
ok "branches inchangées"     "[ \"\$BEFORE_BRANCHES\" = \"\$(git branch --format='%(refname:short)' | sort)\" ]"
ok "mtime de handoff.md inchangé (le portier ne le touche pas)" \
   "[ \"\$BEFORE_HANDOFF\" = \"\$(mtime \"\$HF\")\" ]"
ok "la sonde mtime renvoie bien un entier (sinon l'assertion ci-dessus ne prouve rien)" \
   "echo \"\$BEFORE_HANDOFF\" | grep -qE '^[0-9]+\$'"
ok "aucun FETCH_HEAD créé (le portier ne fetch jamais)" "[ ! -f .git/FETCH_HEAD ]"

echo "G11 — durable=1 seulement si la note vit dans le dossier git commun :"
cd "$TMP/repo"
git worktree add -q "$TMP/repo-wt" -b g10 2>/dev/null
OUT10="$(cd "$TMP/repo-wt" && EZK_EPHEMERAL=0 bash "$CHECK" --gate)"
ok "depuis un worktree, note commune : durable=1"  "echo \"\$OUT10\" | grep -q '^HANDOFF: .* durable=1\$'"
FULL10="$(cd "$TMP/repo-wt" && EZK_EPHEMERAL=0 bash "$CHECK" --full)"
ok "--full dit que la note survit au worktree"     "echo \"\$FULL10\" | grep -q 'dossier git commun : elle survit'"
mkdir -p "$TMP/repo-wt/.claude" && printf '# H\n\n## 2026-09-21 — ancienne\n\n- x\n' > "$TMP/repo-wt/.claude/handoff.md"
FULL10B="$(cd "$TMP/repo-wt" && bash "$CHECK" --full)"     # capturé d'abord : `| grep -q` SIGPIPE-rait sous pipefail
ok "--full signale une ancienne note à reprendre" "echo \"\$FULL10B\" | grep -q 'ancienne note reste dans ce worktree'"
# Un handoff.sh qui rangerait la note dans le worktree : le portier doit refuser durable=1.
mkdir -p "$TMP/stub" && cp "$CHECK" "$TMP/stub/check.sh"
cp "$(dirname "$CHECK")/lib-worktree-safety.sh" "$TMP/stub/"   # check.sh source sa lib voisine (fiche 20261003011750521)
printf '#!/usr/bin/env bash\necho "$(git rev-parse --show-toplevel)/.claude/handoff.md"\n' > "$TMP/stub/handoff.sh"
OUT10B="$(cd "$TMP/repo-wt" && EZK_EPHEMERAL=0 bash "$TMP/stub/check.sh" --gate)"
ok "note rangée dans le worktree : durable=0"      "echo \"\$OUT10B\" | grep -q '^HANDOFF: .* durable=0\$'"
git worktree remove --force "$TMP/repo-wt"

echo "G9 — clôture : main local en retard, squash déjà sur origin/main :"
cd "$TMP" && git init -q --bare -b main origin8.git
git init -q -b main repo8 && cd repo8
git config user.email test@test && git config user.name test && git config commit.gpgsign false
git remote add origin "$TMP/origin8.git"
echo base > a.txt && git add . && git commit -qm base && git push -q origin main
git checkout -q -b feat/late main && echo "livré ailleurs" > late.txt && git add late.txt && git commit -qm late
git checkout -q -b feat/reelle main && echo "jamais livré" > reelle.txt && git add reelle.txt && git commit -qm reelle
git checkout -q main
# Une autre session squash-merge feat/late sur origin ; ici, on fetch sans avancer le main local.
cd "$TMP" && git clone -q --branch main origin8.git other8 && cd other8
git config user.email test@test && git config user.name test && git config commit.gpgsign false
echo "livré ailleurs" > late.txt && git add late.txt && git commit -qm "squash late" && git push -q origin main
cd "$TMP/repo8" && git fetch -q origin
OUT8="$(bash "$CHECK" --gate)"
ok "le main local est bien en retard (la fixture prouve quelque chose)" \
   "[ \"\$(git rev-list --count main..origin/main)\" = 1 ]"
ok "la branche squashée sur origin/main est absorbée" "echo \"\$OUT8\" | grep -qE 'P2_PENDING: .* branch_real=1 branch_absorbed=1 '"
ok "elle n'est pas classée réelle"                    "! echo \"\$OUT8\" | grep -q 'branch REAL feat/late '"
ok "la branche jamais fusionnée reste réelle"         "echo \"\$OUT8\" | grep -q 'branch REAL feat/reelle '"
cd "$TMP/repo"

echo "G3 — option inconnue et hors dépôt :"
ok "option inconnue ⇒ exit 2"    "! bash \"\$CHECK\" --nawak >/dev/null 2>&1"
ok "hors dépôt git ⇒ exit 2"     "( cd \"\$TMP\" && ! bash \"\$CHECK\" >/dev/null 2>&1 )"
ok "--help n'exécute rien"       "bash \"\$CHECK\" --help | grep -q 'portier de clôture'"

echo
if [ "$FAIL" = 0 ]; then echo "test-check-gate: TOUT VERT"; else echo "test-check-gate: ÉCHECS"; exit 1; fi
