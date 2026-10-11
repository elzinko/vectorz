#!/usr/bin/env bash
# DoD exécutable — la garde de CONFINEMENT de chemin du helper partagé `commit-doc-via-worktree.sh`
# (fiche 20261008072305169, ADR-0068 ; loi `testing/confinement-contract-at-boundary`).
#
# Le helper committe un document dans `main` via un worktree jetable. `--dest-rel` dit OÙ il atterrit :
# un chemin qui s'échappe (absolu, `..`, via un symlink) ne doit JAMAIS écrire hors du dépôt. Ce test
# exerce le point d'entrée réel avec des chemins malveillants — c'est la branche de rejet, sans quoi la
# garde n'est pas prouvée.
set -uo pipefail

HELPER="$(cd "$(dirname "$0")" && pwd)/commit-doc-via-worktree.sh"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT
FAIL=0
ok() { if ( set +o pipefail; eval "$2" ); then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

# Un dépôt propre + un document source non suivi (la « seule copie » à ne jamais détruire sur un refus).
P="$ROOT/repo"
git init -q -b main "$P"
git -C "$P" config user.email t@t && git -C "$P" config user.name t && git -C "$P" config commit.gpgsign false
echo base > "$P/a.txt"; git -C "$P" add .; git -C "$P" commit -qm base
SRC="$ROOT/doc.md"; printf 'contenu du document\n' > "$SRC"

run() { bash "$HELPER" --repo "$P" --file "$SRC" --dest-rel "$1" --branch-base docs/doc-x --subject "docs: essai" 2>&1; }

echo "G — chemins qui s'échappent : REFUS net (exit 2), rien écrit, source PRÉSERVÉE :"
for bad in "../escape.md" "/etc/passwd" "docs/../../escape.md" "a/../../../etc/x.md"; do
  run "$bad" >/dev/null 2>&1; rc=$?
  ok "refus « $bad » → exit 2" "[ \"$rc\" -eq 2 ]"
done
ok "le document source est intact après tous les refus" "[ -f \"$SRC\" ] && grep -q 'contenu du document' \"$SRC\""
ok "aucun commit n'a été créé par les refus" "[ \"\$(git -C \"$P\" rev-list --all --count)\" -eq 1 ]"

echo "S — symlink neutralisé : le commit vit dans un worktree jetable (pas via le symlink du dépôt) :"
# Un commit réussi RETIRE la source (garde anti-perte) : on la recrée avant chaque cas qui doit réussir.
printf 'contenu du document\n' > "$SRC"
OUTSIDE="$ROOT/outside"; mkdir -p "$OUTSIDE"
ln -s "$OUTSIDE" "$P/esc"          # un symlink DANS le dépôt qui pointe dehors
run "esc/leak.md" >/dev/null 2>&1  # dest-rel sans « .. » ni « / » initial : passe la garde de chaîne
ok "rien n'a fui hors du dépôt par le symlink" "[ -z \"\$(ls -A \"$OUTSIDE\")\" ]"
rm -f "$P/esc"

echo "V — chemin propre : committé (mode PR, pas de .vectorz → branche + commande d'ouverture) :"
printf 'contenu du document\n' > "$SRC"
OUT="$(bash "$HELPER" --repo "$P" --file "$SRC" --dest-rel "docs/sprints/ok.md" --branch-base docs/doc-v --subject "docs: essai" 2>&1)"
ok "sortie : committé sur la branche" "printf '%s' \"\$OUT\" | grep -q 'committée sur docs/doc-v'"
ok "le document est sur la branche, sous dest-rel" "git -C \"$P\" show 'docs/doc-v:docs/sprints/ok.md' 2>/dev/null | grep -q 'contenu du document'"
ok "la source a été retirée après le commit réussi" "[ ! -f \"$SRC\" ]"

echo
if (( FAIL )); then echo "test-commit-doc-via-worktree: ÉCHECS"; exit 1; fi
echo "test-commit-doc-via-worktree: TOUT VERT"
