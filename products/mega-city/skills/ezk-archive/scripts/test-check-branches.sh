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

# Cas 5 (finding Codex PR #31) — REVERT jamais mergé : le blob « base » existe dans le
# VIEil historique (avant la fourche) — sans borne de fenêtre, il serait « prouvé » à
# tort et la purge perdrait le revert.
git switch -qc feat/revert-reel
echo base > a.txt && git commit -qam "revert: a.txt revient à la version base"
git switch -q main

# Cas 6 (finding Codex PR #31) — blob RÉUTILISÉ du vieil historique : nouveau fichier
# dont le contenu duplique un contenu pré-fourche, jamais mergé.
git switch -qc feat/blob-reutilise
echo doomed > copie-vieux-contenu.txt && git add copie-vieux-contenu.txt && git commit -qm "feat: réutilise un vieux contenu"
git switch -q main

# Sanity de la fixture : les 6 branches sont bien « non-mergées » au sens naïf.
N_NAIVE="$(git branch --no-merged main | wc -l | tr -d ' ')"
ok "fixture : 6 branches no-merged au sens naïf (le mensonge est en place)" "[ \"$N_NAIVE\" = 6 ]"

# `--full` : depuis le portier (fiche 0088), le mode par défaut est `--gate` (bloc
# machine). Les assertions ci-dessous portent sur le rendu HUMAIN, inchangé.
OUT="$(bash "$CHECK" --full main)"
# ... et le gate doit dire la MÊME chose : une seule collecte, deux rendus. Cette
# assertion croisée est ce qui empêche les deux vues de diverger silencieusement.
GATE="$(bash "$CHECK" --gate main)"

echo "Cas 1-3 (absorbées) :"
ok "feat/absorbee classée ABSORBÉE"          "echo \"\$OUT\" | grep -A6 'ABSORBÉES' | grep -q 'feat/absorbee '"
ok "feat/absorbee-evoluee classée ABSORBÉE (blob au squash malgré l'évolution de main)" \
                                             "echo \"\$OUT\" | grep -A6 'ABSORBÉES' | grep -q 'feat/absorbee-evoluee'"
ok "feat/suppression classée ABSORBÉE"       "echo \"\$OUT\" | grep -A6 'ABSORBÉES' | grep -q 'feat/suppression'"

echo "Cas 4-6 (réelles — dont les adverses du finding Codex PR #31) :"
ok "feat/reelle signalée en vrai pending"    "echo \"\$OUT\" | grep -A8 'NON livré' | grep -q 'feat/reelle '"
ok "feat/reelle PAS dans les absorbées"      "! echo \"\$OUT\" | grep -A12 'ABSORBÉES' | grep -q 'feat/reelle '"
ok "le fichier non prouvé est cité (reel.txt)" "echo \"\$OUT\" | grep -q 'reel.txt'"
ok "feat/revert-reel signalée RÉELLE (blob pré-fourche ≠ preuve)" \
   "echo \"\$OUT\" | grep -A8 'NON livré' | grep -q 'feat/revert-reel'"
ok "feat/revert-reel PAS dans les absorbées" "! echo \"\$OUT\" | grep -A12 'ABSORBÉES' | grep -q 'feat/revert-reel'"
ok "feat/blob-reutilise signalée RÉELLE (contenu dupliqué du vieil historique)" \
   "echo \"\$OUT\" | grep -A8 'NON livré' | grep -q 'feat/blob-reutilise'"

echo "Cohérence gate ↔ full (une seule collecte, deux rendus) :"
ok "le gate compte 3 réelles et 3 absorbées"  "echo \"\$GATE\" | grep -q 'branch_real=3 branch_absorbed=3'"
ok "le gate cite les 3 réelles"               "for b in feat/reelle feat/revert-reel feat/blob-reutilise; do echo \"\$GATE\" | grep -q \"branch REAL \$b \" || exit 1; done"
ok "le gate ne classe aucune réelle en ABSORBED" "! echo \"\$GATE\" | grep 'branch ABSORBED' | grep -qE 'feat/(reelle|revert-reel|blob-reutilise)'"

echo "Read-only :"
ok "le script n'a rien modifié (6 branches toujours là, working tree propre)" \
   "[ \"\$(git branch --no-merged main | wc -l | tr -d ' ')\" = 6 ] && [ -z \"\$(git status --porcelain)\" ]"

echo
if [ "$FAIL" = 0 ]; then echo "test-check-branches: TOUT VERT"; else echo "test-check-branches: ÉCHECS"; exit 1; fi
