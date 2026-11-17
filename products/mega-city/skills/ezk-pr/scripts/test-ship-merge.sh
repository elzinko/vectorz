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

# Un reste d'un squash précédent (fiche 0076) : un commit à lui, dont le contenu est déjà
# dans main par un squash. Sa pointe n'est donc pas dans l'historique de main. Le script doit
# la retrouver et la purger, comme fait `check.sh`.
squash_remnant() {  # <repo> <branche> <fichier> : branche à un commit, squashée dans main
  local r="$1" b="$2" f="$3"
  git -C "$r" checkout -qb "$b" main
  echo "$b" > "$r/$f"; git -C "$r" add "$f"; git -C "$r" commit -qm "feat: $b"
  git -C "$r" checkout -q main
  git -C "$r" merge -q --squash "$b" >/dev/null
  git -C "$r" commit -qm "feat: $b (squash)"
}
squash_remnant "$REPO" old-absorbed old.txt

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
squash_remnant "$REPO6" held held.txt                              # déjà absorbée (reste de squash)
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

# --- Cas 8 : base ≠ main — la branche principale n'est jamais supprimée (fiche 20261004074008211) --
# Le 2026-10-03, un squash vers une branche d'intégration a jugé `main` « absorbée » et lancé
# `git branch -D main` : seul le verrou d'un worktree l'a empêché. Ici, AUCUN worktree ne tient
# `main` : sans la protection, elle disparaît.
echo "=== Cas 8 — base ≠ main : main, master et la cible d'origin/HEAD survivent ; chaque suppression se dit ==="
REPO8="$WORK/repo-integ"
BARE8="$WORK/remote8.git"
git init -q -b main "$REPO8"
git -C "$REPO8" config user.email t@t.io
git -C "$REPO8" config user.name t
echo v1 > "$REPO8/f.txt"
git -C "$REPO8" add f.txt
git -C "$REPO8" commit -qm "chore: v1"
git -C "$REPO8" branch master main
git -C "$REPO8" branch trunk main
squash_remnant "$REPO8" old-absorbed old.txt
git init -q --bare "$BARE8"
git -C "$REPO8" remote add origin "$BARE8"
git -C "$REPO8" push -q origin main trunk
git -C "$REPO8" symbolic-ref refs/remotes/origin/HEAD refs/remotes/origin/trunk
git -C "$REPO8" checkout -qb integ
git -C "$REPO8" checkout -qb feat/y
echo v2 >> "$REPO8/f.txt"
git -C "$REPO8" add f.txt
git -C "$REPO8" commit -qm "feat: y"
SHA_Y="$(git -C "$REPO8" rev-parse feat/y)"
SHA_OLD="$(git -C "$REPO8" rev-parse old-absorbed)"

OUT8="$(PATH="$FAKE_BIN:$PATH" bash "$SCRIPT" --local --repo "$REPO8" --branch feat/y --base integ \
  --subject "feat: y" --body "corps" 2>&1)"

for b in main master trunk; do
  git -C "$REPO8" show-ref --verify -q "refs/heads/$b" && ok "$b toujours là (base = integ)" || fail "$b supprimée alors que la base est integ"
done
git -C "$REPO8" show-ref --verify -q refs/heads/feat/y && fail "feat/y pas prunée" || ok "feat/y prunée (absorbée par le squash)"
git -C "$REPO8" show-ref --verify -q refs/heads/old-absorbed && fail "old-absorbed pas prunée" || ok "old-absorbed prunée (déjà absorbée)"
grep -qxF "pruned: feat/y ($SHA_Y) — git branch feat/y $SHA_Y" <<<"$OUT8" && ok "la suppression de feat/y se dit, avec la commande qui la recrée" || fail "suppression de feat/y muette : $OUT8"
grep -qxF "pruned: old-absorbed ($SHA_OLD) — git branch old-absorbed $SHA_OLD" <<<"$OUT8" && ok "la suppression de old-absorbed se dit aussi" || fail "suppression de old-absorbed muette : $OUT8"
grep -qE "pruned: (main|master|trunk) " <<<"$OUT8" && fail "une branche principale annoncée supprimée : $OUT8" || ok "aucune branche principale dans les suppressions"

# --- Cas 9 : local --dry-run — ne touche NI main, NI l'index, NI l'arbre ---------------
# Le bug (2026-10-14) : --dry-run n'était honoré qu'en remote ; en local il squashait POUR DE
# VRAI sur main. Un « essai à blanc » doit seulement DIRE ce qu'il ferait, et ne rien écrire.
echo "=== Cas 9 — local --dry-run : main inchangé, arbre propre, branche non prunée ==="
REPO9="$WORK/repo-dryrun"
git init -q -b main "$REPO9"
git -C "$REPO9" config user.email t@t.io
git -C "$REPO9" config user.name t
echo v1 > "$REPO9/f.txt"; git -C "$REPO9" add f.txt; git -C "$REPO9" commit -qm "chore: v1"
git -C "$REPO9" checkout -qb feat/d
echo v2 >> "$REPO9/f.txt"; git -C "$REPO9" add f.txt; git -C "$REPO9" commit -qm "feat: d"
git -C "$REPO9" checkout -q main
MAIN_BEFORE9="$(git -C "$REPO9" rev-parse main)"
BRANCH_BEFORE9="$(git -C "$REPO9" symbolic-ref --short HEAD)"

if OUT9="$(bash "$SCRIPT" --local --repo "$REPO9" --branch feat/d --base main \
  --subject "feat: d" --body "corps d" --dry-run 2>&1)"; then RC9=0; else RC9=$?; fi
echo "$OUT9"

(( RC9 == 0 )) && ok "dry-run d'un merge propre : exit 0" || fail "dry-run propre a renvoyé exit $RC9"
grep -qF "DRY-RUN" <<<"$OUT9" && ok "la sortie annonce DRY-RUN" || fail "sortie sans marqueur DRY-RUN : $OUT9"
grep -qiF "propre" <<<"$OUT9" && ok "dit que le merge serait propre" || fail "ne qualifie pas le merge : $OUT9"
[[ "$(git -C "$REPO9" rev-parse main)" == "$MAIN_BEFORE9" ]] && ok "main INCHANGÉ (git rev-parse main stable) — le bug est fermé" || fail "main a avancé en dry-run (LE bug)"
[[ -z "$(git -C "$REPO9" status --porcelain)" ]] && ok "index + arbre propres après dry-run" || fail "dry-run a sali l'index/l'arbre"
[[ "$(git -C "$REPO9" symbolic-ref --short HEAD)" == "$BRANCH_BEFORE9" ]] && ok "aucun checkout : toujours sur $BRANCH_BEFORE9" || fail "dry-run a basculé de branche (checkout indû)"
git -C "$REPO9" show-ref --verify -q refs/heads/feat/d && ok "feat/d non prunée (rien n'a été intégré)" || fail "feat/d prunée alors que c'était un essai à blanc"

# --- Cas 9b : local --dry-run d'un merge EN CONFLIT — signale, exit 3, rien touché -----
echo "=== Cas 9b — local --dry-run, merge en conflit : CONFLIT annoncé, exit 3, rien touché ==="
REPO9B="$WORK/repo-dryrun-conflit"
git init -q -b main "$REPO9B"
git -C "$REPO9B" config user.email t@t.io
git -C "$REPO9B" config user.name t
printf 'ligne commune\n' > "$REPO9B/f.txt"; git -C "$REPO9B" add f.txt; git -C "$REPO9B" commit -qm "chore: base"
git -C "$REPO9B" checkout -qb feat/c
printf 'version branche\n' > "$REPO9B/f.txt"; git -C "$REPO9B" add f.txt; git -C "$REPO9B" commit -qm "feat: c"
git -C "$REPO9B" checkout -q main
printf 'version main\n' > "$REPO9B/f.txt"; git -C "$REPO9B" add f.txt; git -C "$REPO9B" commit -qm "chore: main diverge"
MAIN_BEFORE9B="$(git -C "$REPO9B" rev-parse main)"

if OUT9B="$(bash "$SCRIPT" --local --repo "$REPO9B" --branch feat/c --base main \
  --subject "feat: c" --body b --dry-run 2>&1)"; then RC9B=0; else RC9B=$?; fi
echo "$OUT9B"

(( RC9B == 3 )) && ok "dry-run en conflit : exit 3 (même code refus que push-ff)" || fail "dry-run en conflit a renvoyé exit $RC9B (attendu 3)"
grep -qiF "conflit" <<<"$OUT9B" && ok "annonce le CONFLIT" || fail "ne dit pas le conflit : $OUT9B"
[[ "$(git -C "$REPO9B" rev-parse main)" == "$MAIN_BEFORE9B" ]] && ok "main inchangé malgré le conflit simulé" || fail "main a bougé en dry-run conflit"
[[ -z "$(git -C "$REPO9B" status --porcelain)" ]] && ok "index + arbre propres après dry-run conflit" || fail "dry-run conflit a sali l'index/l'arbre"

# --- Cas 10 : branche neuve d'une autre session — elle survit au squash ----------------
# Le bug (2026-11-02) : une session venait de créer `docs/un-seul-ecran` au commit de main.
# Le squash local d'une autre branche l'a jugée « absorbée » et a tenté de la supprimer ; seul
# un worktree l'a sauvée. Une branche dont la pointe est dans l'historique de main n'a encore
# rien fait : on l'épargne. Ici AUCUN worktree ne la tient.
echo "=== Cas 10 — branche neuve d'une autre session : épargnée par le squash, le reste toujours purgé ==="
REPO10="$WORK/repo-fresh"
git init -q -b main "$REPO10"
git -C "$REPO10" config user.email t@t.io
git -C "$REPO10" config user.name t
echo v1 > "$REPO10/f.txt"; git -C "$REPO10" add f.txt; git -C "$REPO10" commit -qm "chore: v1"
SHA_V1_10="$(git -C "$REPO10" rev-parse main)"
squash_remnant "$REPO10" old-absorbed old.txt
git -C "$REPO10" branch older-session "$SHA_V1_10"                # pointe sur un commit plus ancien de main
git -C "$REPO10" checkout -qb feat/z
echo v2 >> "$REPO10/f.txt"; git -C "$REPO10" add f.txt; git -C "$REPO10" commit -qm "feat: z"
git -C "$REPO10" checkout -q main
git -C "$REPO10" branch fresh-session main                         # créée à l'instant, au commit de main
SHA_Z="$(git -C "$REPO10" rev-parse feat/z)"

OUT10="$(bash "$SCRIPT" --local --repo "$REPO10" --branch feat/z --base main \
  --subject "feat: z" --body b 2>&1)"

git -C "$REPO10" show-ref --verify -q refs/heads/fresh-session && ok "fresh-session toujours là après le squash (branche neuve, sans worktree)" || fail "fresh-session supprimée : $OUT10"
git -C "$REPO10" show-ref --verify -q refs/heads/older-session && ok "older-session toujours là (pointe sur un commit plus ancien de main)" || fail "older-session supprimée : $OUT10"
grep -qE "(fresh|older)-session" <<<"$OUT10" && fail "une branche neuve citée dans la sortie : $OUT10" || ok "aucune branche neuve citée (ni supprimée, ni « non supprimée »)"
git -C "$REPO10" show-ref --verify -q refs/heads/feat/z && fail "feat/z pas prunée" || ok "feat/z prunée (la branche qu'on vient d'intégrer)"
grep -qxF "pruned: feat/z ($SHA_Z) — git branch feat/z $SHA_Z" <<<"$OUT10" && ok "la suppression de feat/z se dit, avec la commande qui la recrée" || fail "suppression de feat/z muette : $OUT10"
git -C "$REPO10" show-ref --verify -q refs/heads/old-absorbed && fail "old-absorbed pas prunée" || ok "old-absorbed prunée (reste d'un squash plus ancien)"

# --- Cas 11 : le squash recrée le commit à l'identique — la branche intégrée part quand même ---
# Le bug (2026-11-02, régression du cas 10) : une branche à un seul commit, squashée dans la même
# seconde avec le même message, donne un commit de squash identique à l'octet (même arbre, même
# parent, mêmes auteur et date). La pointe de la branche devient la pointe de main, et le garde du
# cas 10 la prenait pour une branche neuve. C'est le chemin de l'archive et des comptes rendus
# (commit-doc-via-worktree.sh) : un commit, puis un squash avec le même sujet. Dates figées ici pour
# jouer le piège à coup sûr.
echo "=== Cas 11 — squash identique au commit de la branche : la branche intégrée est prunée, la neuve épargnée ==="
REPO11="$WORK/repo-same-commit"
git init -q -b main "$REPO11"
git -C "$REPO11" config user.email t@t.io
git -C "$REPO11" config user.name t
echo v1 > "$REPO11/f.txt"; git -C "$REPO11" add f.txt; git -C "$REPO11" commit -qm "chore: v1"
git -C "$REPO11" branch fresh-session main                         # branche neuve d'une autre session
SAME_DATE="2026-11-02 12:00:00 +0000"
git -C "$REPO11" checkout -qb docs/archive
echo doc > "$REPO11/doc.md"; git -C "$REPO11" add doc.md
GIT_AUTHOR_DATE="$SAME_DATE" GIT_COMMITTER_DATE="$SAME_DATE" git -C "$REPO11" commit -qm "docs: archive" -m b
git -C "$REPO11" checkout -q main
SHA_DOC="$(git -C "$REPO11" rev-parse docs/archive)"

OUT11="$(GIT_AUTHOR_DATE="$SAME_DATE" GIT_COMMITTER_DATE="$SAME_DATE" bash "$SCRIPT" --local --repo "$REPO11" \
  --branch docs/archive --base main --subject "docs: archive" --body b 2>&1)"

[[ "$(git -C "$REPO11" rev-parse main)" == "$SHA_DOC" ]] && ok "le squash a recréé le commit de la branche à l'identique (le piège est joué)" || fail "fixture : le squash n'a pas recréé le même commit, le cas ne prouve rien"
git -C "$REPO11" show-ref --verify -q refs/heads/docs/archive && fail "docs/archive pas prunée alors qu'on vient de l'intégrer : $OUT11" || ok "docs/archive prunée (la branche qu'on vient d'intégrer)"
grep -qxF "pruned: docs/archive ($SHA_DOC) — git branch docs/archive $SHA_DOC" <<<"$OUT11" && ok "la suppression de docs/archive se dit, avec la commande qui la recrée" || fail "suppression de docs/archive muette : $OUT11"
git -C "$REPO11" show-ref --verify -q refs/heads/fresh-session && ok "fresh-session toujours là (branche neuve, épargnée)" || fail "fresh-session supprimée : $OUT11"

# --- Cas 12 : lockfile changé -> pnpm install --frozen-lockfile dans le dépôt visé ------
echo "=== Cas 12 — lockfile : installe si pnpm-lock.yaml change, sinon rien ==="
PNPM_LOG="$WORK/pnpm-log"
PNPM_BIN="$WORK/pnpmbin"; mkdir -p "$PNPM_BIN"
cat > "$PNPM_BIN/pnpm" <<EOF2
#!/usr/bin/env bash
echo "\$PWD :: \$*" >> "$PNPM_LOG"
exit "\${FAKE_PNPM_EXIT:-0}"
EOF2
chmod +x "$PNPM_BIN/pnpm"

lock_repo() {  # <dir> <branche> <touche le lockfile 0|1>
  git init -q -b main "$1"
  git -C "$1" config user.email t@t.io; git -C "$1" config user.name t
  echo l1 > "$1/pnpm-lock.yaml"; git -C "$1" add .; git -C "$1" commit -qm "chore: v1"
  git -C "$1" checkout -qb "$2"
  if [[ "$3" == 1 ]]; then echo l2 > "$1/pnpm-lock.yaml"; else echo x > "$1/x.txt"; fi
  git -C "$1" add .; git -C "$1" commit -qm "feat: s"
  git -C "$1" checkout -q main
}

R12="$WORK/repo-lock"; lock_repo "$R12" feat/l 1
OUT12="$(PATH="$PNPM_BIN:$PATH" bash "$SCRIPT" --local --repo "$R12" --branch feat/l --base main --subject "feat: l" --body b 2>&1)"
grep -qE "/repo-lock :: install --frozen-lockfile$" "$PNPM_LOG" 2>/dev/null && ok "lockfile changé : pnpm install --frozen-lockfile lancé dans le dépôt" || fail "pnpm non lancé : $OUT12"

rm -f "$PNPM_LOG"
R12B="$WORK/repo-nolock"; lock_repo "$R12B" feat/n 0
PATH="$PNPM_BIN:$PATH" bash "$SCRIPT" --local --repo "$R12B" --branch feat/n --base main --subject "feat: n" --body b >/dev/null 2>&1
[[ ! -e "$PNPM_LOG" ]] && ok "lockfile inchangé : rien installé" || fail "pnpm lancé sans changement de lockfile"

R12C="$WORK/repo-off"; lock_repo "$R12C" feat/o 1
EZK_INTEGRATE_NO_INSTALL=1 PATH="$PNPM_BIN:$PATH" bash "$SCRIPT" --local --repo "$R12C" --branch feat/o --base main --subject "feat: o" --body b >/dev/null 2>&1
[[ ! -e "$PNPM_LOG" ]] && ok "EZK_INTEGRATE_NO_INSTALL=1 coupe le geste" || fail "pnpm lancé malgré EZK_INTEGRATE_NO_INSTALL"

R12D="$WORK/repo-fail"; lock_repo "$R12D" feat/f 1
RC12=0
ERR12="$(FAKE_PNPM_EXIT=1 PATH="$PNPM_BIN:$PATH" bash "$SCRIPT" --local --repo "$R12D" --branch feat/f --base main --subject "feat: f" --body b 2>&1 >/dev/null)" || RC12=$?
[[ "$RC12" == 0 ]] && ok "installation en échec : intégration réussie (exit 0)" || fail "exit $RC12 malgré l'échec d'installation"
grep -qF "pnpm install --frozen-lockfile a échoué" <<<"$ERR12" && ok "échec dit en une ligne sur stderr" || fail "échec muet : $ERR12"
[[ "$(git -C "$R12D" log -1 --format=%s)" == "feat: f" ]] && ok "intégration laissée en place" || fail "squash perdu"

R12E="$WORK/repo-nopnpm"; lock_repo "$R12E" feat/p 1
EMPTY_BIN="$WORK/emptybin"; mkdir -p "$EMPTY_BIN"
for t in git bash dirname sed grep head cat; do ln -sf "$(command -v $t)" "$EMPTY_BIN/$t"; done
ERR12E="$(PATH="$EMPTY_BIN" bash "$SCRIPT" --local --repo "$R12E" --branch feat/p --base main --subject "feat: p" --body b 2>&1 >/dev/null)" && ok "pnpm introuvable : intégration réussie" || fail "échec sans pnpm : $ERR12E"
grep -qF "pnpm introuvable" <<<"$ERR12E" && ok "pnpm introuvable dit en une ligne" || fail "silence sans pnpm : $ERR12E"

# --- Cas 13 : l'intégration imprime le commit qu'elle a créé (fiche 20261117150620910) -------
echo "=== Cas 13 — INTEGRATED: <sha> <branche>, le commit de l'intégration ==="
R13="$WORK/repo-sha"; lock_repo "$R13" feat/i 0
OUT13="$(EZK_INTEGRATE_NO_INSTALL=1 bash "$SCRIPT" --local --repo "$R13" --branch feat/i --base main --subject "feat: i" --body b 2>/dev/null)"
SHA13="$(sed -n 's/^INTEGRATED: \([0-9a-f]*\) feat\/i$/\1/p' <<<"$OUT13")"
[[ -n "$SHA13" ]] && ok "une ligne INTEGRATED: <sha> feat/i est imprimée" || fail "pas de ligne INTEGRATED : $OUT13"
# Une autre session committe juste après : le commit annoncé reste celui de l'intégration.
echo y > "$R13/y.txt"; git -C "$R13" add y.txt; git -C "$R13" commit -qm "docs: autre session"
[[ -n "$SHA13" && "$(git -C "$R13" log -1 --format=%s "$SHA13")" == "feat: i" ]] && ok "le sha annoncé est le commit de l'intégration, pas le dernier de main" || fail "sha annoncé ($SHA13) n'est pas le squash"

if (( FAIL )); then
  echo "❌ test-ship-merge — ÉCHEC"
  exit 1
fi
echo "✅ test-ship-merge — TOUT VERT"
