#!/usr/bin/env bash
# test-refresh-worktrees.sh — DoD du prédicat de sûreté D4 (merge-local-first, ADR-0052).
#
# En clair : un worktree ne se fait jamais bouger tout seul sauf preuve qu'il est PROPRE
# ET fast-forwardable. Sale ou divergent → on SIGNALE, on ne touche à rien (ADR-0042).
#
# Contrainte git : une branche ne peut être "checked out" que dans UN SEUL worktree à la
# fois — donc chaque cas (propre, sale, divergent) est monté dans son PROPRE dépôt jetable
# avec son PROPRE remote bare, plutôt que d'empiler plusieurs worktrees sur `main` dans un
# même dépôt (impossible). C'est aussi le cas réaliste : "quelqu'un d'autre a poussé sur
# origin/main pendant que ce clone tournait".
#
# Fixtures 100% jetables sous $TMPDIR — jamais le vrai repo vectorz.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/refresh-worktrees.sh"
FAIL=0

fail() { echo "  ✗ $1"; FAIL=1; }
ok()   { echo "  ✓ $1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null

# --- Fabrique de fixture -------------------------------------------------------
# $1 = nom du cas → crée $WORK/<nom>/{origin.git, clone} avec `main` en retard d'un
# commit sur origin/main (poussé par un "autre clone", comme un squash GitHub réel).
new_case() {
  local name="$1"
  local case_dir="$WORK/$name"
  mkdir -p "$case_dir"
  git init -q --bare -b main "$case_dir/origin.git"

  git clone -q "$case_dir/origin.git" "$case_dir/seed" 2>/dev/null
  git -C "$case_dir/seed" config user.email t@t.io
  git -C "$case_dir/seed" config user.name t
  echo v1 > "$case_dir/seed/f.txt"
  git -C "$case_dir/seed" add f.txt
  git -C "$case_dir/seed" commit -qm "chore: v1"
  git -C "$case_dir/seed" push -q origin main

  git clone -q "$case_dir/origin.git" "$case_dir/clone" 2>/dev/null
  git -C "$case_dir/clone" config user.email t@t.io
  git -C "$case_dir/clone" config user.name t

  # "quelqu'un d'autre" pousse un squash de plus sur origin/main pendant ce temps.
  echo v2 > "$case_dir/seed/f.txt"
  git -C "$case_dir/seed" add f.txt
  git -C "$case_dir/seed" commit -qm "chore: v2 (squash GitHub simulé)"
  git -C "$case_dir/seed" push -q origin main
}

echo "=== Cas 1 — clone propre + en retard : fast-forward attendu ==="
new_case case1
CLONE="$WORK/case1/clone"
# Un worktree annexe sur une AUTRE branche, dans le MÊME dépôt : doit rester hors-scope.
git -C "$CLONE" worktree add -q "$WORK/case1/wt-feature" -b feature/hors-scope main >/dev/null 2>&1

OUT="$(bash "$SCRIPT" --repo "$CLONE" --base main)"
echo "$OUT"

ORIGIN_MAIN="$(git -C "$CLONE" rev-parse origin/main 2>/dev/null || git -C "$WORK/case1/origin.git" rev-parse main)"
grep -qE '^FF .*/case1/clone ' <<<"$OUT" && ok "clone signalé FF" || fail "clone pas fast-forwardé"
CLONE_HEAD="$(git -C "$CLONE" rev-parse HEAD)"
[[ "$CLONE_HEAD" == "$ORIGIN_MAIN" ]] && ok "clone à la nouvelle tête de origin/main" || fail "clone pas à jour ($CLONE_HEAD != $ORIGIN_MAIN)"
grep -q "wt-feature" <<<"$OUT" && fail "le worktree hors-scope (autre branche) a été mentionné" || ok "worktree sur une autre branche laissé hors-scope"

echo "=== Cas 2 — clone sale : jamais touché ==="
new_case case2
CLONE2="$WORK/case2/clone"
echo dirty >> "$CLONE2/f.txt"
DIRTY_HEAD_BEFORE="$(git -C "$CLONE2" rev-parse HEAD)"
OUT2="$(bash "$SCRIPT" --repo "$CLONE2" --base main)"
echo "$OUT2"
grep -qE '^SIGNAL .*/case2/clone dirty$' <<<"$OUT2" && ok "clone sale signalé" || fail "signal dirty absent"
[[ "$(git -C "$CLONE2" rev-parse HEAD)" == "$DIRTY_HEAD_BEFORE" ]] && ok "HEAD inchangé (sale, jamais déplacé)" || fail "HEAD a bougé alors que le clone était sale"
[[ -n "$(git -C "$CLONE2" status --porcelain)" ]] && ok "toujours sale (rien nettoyé)" || fail "le script a nettoyé le worktree — écriture non désirée"

echo "=== Cas 3 — clone divergent (commit local non poussé) : signal, pas de ff ==="
new_case case3
CLONE3="$WORK/case3/clone"
git -C "$CLONE3" fetch -q origin
echo local > "$CLONE3/only-here.txt"
git -C "$CLONE3" add only-here.txt
git -C "$CLONE3" commit -qm "chore: commit local jamais poussé"
DIVERGED_HEAD_BEFORE="$(git -C "$CLONE3" rev-parse HEAD)"
OUT3="$(bash "$SCRIPT" --repo "$CLONE3" --base main)"
echo "$OUT3"
grep -qE '^SIGNAL .*/case3/clone diverged$' <<<"$OUT3" && ok "clone divergent signalé" || fail "signal diverged absent"
[[ "$(git -C "$CLONE3" rev-parse HEAD)" == "$DIVERGED_HEAD_BEFORE" ]] && ok "HEAD inchangé (divergent, jamais déplacé)" || fail "HEAD a bougé alors que le clone divergeait"
[[ -f "$CLONE3/only-here.txt" ]] && ok "commit local toujours présent" || fail "commit local perdu"

echo "=== Cas 4 — sans remote : silence, aucune écriture ==="
NOREMOTE="$WORK/case4-noremote"
git init -q -b main "$NOREMOTE"
git -C "$NOREMOTE" config user.email t@t.io
git -C "$NOREMOTE" config user.name t
echo v1 > "$NOREMOTE/f.txt"
git -C "$NOREMOTE" add f.txt
git -C "$NOREMOTE" commit -qm "chore: v1"
HEAD_BEFORE="$(git -C "$NOREMOTE" rev-parse HEAD)"
OUT4="$(bash "$SCRIPT" --repo "$NOREMOTE" --base main)"
[[ -z "$OUT4" ]] && ok "aucune sortie sans remote (déjà à jour, rien à faire)" || fail "sortie inattendue sans remote: $OUT4"
[[ "$(git -C "$NOREMOTE" rev-parse HEAD)" == "$HEAD_BEFORE" ]] && ok "HEAD inchangé" || fail "HEAD a bougé sans remote"

if (( FAIL )); then
  echo "❌ test-refresh-worktrees — ÉCHEC"
  exit 1
fi
echo "✅ test-refresh-worktrees — TOUT VERT"
