#!/usr/bin/env bash
# test-reconcile-worktree.sh — DoD de la réconciliation worktree→main après un ship local
# (fiche 20261010114132970). Trois critères :
#   1. worktree propre + absorbé par le squash → avancé sur main (même état que main) ;
#   2. worktree avec du propre non absorbé → verdict « N de retard » + remède, rien touché ;
#   3. un champ écrit par un script sur main (split_from) survit : le principal n'est jamais
#      écrasé par une copie du worktree.
# Fixtures 100% jetables sous $TMPDIR — jamais le vrai repo. Les worktrees sont VOISINS du
# principal (pas dedans), pour qu'aucun `git add` du principal ne les voie.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/reconcile-worktree.sh"
FAIL=0
fail() { echo "  ✗ $1"; FAIL=1; }
ok()   { echo "  ✓ $1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null

# Un principal avec `main`, une fiche portant un champ écrit par un script (split_from).
new_principal() {
  local dir="$1"
  git init -q -b main "$dir"
  git -C "$dir" config user.email t@t.io
  git -C "$dir" config user.name t
  echo v1 > "$dir/f.txt"
  printf 'id: F\nsplit_from: SRC\n' > "$dir/fiche.md"
  git -C "$dir" add -A
  git -C "$dir" commit -qm "chore: v1 + fiche split_from"
}

echo "reconcile-worktree.sh"

# --- Cas 1 : propre + absorbé → RECONCILED, worktree = main --------------------
C1="$WORK/c1"; WT1="$WORK/c1wt"; new_principal "$C1"
git -C "$C1" worktree add -q -b featX "$WT1" main
echo v2 > "$WT1/f.txt"; git -C "$WT1" add -A; git -C "$WT1" commit -qm "feat: v2"
# ship local : squash de featX sur main, côté principal
git -C "$C1" merge --squash featX >/dev/null; git -C "$C1" commit -qm "feat: v2 (squash)"
out="$("$SCRIPT" --repo "$WT1" --base main)"
[[ "$out" == RECONCILED* ]] && ok "absorbé : RECONCILED ($out)" || fail "absorbé attendait RECONCILED, reçu : $out"
[[ "$(git -C "$WT1" rev-parse HEAD)" == "$(git -C "$C1" rev-parse main)" ]] \
  && ok "worktree aligné sur main (même verdict de gate que main)" || fail "worktree pas aligné sur main"
[[ "$(cat "$WT1/f.txt")" == v2 ]] && ok "contenu = main (v2)" || fail "contenu worktree != main"

# --- Cas 2 : du propre non absorbé → BEHIND, rien touché -----------------------
C2="$WORK/c2"; WT2="$WORK/c2wt"; new_principal "$C2"
git -C "$C2" worktree add -q -b featY "$WT2" main
echo keep > "$WT2/g.txt"; git -C "$WT2" add -A; git -C "$WT2" commit -qm "feat: g (propre)"
head_before="$(git -C "$WT2" rev-parse HEAD)"
# main avance de son côté (autre livraison), sans g.txt
echo v2 > "$C2/f.txt"; git -C "$C2" add f.txt; git -C "$C2" commit -qm "chore: main v2"
out="$("$SCRIPT" --repo "$WT2" --base main)"
[[ "$out" == BEHIND* ]] && ok "propre non absorbé : BEHIND ($out)" || fail "attendait BEHIND, reçu : $out"
grep -q 'behind=1' <<<"$out" && ok "le verdict dit le nombre de commits de retard" || fail "verdict sans le compte de retard : $out"
grep -q 'lance :' <<<"$out" && ok "le verdict dit quoi lancer" || fail "verdict sans remède : $out"
[[ "$(git -C "$WT2" rev-parse HEAD)" == "$head_before" ]] \
  && ok "worktree non touché (commit propre préservé)" || fail "worktree déplacé alors qu'il a du propre"
[[ -f "$WT2/g.txt" ]] && ok "fichier propre g.txt préservé" || fail "g.txt perdu"

# --- Cas 3 : champ écrit par un script (split_from) survit, principal intact ----
C3="$WORK/c3"; WT3="$WORK/c3wt"; new_principal "$C3"
git -C "$C3" worktree add -q -b featZ "$WT3" main
echo v2 > "$WT3/f.txt"; git -C "$WT3" add -A; git -C "$WT3" commit -qm "feat: v2"
git -C "$C3" merge --squash featZ >/dev/null; git -C "$C3" commit -qm "feat: v2 (squash)"
principal_fiche_before="$(cat "$C3/fiche.md")"
"$SCRIPT" --repo "$WT3" --base main >/dev/null
grep -q 'split_from: SRC' "$WT3/fiche.md" \
  && ok "split_from présent dans le worktree après réconciliation" || fail "split_from perdu dans le worktree"
[[ "$(cat "$C3/fiche.md")" == "$principal_fiche_before" ]] \
  && ok "fiche du principal inchangée (jamais écrasée par le worktree)" || fail "fiche du principal modifiée par le geste"

# --- Cas 4 : absorbé mais SALE → DIRTY, rien touché ----------------------------
C4="$WORK/c4"; WT4="$WORK/c4wt"; new_principal "$C4"
git -C "$C4" worktree add -q -b featD "$WT4" main
echo v2 > "$WT4/f.txt"; git -C "$WT4" add -A; git -C "$WT4" commit -qm "feat: v2"
git -C "$C4" merge --squash featD >/dev/null; git -C "$C4" commit -qm "feat: v2 (squash)"
echo "modif non validée" > "$WT4/sale.txt"   # salit le worktree
head_before="$(git -C "$WT4" rev-parse HEAD)"
out="$("$SCRIPT" --repo "$WT4" --base main)"
[[ "$out" == DIRTY* ]] && ok "sale : DIRTY ($out)" || fail "attendait DIRTY, reçu : $out"
[[ "$(git -C "$WT4" rev-parse HEAD)" == "$head_before" ]] && ok "worktree sale non touché" || fail "worktree sale déplacé (risque de perte)"

# --- Cas 5 : déjà sur main → UPTODATE ------------------------------------------
C5="$WORK/c5"; WT5="$WORK/c5wt"; new_principal "$C5"
git -C "$C5" worktree add -q -b featU "$WT5" main   # featU = main, aucun commit
out="$("$SCRIPT" --repo "$WT5" --base main)"
[[ "$out" == UPTODATE* ]] && ok "déjà à jour : UPTODATE ($out)" || fail "attendait UPTODATE, reçu : $out"

# --- Cas 6 : en avance (rien shippé) → AHEAD, pas « BEHIND behind=0 » -----------
C6="$WORK/c6"; WT6="$WORK/c6wt"; new_principal "$C6"
git -C "$C6" worktree add -q -b featA "$WT6" main
echo wip > "$WT6/wip.txt"; git -C "$WT6" add -A; git -C "$WT6" commit -qm "feat: wip (non livré)"
head_before="$(git -C "$WT6" rev-parse HEAD)"
out="$("$SCRIPT" --repo "$WT6" --base main)"
[[ "$out" == AHEAD* ]] && ok "en avance : AHEAD ($out)" || fail "attendait AHEAD (pas BEHIND behind=0), reçu : $out"
[[ "$(git -C "$WT6" rev-parse HEAD)" == "$head_before" ]] && ok "worktree en avance non touché" || fail "worktree en avance déplacé"

if [[ "$FAIL" == 0 ]]; then echo "  → OK"; exit 0; else echo "  → ÉCHEC"; exit 1; fi
