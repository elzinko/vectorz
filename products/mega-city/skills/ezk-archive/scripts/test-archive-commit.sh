#!/usr/bin/env bash
# DoD exécutable — la clôture committe et intègre son archive (fiche 20261005100026946, ADR-0063).
#
# Ce que ces cas verrouillent :
#   L1  mode local, principal propre : l'archive est squash-mergée sur `main` local, sa branche est
#       prunée, la copie non suivie du worktree de session disparaît, rien n'est poussé ;
#   L2  mode local, principal SALE : on ne merge pas (ça embarquerait le travail en cours) — l'archive
#       reste committée sur sa branche `docs/archive-session-<date>`, et la sortie dit pourquoi ;
#   P   mode PR : l'archive est committée sur sa branche, jamais sur main, et la sortie donne la
#       commande d'ouverture de PR ; rien n'est poussé ;
#   C   collision de nom : une 2e archive le même jour prend `-2`, n'écrase jamais la 1re ;
#   G   gardes : --file manquant ou archive introuvable → refus net (exit 2), rien n'est écrit.
set -uo pipefail

SCRIPT="$(cd "$(dirname "$0")" && pwd)/archive-commit.sh"
ROOT="$(mktemp -d)"
trap 'rm -rf "$ROOT"' EXIT
FAIL=0
# Sous-shell SANS pipefail : `git log … | grep -q` ferme le pipe au 1er match, `git log` reçoit alors
# SIGPIPE (141) que `pipefail` prendrait pour un échec — alors que le motif EST trouvé.
ok() { if ( set +o pipefail; eval "$2" ); then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

# Un principal (main) + un worktree de session détaché, avec une archive écrite NON SUIVIE dedans.
# $1 = sous-dossier, $2 = mode ("local" pose .vectorz/config.yml pr:false ; "pr" ne pose rien).
setup() {
  local d="$ROOT/$1" mode="$2" P="$ROOT/$1/principal"
  git init -q -b main "$P"
  git -C "$P" config user.email t@t && git -C "$P" config user.name t && git -C "$P" config commit.gpgsign false
  echo base > "$P/a.txt"
  if [[ "$mode" == "local" ]]; then mkdir -p "$P/.vectorz"; printf 'github:\n  pr: false\n' > "$P/.vectorz/config.yml"; fi
  git -C "$P" add .; git -C "$P" commit -qm base
  git -C "$P" worktree add -q --detach "$ROOT/$1/session" main
  mkdir -p "$ROOT/$1/session/docs/sessions"
  printf 'fiches: 999\n\n# Récit\n\ncontenu\n' > "$ROOT/$1/session/docs/sessions/2026-10-06-demo.md"
}
run() { # $1=sous-dossier → lance le script sur l'archive de ce décor
  local P="$ROOT/$1/principal"
  bash "$SCRIPT" --repo "$P" --file "$ROOT/$1/session/docs/sessions/2026-10-06-demo.md" \
    --date 2026-10-06 --slug demo --subject "docs(sessions): archive session 2026-10-06 demo" 2>&1
}

echo "L1 — mode local, principal propre : intégrée sur main, branche prunée :"
setup l1 local
OUT1="$(run l1)"
ok "sortie : intégrée en local"        "echo \"\$OUT1\" | grep -q '^LOCAL: archive intégrée sur main'"
ok "archive sur main"                  "git -C \"\$ROOT/l1/principal\" log main --oneline | grep -q 'archive session 2026-10-06 demo'"
ok "branche de session prunée"         "! git -C \"\$ROOT/l1/principal\" show-ref --verify --quiet refs/heads/docs/archive-session-2026-10-06"
ok "copie non suivie disparue"         "[ ! -f \"\$ROOT/l1/session/docs/sessions/2026-10-06-demo.md\" ]"
ok "status du worktree de session propre" "[ -z \"\$(git -C \"\$ROOT/l1/session\" status --porcelain)\" ]"

echo "L2 — mode local, principal SALE : non intégrée, archive sauvée sur sa branche :"
setup l2 local
echo "wip" >> "$ROOT/l2/principal/a.txt"      # principal sale AVANT la clôture
OUT2="$(run l2)"
ok "sortie : différée car principal sale" "echo \"\$OUT2\" | grep -q '^LOCAL-DEFERRED:'"
ok "archive PAS sur main"              "! git -C \"\$ROOT/l2/principal\" log main --oneline | grep -q 'archive session 2026-10-06 demo'"
ok "archive sur sa branche"            "git -C \"\$ROOT/l2/principal\" log docs/archive-session-2026-10-06 --oneline | grep -q 'archive session 2026-10-06 demo'"
ok "travail en cours du principal intact" "git -C \"\$ROOT/l2/principal\" status --porcelain | grep -q 'a.txt'"

echo "P — mode PR : committée sur sa branche, commande de PR affichée, jamais sur main :"
setup p pr
OUT3="$(run p)"
ok "sortie : mode PR + gh pr create"   "echo \"\$OUT3\" | grep -q 'gh pr create'"
ok "archive sur sa branche"            "git -C \"\$ROOT/p/principal\" log docs/archive-session-2026-10-06 --oneline | grep -q 'archive session 2026-10-06 demo'"
ok "archive PAS sur main"              "! git -C \"\$ROOT/p/principal\" log main --oneline | grep -q 'archive session 2026-10-06 demo'"
ok "copie non suivie disparue"         "[ ! -f \"\$ROOT/p/session/docs/sessions/2026-10-06-demo.md\" ]"

echo "C — collision : une 2e archive le même jour prend -2, n'écrase pas la 1re :"
# Sur le décor PR (la branche docs/archive-session-2026-10-06 existe déjà), on rejoue une archive.
printf 'autre\n' > "$ROOT/p/session/docs/sessions/2026-10-06-demo.md"
OUT4="$(run p)"
ok "2e archive sur la branche -2"      "echo \"\$OUT4\" | grep -q 'docs/archive-session-2026-10-06-2'"
ok "1re branche intacte"               "git -C \"\$ROOT/p/principal\" show-ref --verify --quiet refs/heads/docs/archive-session-2026-10-06"

echo "D — commit refusé (hook pre-commit) : archive PRÉSERVÉE, rien retiré (anti perte de données) :"
setup d local
printf '#!/bin/sh\nexit 1\n' > "$ROOT/d/principal/.git/hooks/pre-commit"; chmod +x "$ROOT/d/principal/.git/hooks/pre-commit"
OUTD="$(run d 2>&1)"; RCD=$?
ok "le script refuse (exit non nul)"   "[ \"\$RCD\" -ne 0 ]"
ok "l'archive source est préservée"    "[ -f \"\$ROOT/d/session/docs/sessions/2026-10-06-demo.md\" ]"
ok "rien sur main"                     "! git -C \"\$ROOT/d/principal\" log main --oneline | grep -q 'archive session'"
rm -f "$ROOT/d/principal/.git/hooks/pre-commit"

echo "F — ship-merge refuse (mode local) : pas de faux « intégrée », archive gardée sur sa branche :"
setup f local
FAKE="$ROOT/f/fake-ship-merge.sh"; printf '#!/bin/sh\necho "ship-merge boom" >&2\nexit 1\n' > "$FAKE"; chmod +x "$FAKE"
OUTF="$(EZK_ARCHIVE_SHIP_MERGE="$FAKE" run f 2>&1)"
ok "sortie : LOCAL-FAILED (jamais « intégrée »)" "echo \"\$OUTF\" | grep -q '^LOCAL-FAILED:' && ! echo \"\$OUTF\" | grep -q '^LOCAL: archive intégrée'"
ok "archive gardée sur sa branche"     "git -C \"\$ROOT/f/principal\" log docs/archive-session-2026-10-06 --oneline | grep -q 'archive session 2026-10-06 demo'"
ok "archive PAS sur main"              "! git -C \"\$ROOT/f/principal\" log main --oneline | grep -q 'archive session 2026-10-06 demo'"

echo "G — gardes : refus net, rien écrit :"
ok "--file manquant → exit 2"          "setup g local; ! bash \"\$SCRIPT\" --repo \"\$ROOT/g/principal\" --date 2026-10-06 --slug x --subject s >/dev/null 2>&1"
ok "archive introuvable → exit 2"      "bash \"\$SCRIPT\" --repo \"\$ROOT/g/principal\" --file \"\$ROOT/g/absente.md\" --date 2026-10-06 --slug x --subject s >/dev/null 2>&1; [ \$? -eq 2 ]"
ok "slug avec « / » → refus, archive intacte" "setup gs local; ! bash \"\$SCRIPT\" --repo \"\$ROOT/gs/principal\" --file \"\$ROOT/gs/session/docs/sessions/2026-10-06-demo.md\" --date 2026-10-06 --slug 'feat/x' --subject s >/dev/null 2>&1; [ -f \"\$ROOT/gs/session/docs/sessions/2026-10-06-demo.md\" ]"
ok "date non conforme → refus"         "! bash \"\$SCRIPT\" --repo \"\$ROOT/gs/principal\" --file \"\$ROOT/gs/session/docs/sessions/2026-10-06-demo.md\" --date 06-10-2026 --slug demo --subject s >/dev/null 2>&1"
ok "aucun worktree jetable laissé"     "[ \"\$(git -C \"\$ROOT/l1/principal\" worktree list | wc -l | tr -d ' ')\" -le 2 ]"

echo
if (( FAIL )); then echo "test-archive-commit: ÉCHECS"; exit 1; fi
echo "test-archive-commit: TOUT VERT"
