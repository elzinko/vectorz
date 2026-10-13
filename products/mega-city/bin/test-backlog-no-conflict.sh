#!/usr/bin/env bash
# test-backlog-no-conflict.sh — DoD de « BACKLOG.md sort de git » (fiche 20261002231845120,
# ADR-0075). Deux volets :
#   A. Fixture : deux branches ajoutent chacune une fiche ; BACKLOG.md gitignored → merge sans
#      conflit. Contraste : BACKLOG.md FORCÉ dans git (contenu différent par branche) → conflit,
#      ce qui prouve que c'est bien lui la source.
#   B. Garde du dépôt réel : features/BACKLOG.md n'est pas suivi par git et est bien ignoré.
# Fixtures 100% jetables sous $TMPDIR.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$HERE/../../.." && git rev-parse --show-toplevel)"
FAIL=0
fail() { echo "  ✗ $1"; FAIL=1; }
ok()   { echo "  ✓ $1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_SYSTEM=/dev/null

echo "backlog-no-conflict (ADR-0075)"

# --- Volet A : fixture deux branches -------------------------------------------
setup() {
  local dir="$1" ignore_backlog="$2"
  git init -q -b main "$dir"
  git -C "$dir" config user.email t@t.io
  git -C "$dir" config user.name t
  mkdir -p "$dir/features"
  printf 'id: BASE\n' > "$dir/features/BASE.md"
  [[ "$ignore_backlog" == 1 ]] && echo 'features/BACKLOG.md' > "$dir/.gitignore"
  git -C "$dir" add -A
  git -C "$dir" commit -qm "base"
}

# Simule un « add + regen » sur une branche : nouvelle fiche + BACKLOG.md réécrit.
add_fiche_and_regen() {
  local dir="$1" br="$2" id="$3" force="${4:-0}"
  git -C "$dir" checkout -q -b "$br" main
  printf 'id: %s\n' "$id" > "$dir/features/${id}.md"
  printf '# Backlog\n- %s\n' "$id" > "$dir/features/BACKLOG.md"   # regen local, contenu propre à la branche
  git -C "$dir" add features/"${id}.md"
  [[ "$force" == 1 ]] && git -C "$dir" add -f features/BACKLOG.md
  git -C "$dir" commit -qm "add ${id}"
}

# Cas gitignored : pas de conflit
A="$WORK/ignored"; setup "$A" 1
add_fiche_and_regen "$A" brA 0001 0
add_fiche_and_regen "$A" brB 0002 0
git -C "$A" checkout -q main
git -C "$A" merge -q --no-edit brA
if git -C "$A" merge --no-edit brB >/dev/null 2>&1; then ok "gitignored : deux branches fusionnent sans conflit"; else fail "gitignored : conflit inattendu au merge"; git -C "$A" merge --abort 2>/dev/null || true; fi
[[ -z "$(git -C "$A" ls-files features/BACKLOG.md)" ]] && ok "BACKLOG.md jamais suivi (fixture)" || fail "BACKLOG.md suivi dans la fixture"

# Cas forcé dans git (l'ancien monde) : conflit → prouve que BACKLOG.md EST la source
B="$WORK/tracked"; setup "$B" 0
add_fiche_and_regen "$B" brA 0001 1
add_fiche_and_regen "$B" brB 0002 1
git -C "$B" checkout -q main
git -C "$B" merge -q --no-edit brA
if git -C "$B" merge --no-edit brB >/dev/null 2>&1; then fail "tracked : aucun conflit alors qu'il était attendu (contraste cassé)"; else ok "tracked : conflit sur BACKLOG.md comme attendu (c'est bien la source)"; git -C "$B" merge --abort 2>/dev/null || true; fi

# --- Volet B : garde du dépôt réel ---------------------------------------------
[[ -z "$(git -C "$REPO_ROOT" ls-files features/BACKLOG.md)" ]] \
  && ok "dépôt réel : features/BACKLOG.md n'est plus suivi par git" || fail "dépôt réel : features/BACKLOG.md encore suivi"
if git -C "$REPO_ROOT" check-ignore -q features/BACKLOG.md; then ok "dépôt réel : features/BACKLOG.md est gitignored" ; else fail "dépôt réel : features/BACKLOG.md pas ignoré"; fi

if [[ "$FAIL" == 0 ]]; then echo "  → OK"; exit 0; else echo "  → ÉCHEC"; exit 1; fi
