#!/usr/bin/env bash
# DoD exécutable de la fiche 20260904091853948 (absorbe 20260902224043892) — le ménage de fin de session.
#
# `check.sh --cleanup` LISTE ce qui se range sans risque, avec la commande exacte de chaque geste.
# Il ne supprime RIEN : le PO valide, puis on lance. Ce que ces cas verrouillent :
#   K1  seuls les worktrees propres, déverrouillés, inactifs, différents du courant, dont le
#       contenu est déjà dans la base, sont rangés comme sûrs ;
#   K2  tout le reste est GARDÉ, et le dit par raison (courant, verrou, récent, sale, non mergé) ;
#   K3  une branche absorbée ou mergée, tenue par aucun worktree, est sûre ; tenue par un
#       worktree sûr, elle l'est APRÈS le retrait de celui-ci ; une branche réelle ne l'est jamais ;
#   K4  le portier reste strictement read-only (ni worktree, ni branche, ni fichier touché) ;
#   K5  la liste coupée par son plafond le dit (« X/Y »), jamais le total nu.
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

cd "$TMP" && git init -q -b main repo && cd repo
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo base > a.txt && git add . && git commit -qm base

# Une branche dont le contenu a atterri sur main par un commit DISTINCT (le résidu d'un squash-merge).
absorbed_branch() { # $1=nom
  git checkout -q -b "$1" main
  echo "contenu $1" > "$1.txt" && git add "$1.txt" && git commit -qm "$1"
  git checkout -q main
  echo "contenu $1" > "$1.txt" && git add "$1.txt" && git commit -qm "squash $1"
}
# Antidate l'activité git d'un worktree (HEAD, index, reflog) : c'est ce que lit le ménage.
age() { # $1=dossier du worktree
  local gd
  gd="$(git -C "$1" rev-parse --absolute-git-dir)"
  find "$gd" -type f -exec touch -t 202601010000 {} +
}

# ── le décor ────────────────────────────────────────────────────────────────────
absorbed_branch done-wt            # tenue par un worktree sûr
absorbed_branch done-free          # tenue par personne
absorbed_branch recent-br          # tenue par un worktree ACTIF (sert au test de seuil)
git checkout -q -b merged-ff main && git checkout -q main      # mergée « normalement » (pointe sur main)
git checkout -q -b reelle main && echo "pas livré" > reelle.txt && git add reelle.txt && git commit -qm "réel" && git checkout -q main

# wt-detached = la COPIE DE RÉSERVE de l'app (cas muti 2026-10-03) : propre, détachée sur un commit
# déjà dans la base, inactive → jamais proposée au retrait, comptée `reserve` (fiche 20261003011750521).
git worktree add -q --detach "$TMP/wt-detached" main                 # réserve : propre, détachée, absorbée
git worktree add -q "$TMP/wt-donebranch" done-wt                     # sûr : sa BRANCHE est absorbée → proposé
git worktree add -q --detach "$TMP/wt-dirty" main                    # gardé : sale
git worktree add -q --detach "$TMP/wt-locked" main                   # gardé : verrouillé
git worktree add -q "$TMP/wt-reelle" reelle                          # gardé : contenu non livré
git worktree add -q "$TMP/wt-recent" recent-br                       # gardé : actif à l'instant (sur branche)
git worktree add -q --detach "$TMP/wt-gone" main                     # orphelin : dossier supprimé
echo "en cours" > "$TMP/wt-dirty/travail.txt"
git worktree lock "$TMP/wt-locked"
rm -rf "$TMP/wt-gone"
for w in wt-detached wt-donebranch wt-dirty wt-locked wt-reelle; do age "$TMP/$w"; done

BEFORE_WT="$(git worktree list | wc -l | tr -d ' ')"
BEFORE_BR="$(git branch --format='%(refname:short)' | sort | tr '\n' ' ')"
BEFORE_ST="$(git status --porcelain | wc -l | tr -d ' ')"

OUT="$(EZK_CLEANUP_IDLE_HOURS=24 bash "$CHECK" --cleanup)"

echo "K1 — les worktrees sûrs, et eux seuls, sont proposés :"
ok "wt-donebranch (branche absorbée) est sûr" "echo \"\$OUT\" | grep -q '^WORKTREE_SAFE: .*wt-donebranch '"
ok "la commande exacte accompagne chaque ligne" \
   "echo \"\$OUT\" | grep -q 'wt-donebranch.* cmd=git worktree remove .*wt-donebranch\$'"
ok "exactement 1 worktree sûr (la réserve n'en est pas)" "[ \"\$(echo \"\$OUT\" | grep -c '^WORKTREE_SAFE:')\" = 1 ]"

echo "K1bis — la copie de RÉSERVE (détachée, propre, absorbée) n'est jamais proposée (cas muti 2026-10-03) :"
ok "wt-detached n'est pas dans les sûrs" "! echo \"\$OUT\" | grep -q 'WORKTREE_SAFE: .*wt-detached'"
ok "KEPT la compte comme réserve"        "echo \"\$OUT\" | grep -qE '^KEPT: .* reserve=1\$'"

echo "K2 — tout le reste est gardé, par raison :"
ok "sale : jamais proposé"                 "! echo \"\$OUT\" | grep -q 'WORKTREE_SAFE: .*wt-dirty'"
ok "verrouillé : jamais proposé"           "! echo \"\$OUT\" | grep -q 'WORKTREE_SAFE: .*wt-locked'"
ok "contenu non livré : jamais proposé"    "! echo \"\$OUT\" | grep -q 'WORKTREE_SAFE: .*wt-reelle'"
ok "récent : jamais proposé"               "! echo \"\$OUT\" | grep -q 'WORKTREE_SAFE: .*wt-recent'"
ok "le courant (principal) n'est jamais proposé" "! echo \"\$OUT\" | grep -q 'WORKTREE_SAFE: .*/repo '"
ok "KEPT dit les raisons"                  "echo \"\$OUT\" | grep -qx 'KEPT: current=0 locked=1 recent=1 dirty=1 unmerged=1 prunable=1 reserve=1'"

echo "K3 — les branches :"
ok "branche absorbée libre : sûre, avec -D (le squash n'est pas un ancêtre)" \
   "echo \"\$OUT\" | grep -q '^BRANCH_SAFE: done-free proof=content:main cmd=git branch -D done-free\$'"
ok "branche mergée normalement : sûre, avec -d" \
   "echo \"\$OUT\" | grep -q '^BRANCH_SAFE: merged-ff cmd=git branch -d merged-ff\$'"
ok "branche tenue par un worktree sûr : après son retrait" \
   "echo \"\$OUT\" | grep -q '^BRANCH_AFTER_WORKTREE: done-wt after=.*wt-donebranch cmd=git branch -D done-wt\$'"
ok "branche réelle : jamais proposée"      "! echo \"\$OUT\" | grep -q 'reelle cmd='"
ok "main : jamais proposée"                "! echo \"\$OUT\" | grep -q 'BRANCH_[A-Z_]*: main '"

echo "K4 — strictement read-only :"
ok "aucun worktree retiré"                 "[ \"\$(git worktree list | wc -l | tr -d ' ')\" = \"\$BEFORE_WT\" ]"
ok "aucune branche supprimée"              "[ \"\$(git branch --format='%(refname:short)' | sort | tr '\n' ' ')\" = \"\$BEFORE_BR\" ]"
ok "l'arbre n'a pas bougé"                 "[ \"\$(git status --porcelain | wc -l | tr -d ' ')\" = \"\$BEFORE_ST\" ]"
ok "le worktree sale a gardé son fichier"  "[ -f \"\$TMP/wt-dirty/travail.txt\" ]"
ok "le bloc se termine proprement, exit 0" "echo \"\$OUT\" | tail -1 | grep -q -- '--- END ---' && EZK_CLEANUP_IDLE_HOURS=24 bash \"\$CHECK\" --cleanup >/dev/null"
ok "le compte final dit ce qui est sûr" \
   "echo \"\$OUT\" | grep -qx 'CLEANUP: worktrees_safe=1 branches_safe=2 branches_after_worktree=1'"

echo "K2bis — seuil par défaut (24 h) : un worktree actif à l'instant n'est jamais vieux :"
OUT2="$(bash "$CHECK" --cleanup)"
ok "sans seuil explicite, wt-recent reste gardé" "! echo \"\$OUT2\" | grep -q 'WORKTREE_SAFE: .*wt-recent'"
OUT3="$(EZK_CLEANUP_IDLE_HOURS=0 bash "$CHECK" --cleanup)"
ok "seuil 0 : le récent devient proposable (c'est le réglage qui décide)" "echo \"\$OUT3\" | grep -q '^WORKTREE_SAFE: .*wt-recent '"

echo "K-courant — depuis un worktree lié, le courant est gardé :"
OUT4="$(cd "$TMP/wt-detached" && EZK_CLEANUP_IDLE_HOURS=0 bash "$CHECK" --cleanup)"
ok "le worktree d'où l'on lance n'est jamais proposé" "! echo \"\$OUT4\" | grep -q 'WORKTREE_SAFE: .*wt-detached '"
ok "KEPT compte le courant"                       "echo \"\$OUT4\" | grep -q '^KEPT: current=1 '"

echo "K5 — plafond : la liste coupée le dit :"
for i in $(seq 1 45); do git branch -q "merged-$i" main; done
OUT5="$(EZK_CLEANUP_IDLE_HOURS=24 bash "$CHECK" --cleanup)"
SHOWN="$(echo "$OUT5" | grep -c '^BRANCH_SAFE:' || true)"
ok "moins de lignes que de branches"              "[ \"\$SHOWN\" -lt 47 ]"
ok "le compte final dit « affichées/total »"      "echo \"\$OUT5\" | grep -qE '^CLEANUP: .*branches_safe=[0-9]+/47 '"

echo "K6 — main local en retard : la preuve se fait contre origin/main, jamais main n'est proposée :"
# Branche par défaut EXPLICITE : sur un runner où `init.defaultBranch` vaut `master`, un clone d'un dépôt
# nu vide n'aurait pas de `main` (c'est ce que la CI a montré).
cd "$TMP" && git init -q --bare -b main origin6.git
git init -q -b main repo6 && cd repo6
git config user.email t@t && git config user.name t && git config commit.gpgsign false
git remote add origin "$TMP/origin6.git"
echo base > a.txt && git add . && git commit -qm base && git push -q origin main
git checkout -q -b late-squash main && echo "livré plus tard" > late.txt && git add late.txt && git commit -qm "late" && git checkout -q main
cd "$TMP" && git clone -q --branch main origin6.git other6 && cd other6
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo "livré plus tard" > late.txt && git add late.txt && git commit -qm "squash late" && git push -q origin main
cd "$TMP/repo6" && git fetch -q origin
OUT6="$(bash "$CHECK" --cleanup)"
ok "la base de preuve est origin/main"          "echo \"\$OUT6\" | grep -qx 'BASE: origin/main'"
ok "la branche livrée sur origin/main est sûre" "echo \"\$OUT6\" | grep -q '^BRANCH_SAFE: late-squash proof=content:origin/main cmd=git branch -D late-squash\$'"
ok "main n'est jamais proposée"                 "! echo \"\$OUT6\" | grep -qE '^BRANCH_[A-Z_]*: main '"

echo "K8 — depuis un worktree en retard, la commande proposée réussit : -D, avec sa preuve :"
# Une branche fusionnée (ancêtre) dans origin/main, mais pas dans le HEAD local : `git branch -d`
# la refuserait (« not fully merged »). Le ménage propose -D et cite la preuve contre origin/main.
cd "$TMP/repo6"
git checkout -q --no-track -b merged-late origin/main && echo "fusionnée sur origin" > ml.txt && git add ml.txt && git commit -qm ml
git push -q origin merged-late:main && git checkout -q main && git fetch -q origin
OUT8="$(bash "$CHECK" --cleanup)"
ok "la branche fusionnée sur origin/main est proposée en -D, preuve citée" \
   "echo \"\$OUT8\" | grep -q '^BRANCH_SAFE: merged-late proof=merged:origin/main cmd=git branch -D merged-late\$'"
ok "-d aurait échoué ici : la fixture reproduit le cas muti"   "! git branch -d merged-late >/dev/null 2>&1"
ok "la commande proposée réussit vraiment"                     "git branch -D merged-late >/dev/null"

echo "K7 — les commandes sont citées : un nom de branche hostile n'injecte rien :"
cd "$TMP" && git init -q -b main repo7 && cd repo7
git config user.email t@t && git config user.name t && git config commit.gpgsign false
echo base > a.txt && git add . && git commit -qm base
git branch 'evil;touch${IFS}pwn' main
OUT7="$(bash "$CHECK" --cleanup)"
# `printf %q` échappe chaque métacaractère : `;` devient `\;`, `$` devient `\$`, `{` devient `\{`.
EXPECT='cmd=git branch -d evil\;touch\$\{IFS\}pwn'
ok "la branche hostile est proposée, citée pour le shell" "echo \"\$OUT7\" | grep -qF -- \"\$EXPECT\""
ok "aucun « ; » nu dans une commande proposée"            "! echo \"\$OUT7\" | grep 'cmd=' | grep -qE 'cmd=[^;]*[^\\\\];touch'"

echo
if (( FAIL )); then echo "test-cleanup: ÉCHECS"; exit 1; fi
echo "test-cleanup: TOUT VERT"
