#!/usr/bin/env bash
# DoD exécutable de la fiche 0076 — classification des branches dans check.sh.
# Fixture jetable : un repo squash-merge où `git branch --no-merged` ment, et où la
# classification doit distinguer ABSORBÉES (contenu livré) et RÉELLES (vrai pending).
set -euo pipefail

CHECK="$(cd "$(dirname "$0")" && pwd)/check.sh"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0

ok() { # $1=label $2=cmd (0=ok)
  if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi
}

cd "$TMP"
git init -q -b main repo && cd repo
git config user.email test@test && git config user.name test
git config commit.gpgsign false

echo base > a.txt && echo doomed > d.txt && git add . && git commit -qm "base"

# Cas 1 — squash simple : feat/absorbee modifie a.txt, squash-mergée, branche conservée.
git switch -qc feat/absorbee
echo "change absorbé" >> a.txt && git commit -qam "feat: change absorbé"
git switch -q main && git merge --squash -q feat/absorbee >/dev/null && git commit -qm "feat: change absorbé (squash)"

# Cas 2 — squash PUIS évolution de main sur le même fichier (le cas « index régénéré ») :
# merge-tree conflicte, mais le blob de la branche a existé dans l'historique → ABSORBÉE.
git switch -qc feat/absorbee-evoluee
echo "change absorbé 2" >> a.txt && git commit -qam "feat: change absorbé 2"
git switch -q main && git merge --squash -q feat/absorbee-evoluee >/dev/null && git commit -qm "feat: change absorbé 2 (squash)"
echo "évolution ultérieure de main" >> a.txt && git commit -qam "chore: main évolue après le squash"

# Cas 3 — suppression squashée : feat/suppression supprime d.txt, squash-mergée.
git switch -qc feat/suppression
git rm -q d.txt && git commit -qm "chore: supprime d.txt"
git switch -q main && git merge --squash -q feat/suppression >/dev/null && git commit -qm "chore: supprime d.txt (squash)"

# Cas 4 — contenu RÉEL jamais livré : feat/reelle ajoute un fichier, jamais mergée.
git switch -qc feat/reelle
echo "travail jamais mergé" > reel.txt && git add reel.txt && git commit -qm "feat: travail jamais mergé"
git switch -q main

# Sanity de la fixture : les 4 branches sont bien « non-mergées » au sens naïf.
N_NAIVE="$(git branch --no-merged main | wc -l | tr -d ' ')"
ok "fixture : 4 branches no-merged au sens naïf (le mensonge est en place)" "[ \"$N_NAIVE\" = 4 ]"

OUT="$(bash "$CHECK" main)"

echo "Cas 1-3 (absorbées) :"
ok "feat/absorbee classée ABSORBÉE"          "echo \"\$OUT\" | grep -A6 'ABSORBÉES' | grep -q 'feat/absorbee '"
ok "feat/absorbee-evoluee classée ABSORBÉE (blob au squash malgré l'évolution de main)" \
                                             "echo \"\$OUT\" | grep -A6 'ABSORBÉES' | grep -q 'feat/absorbee-evoluee'"
ok "feat/suppression classée ABSORBÉE"       "echo \"\$OUT\" | grep -A6 'ABSORBÉES' | grep -q 'feat/suppression'"

echo "Cas 4 (réelle) :"
ok "feat/reelle signalée en vrai pending"    "echo \"\$OUT\" | grep -B1 -A3 'NON livré' | grep -q 'feat/reelle'"
ok "feat/reelle PAS dans les absorbées"      "! echo \"\$OUT\" | grep -A8 'ABSORBÉES' | grep -q 'feat/reelle'"
ok "le fichier non prouvé est cité (reel.txt)" "echo \"\$OUT\" | grep -q 'reel.txt'"

echo "Read-only :"
ok "le script n'a rien modifié (4 branches toujours là, working tree propre)" \
   "[ \"\$(git branch --no-merged main | wc -l | tr -d ' ')\" = 4 ] && [ -z \"\$(git status --porcelain)\" ]"

echo
if [ "$FAIL" = 0 ]; then echo "test-check-branches: TOUT VERT"; else echo "test-check-branches: ÉCHECS"; exit 1; fi
