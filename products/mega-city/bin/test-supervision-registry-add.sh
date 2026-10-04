#!/usr/bin/env bash
# DoD exécutable de la fiche 20261004192802828 (ADR-0062) — `registry-add` dit où il écrit.
#
# Ce que ces cas verrouillent :
#   R1  depuis le dossier principal : le registre de ce dossier est écrit, son chemin imprimé,
#       sans avertissement ;
#   R2  depuis un worktree : la copie du worktree est écrite (le fichier est suivi par git), son
#       chemin imprimé, avec l'avertissement « committe-la et merge-la » ; le dossier principal
#       reste intact.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$HERE/supervision-registry-add.ts"
TSX="$HERE/../node_modules/.bin/tsx"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

if [[ ! -x "$TSX" ]]; then echo "test-supervision-registry-add : tsx absent, lance pnpm install"; exit 1; fi

mkdir -p "$TMP/projet-a" "$TMP/projet-b"
cd "$TMP" && git init -q -b main siege && cd siege
git config user.email t@t && git config user.name t && git config commit.gpgsign false
printf 'projects:\n  - id: siege\n    path: .\n    method: mega-city\n' > supervision.registry.yaml
git add . && git commit -qm base
git worktree add -q "$TMP/siege-wt" -b wt
MAIN="$(pwd -P)"
WT="$(cd "$TMP/siege-wt" && pwd -P)"

echo "R1 — depuis le dossier principal :"
OUT1="$(cd "$MAIN" && "$TSX" "$SCRIPT" projet-a "$TMP/projet-a")"
ok "le projet est inscrit dans le registre du dossier principal" "grep -q 'id: projet-a' \"\$MAIN/supervision.registry.yaml\""
ok "le fichier écrit est imprimé"                                "echo \"\$OUT1\" | grep -q \"fichier écrit : \$MAIN/supervision.registry.yaml\""
ok "aucun avertissement de worktree"                             "! echo \"\$OUT1\" | grep -q 'copie d.un worktree'"
ok "le conseil de redémarrer le daemon reste au dossier principal" "echo \"\$OUT1\" | grep -q 'redémarre le daemon'"

echo "R2 — depuis un worktree :"
git -C "$MAIN" checkout -q -- supervision.registry.yaml
OUT2="$(cd "$WT" && "$TSX" "$SCRIPT" projet-b "$TMP/projet-b")"
ok "le projet est inscrit dans la copie du worktree"   "grep -q 'id: projet-b' \"\$WT/supervision.registry.yaml\""
ok "le fichier écrit (celui du worktree) est imprimé"  "echo \"\$OUT2\" | grep -q \"fichier écrit : \$WT/supervision.registry.yaml\""
ok "l'avertissement dit de committer et merger"        "echo \"\$OUT2\" | grep -q 'committe-la et merge-la'"
ok "pas de conseil de redémarrer le daemon depuis un worktree" "! echo \"\$OUT2\" | grep -q 'redémarre le daemon'"
ok "le registre du dossier principal reste intact"     "[ -z \"\$(git -C \"\$MAIN\" status --porcelain)\" ]"

echo
if [ "$FAIL" = 0 ]; then echo "test-supervision-registry-add: TOUT VERT"; else echo "test-supervision-registry-add: ÉCHECS"; exit 1; fi
