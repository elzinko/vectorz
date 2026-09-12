#!/usr/bin/env bash
# test-ship-merge.sh — DoD de merge-local-first (ADR-0052).
#
# En clair : GitHub exécute le squash, le local décide puis se réaligne. Ce test prouve
# les DEUX chemins (sans remote = squash local ; avec remote = commande `gh` construite,
# jamais appelée) et le refus du chemin fantôme (push d'un squash local puis fermeture de
# PR, qui fabrique une PR "closed unmerged").
#
# Fixtures 100% jetables sous $TMPDIR — jamais le vrai repo vectorz, jamais de `gh` réel.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/ship-merge.sh"
FAIL=0

fail() { echo "  ✗ $1"; FAIL=1; }
ok()   { echo "  ✓ $1"; }

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_SYSTEM=/dev/null

echo "=== Garde-fou statique — jamais de chemin fantôme (push + gh pr close) ==="
if grep -qE 'pr close' "$SCRIPT"; then
  fail "le script contient un appel 'pr close' — chemin fantôme (ADR-0052)"
else
  ok "aucun 'gh pr close' dans le script"
fi

# --- Cas 1 : SANS remote — squash local, prune, aucun gh appelé -----------------------
echo "=== Cas 1 — sans remote : squash local + prune + aucun gh appelé ==="
REPO="$WORK/repo-local"
git init -q -b main "$REPO"
git -C "$REPO" config user.email t@t.io
git -C "$REPO" config user.name t
echo v1 > "$REPO/f.txt"
git -C "$REPO" add f.txt
git -C "$REPO" commit -qm "chore: v1"

git -C "$REPO" checkout -qb feat/x
echo v2 >> "$REPO/f.txt"
git -C "$REPO" add f.txt
git -C "$REPO" commit -qm "feat: x en cours"
git -C "$REPO" checkout -q main

# Une branche déjà absorbée d'une session précédente (contenu déjà dans main) : le
# script doit la retrouver et la purger, comme fait `check.sh` (fiche 0076).
git -C "$REPO" branch old-absorbed main

# `gh` est un piège : s'il est invoqué, il écrit un marqueur — le test échoue si le
# marqueur apparaît.
GH_MARKER="$WORK/gh-called"
FAKE_BIN="$WORK/fakebin"
mkdir -p "$FAKE_BIN"
cat > "$FAKE_BIN/gh" <<EOF
#!/usr/bin/env bash
echo "gh appelé: \$*" >> "$GH_MARKER"
exit 1
EOF
chmod +x "$FAKE_BIN/gh"

PATH="$FAKE_BIN:$PATH" bash "$SCRIPT" \
  --repo "$REPO" --branch feat/x --base main \
  --subject "feat: x" --body "corps du commit"

[[ ! -f "$GH_MARKER" ]] && ok "gh jamais appelé (chemin sans remote)" || fail "gh a été appelé: $(cat "$GH_MARKER" 2>/dev/null)"

LOG="$(git -C "$REPO" log -1 --format='%s%n%b' main)"
grep -qF "feat: x" <<<"$LOG" && ok "commit conventional sur main (sujet)" || fail "sujet du commit absent"
grep -qF "corps du commit" <<<"$LOG" && ok "commit conventional sur main (corps)" || fail "corps du commit absent"
[[ "$(cat "$REPO/f.txt")" == $'v1\nv2' ]] && ok "contenu de la branche bien squashé dans main" || fail "contenu pas squashé"

git -C "$REPO" show-ref --verify -q refs/heads/feat/x && fail "feat/x pas prunée après ship" || ok "feat/x prunée (absorbée par le squash qu'on vient de faire)"
git -C "$REPO" show-ref --verify -q refs/heads/old-absorbed && fail "old-absorbed pas prunée (déjà absorbée avant ce ship)" || ok "old-absorbed prunée (déjà absorbée)"
[[ -z "$(git -C "$REPO" status --porcelain)" ]] && ok "working tree propre après ship" || fail "working tree sale après ship"

# --- Cas 2 : AVEC remote, --dry-run — construit la commande, n'exécute rien -----------
echo "=== Cas 2 — avec remote (--dry-run) : commande gh construite, jamais exécutée ==="
REPO2="$WORK/repo-remote"
git init -q -b main "$REPO2"
git -C "$REPO2" config user.email t@t.io
git -C "$REPO2" config user.name t
echo v1 > "$REPO2/f.txt"
git -C "$REPO2" add f.txt
git -C "$REPO2" commit -qm "chore: v1"
git -C "$REPO2" remote add origin https://example.invalid/repo.git

GH_MARKER2="$WORK/gh-called-2"
rm -f "$GH_MARKER2"
OUT="$(PATH="$FAKE_BIN:$PATH" bash "$SCRIPT" \
  --repo "$REPO2" --remote --pr 42 --branch feat/y \
  --subject "feat: y" --body "corps y" --head-sha cafe1234 --dry-run)"
echo "$OUT"

[[ ! -f "$GH_MARKER2" ]] && ok "gh jamais exécuté en --dry-run" || fail "gh a été appelé en dry-run"
grep -qF "gh pr merge 42" <<<"$OUT" && ok "commande gh pr merge construite avec le bon numéro" || fail "commande gh absente/incorrecte"
grep -qF -- "--squash" <<<"$OUT" && ok "--squash présent" || fail "--squash absent"
grep -qF -- "--delete-branch" <<<"$OUT" && ok "--delete-branch présent" || fail "--delete-branch absent"
grep -qF -- "--match-head-commit cafe1234" <<<"$OUT" && ok "--match-head-commit (head validé) épinglé" || fail "--match-head-commit absent"
grep -qF -- "--subject" <<<"$OUT" && grep -qF "feat: y" <<<"$OUT" && ok "message conventional du LOCAL (--subject)" || fail "message local absent de la commande"

# --- Cas 3 : refresh partagé — après le merge, un AUTRE clone voit origin/main à jour
# et la ref de la branche mergée disparaître.
#
# On mute le bare AVANT d'appeler ship-merge.sh, avec de simples commandes git au premier
# niveau (pas de git imbriqué dans un script généré) : ça REPRÉSENTE ce que GitHub vient
# de faire côté serveur (squash + suppression de branche). Le `gh` FACTICE posé sur le
# PATH ne fait qu'enregistrer l'appel (jamais de réseau réel, jamais le vrai binaire) :
# ship-merge.sh, lui, doit ensuite faire le VRAI travail testé ici — `fetch --prune` +
# réalignement des vues — sans avoir eu besoin d'un `gh` réel pour ça.
echo "=== Cas 3 — refresh partagé : fetch --prune propage le merge à un autre clone ==="
BARE="$WORK/origin.git"
git init -q --bare -b main "$BARE"

SEED="$WORK/seed"
git clone -q "$BARE" "$SEED"
git -C "$SEED" config user.email t@t.io
git -C "$SEED" config user.name t
echo v1 > "$SEED/f.txt"
git -C "$SEED" add f.txt
git -C "$SEED" commit -qm "chore: v1"
git -C "$SEED" push -q origin main
git -C "$SEED" push -q origin main:feat/z

SHIP_CLONE="$WORK/ship-clone"
git clone -q "$BARE" "$SHIP_CLONE"
git -C "$SHIP_CLONE" config user.email t@t.io
git -C "$SHIP_CLONE" config user.name t

OTHER_CLONE="$WORK/other-clone"
git clone -q "$BARE" "$OTHER_CLONE"
git -C "$OTHER_CLONE" config user.email t@t.io
git -C "$OTHER_CLONE" config user.name t

# "GitHub" vient de squasher la PR #7 et de supprimer sa branche — fait AVANT d'appeler
# ship-merge.sh, avec le clone `seed` qui n'a rien à voir avec les clones sous test.
echo v2 >> "$SEED/f.txt"
git -C "$SEED" add f.txt
git -C "$SEED" commit -qm "feat: z"
git -C "$SEED" push -q origin main
git -C "$SEED" push -q origin --delete feat/z

FAKE_GH_MERGE="$WORK/fakebin-merge"
mkdir -p "$FAKE_GH_MERGE"
GH_MERGE_MARKER="$WORK/gh-merge-called"
cat > "$FAKE_GH_MERGE/gh" <<'EOF'
#!/usr/bin/env bash
echo "$@" >> "$GH_MERGE_CALLED_FILE"
EOF
chmod +x "$FAKE_GH_MERGE/gh"

GH_MERGE_CALLED_FILE="$GH_MERGE_MARKER" PATH="$FAKE_GH_MERGE:$PATH" bash "$SCRIPT" \
  --repo "$SHIP_CLONE" --remote --pr 7 --branch feat/z \
  --subject "feat: z" --body "corps z" --head-sha deadbeef

[[ -f "$GH_MERGE_MARKER" ]] && ok "gh (factice) invoqué pour le squash distant" || fail "gh jamais invoqué"

git -C "$OTHER_CLONE" fetch -q --prune origin
git -C "$OTHER_CLONE" show-ref --verify -q refs/remotes/origin/feat/z \
  && fail "other-clone voit encore origin/feat/z après le prune" \
  || ok "other-clone : ref de la branche mergée disparue après fetch --prune"
BARE_MAIN="$(git -C "$BARE" rev-parse main)"
SHIP_HEAD="$(git -C "$SHIP_CLONE" rev-parse HEAD)"
[[ "$SHIP_HEAD" == "$BARE_MAIN" ]] && ok "ship-clone lui-même à jour après son propre merge" || fail "ship-clone pas à jour"

# --- Cas 4 : dépôt sale — squash local REFUSÉ (pas de publication silencieuse) ---------
# Un changement STAGÉ sans rapport ne bloque pas `checkout` : il survivrait au switch puis
# serait embarqué par le commit de squash. On exige donc un dépôt propre avant de shipper.
echo "=== Cas 4 — dépôt sale : squash local refusé (pas de travail non validé publié) ==="
REPO4="$WORK/repo-dirty"
git init -q -b main "$REPO4"
git -C "$REPO4" config user.email t@t.io
git -C "$REPO4" config user.name t
echo v1 > "$REPO4/f.txt"; git -C "$REPO4" add f.txt; git -C "$REPO4" commit -qm "chore: v1"
git -C "$REPO4" checkout -qb feat/x
echo v2 >> "$REPO4/f.txt"; git -C "$REPO4" add f.txt; git -C "$REPO4" commit -qm "feat: x"
git -C "$REPO4" checkout -q main
echo parasite > "$REPO4/parasite.txt"; git -C "$REPO4" add parasite.txt   # stagé, non conflictuel
MAIN_BEFORE="$(git -C "$REPO4" rev-parse main)"
if bash "$SCRIPT" --repo "$REPO4" --branch feat/x --base main --subject "feat: x" --body b >/dev/null 2>&1; then
  fail "ship_local a accepté un dépôt sale (risque de publier parasite.txt)"
else
  ok "ship_local refuse un dépôt sale (exit != 0)"
fi
[[ "$(git -C "$REPO4" rev-parse main)" == "$MAIN_BEFORE" ]] && ok "main inchangé après le refus" || fail "main a avancé malgré le refus"

# --- Cas 5 : --head-sha → --match-head-commit épingle le head validé ------------------
echo "=== Cas 5 — --head-sha : --match-head-commit dans la commande gh (anti-course) ==="
OUT5="$(PATH="$FAKE_BIN:$PATH" bash "$SCRIPT" --repo "$REPO2" --remote --pr 99 --branch feat/y \
  --subject "feat: y" --body "corps y" --head-sha deadbeef --dry-run)"
grep -qF -- "--match-head-commit deadbeef" <<<"$OUT5" && ok "--match-head-commit <sha validé> présent" || fail "--match-head-commit absent malgré --head-sha"

# --- Cas 6 : branche absorbée tenue par un AUTRE worktree — signal, pas d'avortement ---
echo "=== Cas 6 — branche absorbée tenue par un worktree : pas d'abandon en plein ship ==="
REPO6="$WORK/repo-held"
git init -q -b main "$REPO6"
git -C "$REPO6" config user.email t@t.io
git -C "$REPO6" config user.name t
echo v1 > "$REPO6/f.txt"; git -C "$REPO6" add f.txt; git -C "$REPO6" commit -qm "chore: v1"
git -C "$REPO6" branch held main                                   # déjà absorbée (= main)
git -C "$REPO6" worktree add -q "$WORK/repo6-held-wt" held >/dev/null 2>&1   # tenue par un worktree
git -C "$REPO6" checkout -qb feat/w
echo v2 >> "$REPO6/f.txt"; git -C "$REPO6" add f.txt; git -C "$REPO6" commit -qm "feat: w"
git -C "$REPO6" checkout -q main
if bash "$SCRIPT" --repo "$REPO6" --branch feat/w --base main --subject "feat: w" --body b >/dev/null 2>&1; then
  ok "ship_local n'a pas avorté malgré une branche absorbée tenue par un worktree"
else
  fail "ship_local a avorté (exit != 0) sur une branche tenue par un worktree"
fi
[[ "$(cat "$REPO6/f.txt")" == $'v1\nv2' ]] && ok "main a bien avancé (squash appliqué)" || fail "main n'a pas avancé"
git -C "$REPO6" show-ref --verify -q refs/heads/held && ok "branche tenue 'held' préservée" || fail "branche tenue supprimée malgré le worktree"

# --- Cas 7 : remote SANS --head-sha — refus (le garde-fou anti-course est obligatoire) --
echo "=== Cas 7 — remote sans --head-sha : refus (garde-fou non contournable par omission) ==="
if PATH="$FAKE_BIN:$PATH" bash "$SCRIPT" --repo "$REPO2" --remote --pr 77 --branch feat/q \
   --subject "feat: q" --body b >/dev/null 2>&1; then
  fail "remote sans --head-sha accepté (le garde-fou anti-course serait contournable par omission)"
else
  ok "remote sans --head-sha refusé (exit != 0)"
fi

if (( FAIL )); then
  echo "❌ test-ship-merge — ÉCHEC"
  exit 1
fi
echo "✅ test-ship-merge — TOUT VERT"
