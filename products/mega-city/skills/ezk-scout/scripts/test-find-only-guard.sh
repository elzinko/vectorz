#!/usr/bin/env bash
# DoD exécutable de find-only-guard.sh (fiche 20260910165637000) — fixtures jetables.
# Invariant testé : une passe ezk-scout NE MODIFIE RIEN du dépôt cible. La garde compare
# HEAD + arbre + refs locales + état du worktree (suivi ET non suivi) AVANT/APRÈS.
# Cas : (a) rien ne bouge → OK · (b) fichier suivi modifié · (c) fichier non suivi ajouté ·
# (d) COMMIT sans toucher le worktree (le piège : `git status` paraît propre) · (e) commit
# sur une autre branche puis retour · (f) carte créée dans features/ · (g) fichier IGNORÉ
# écrit → toléré (état applicatif, pas du code produit) · (h) WIP préexistant inchangé OK,
# puis re-modifié → violé · (i) deux dépôts surveillés · (j) erreurs d'usage.
set -uo pipefail

# Hermétique : aucune config git de la machine (cf. test-scripts.sh).
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null

GUARD="$(cd "$(dirname "$0")" && pwd)/find-only-guard.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

check() { # $1=label $2=cmd-ok(0)/ko(1)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

mkrepo() { # $1=dir — dépôt jetable avec un commit, un .gitignore et un dossier features/
  mkdir -p "$1/features"
  git -C "$1" init -q
  git -C "$1" config user.email t@t
  git -C "$1" config user.name t
  git -C "$1" config commit.gpgsign false
  printf 'code\n' > "$1/app.js"
  printf 'secret-state/\n*.log\n' > "$1/.gitignore"
  printf 'fiche\n' > "$1/features/0001_x.md"
  git -C "$1" add -A
  git -C "$1" commit -q -m init
}

# Lance snapshot → (action) → verify. Positionne $out et $rc (sortie et code de verify).
run_case() { # $1=repo $2=action (commande shell exécutée entre snapshot et verify)
  bash "$GUARD" snapshot "$1" > "$TMP/snap" 2>/dev/null
  eval "$2"
  out="$(bash "$GUARD" verify "$TMP/snap" 2>&1)"; rc=$?
}

R="$TMP/repo"; mkrepo "$R"

echo "Cas a (rien ne bouge) :"
run_case "$R" ':'
check "code de sortie 0"                  "[ $rc -eq 0 ]"
check "ligne « find-only : OK »"          "printf '%s' \"\$out\" | grep -q '^find-only : OK'"

echo "Cas b (fichier suivi modifié) :"
run_case "$R" "printf 'x\n' >> '$R/app.js'"
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "ligne « find-only : VIOLÉ »"       "printf '%s' \"\$out\" | grep -q '^find-only : VIOLÉ'"
check "nomme le fichier modifié"          "printf '%s' \"\$out\" | grep -qF 'app.js modifié'"
git -C "$R" checkout -q -- app.js

echo "Cas c (fichier non suivi ajouté) :"
run_case "$R" "printf 'y\n' > '$R/nouveau.js'"
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "nomme le fichier ajouté"           "printf '%s' \"\$out\" | grep -qF 'nouveau.js ajouté'"
rm -f "$R/nouveau.js"

echo "Cas d (COMMIT sans toucher le worktree — le piège du simple git status) :"
run_case "$R" "git -C '$R' commit -q --allow-empty -m 'fix: correctif sournois'"
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "signale HEAD changé"               "printf '%s' \"\$out\" | grep -q 'head'"
git -C "$R" reset -q --hard HEAD~1

echo "Cas e (commit sur une autre branche, retour sur la branche d'origine) :"
base="$(git -C "$R" symbolic-ref --short HEAD)"
run_case "$R" "git -C '$R' checkout -q -b autre && git -C '$R' commit -q --allow-empty -m 'wip' && git -C '$R' checkout -q '$base'"
check "code de sortie 1 (refs changées)"  "[ $rc -eq 1 ]"
check "signale les refs"                  "printf '%s' \"\$out\" | grep -q 'refs'"
git -C "$R" branch -q -D autre

echo "Cas f (carte créée dans features/) :"
run_case "$R" "printf 'nouvelle carte\n' > '$R/features/0002_bug.md'"
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "nomme la carte"                    "printf '%s' \"\$out\" | grep -qF 'features/0002_bug.md'"
rm -f "$R/features/0002_bug.md"

echo "Cas g (fichier IGNORÉ écrit : état applicatif toléré) :"
run_case "$R" "mkdir -p '$R/secret-state' && printf 's\n' > '$R/secret-state/db' && printf 'l\n' > '$R/run.log'"
check "code de sortie 0"                  "[ $rc -eq 0 ]"

echo "Cas h (WIP préexistant : inchangé = OK, re-modifié = violé) :"
printf 'wip\n' >> "$R/app.js"
run_case "$R" ':'
check "WIP inchangé → code 0"             "[ $rc -eq 0 ]"
run_case "$R" "printf 'encore\n' >> '$R/app.js'"
check "WIP re-modifié → code 1"           "[ $rc -eq 1 ]"
git -C "$R" checkout -q -- app.js

echo "Cas h2 (index remplacé alors que statut et worktree restent identiques — retour Codex) :"
printf 'wip\n' >> "$R/app.js"; git -C "$R" add app.js; printf 'wip2\n' >> "$R/app.js"   # fichier « MM »
run_case "$R" "b=\$(printf 'autre contenu stagé\n' | git -C '$R' hash-object -w --stdin) && git -C '$R' update-index --cacheinfo 100644,\$b,app.js"
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "signale l'index"                   "printf '%s' \"\$out\" | grep -q 'index'"
git -C "$R" reset -q --hard HEAD

echo "Cas h3 (autre branche au MÊME commit — retour Codex) :"
git -C "$R" branch copie
base="$(git -C "$R" symbolic-ref --short HEAD)"
run_case "$R" "git -C '$R' checkout -q copie"
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "signale la branche courante"      "printf '%s' \"\$out\" | grep -q 'branche courante'"
git -C "$R" checkout -q "$base"; git -C "$R" branch -q -D copie

echo "Cas i (deux dépôts surveillés : cible + backlog) :"
R2="$TMP/backlog"; mkrepo "$R2"
bash "$GUARD" snapshot "$R" "$R2" > "$TMP/snap" 2>/dev/null
printf 'carte\n' > "$R2/features/0003_c.md"
out="$(bash "$GUARD" verify "$TMP/snap" 2>&1)"; rc=$?
check "code de sortie 1"                  "[ $rc -eq 1 ]"
check "nomme le second dépôt"             "printf '%s' \"\$out\" | grep -qF 'backlog'"
rm -f "$R2/features/0003_c.md"
out="$(bash "$GUARD" verify "$TMP/snap" 2>&1)"; rc=$?
check "retour à l'état initial → code 0"  "[ $rc -eq 0 ]"
check "le résumé compte 2 dépôts"         "printf '%s' \"\$out\" | grep -q '2 dépôts'"

echo "Cas j (erreurs d'usage) :"
mkdir -p "$TMP/plain"
bash "$GUARD" snapshot "$TMP/plain" >/dev/null 2>"$TMP/e1"; rc1=$?
check "dossier non-git → code 2"          "[ $rc1 -eq 2 ]"
check "message explicite"                 "grep -q 'pas un dépôt git' '$TMP/e1'"
bash "$GUARD" snapshot >/dev/null 2>&1; rc2=$?
check "snapshot sans dépôt → code 2"      "[ $rc2 -eq 2 ]"
bash "$GUARD" verify "$TMP/n-existe-pas" >/dev/null 2>&1; rc3=$?
check "verify sur instantané absent → 2"  "[ $rc3 -eq 2 ]"
bash "$GUARD" bidule >/dev/null 2>&1; rc4=$?
check "sous-commande inconnue → code 2"   "[ $rc4 -eq 2 ]"

echo
if [ "$FAIL" -eq 0 ]; then echo "find-only-guard : tous les cas passent."; else echo "find-only-guard : ÉCHEC."; fi
exit "$FAIL"
