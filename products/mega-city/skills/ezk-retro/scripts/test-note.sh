#!/usr/bin/env bash
# DoD exécutable de la fiche 20261003105820077 — le carnet de rétro hors de git.
#
# Ce que ces cas verrouillent :
#   N1  `add` dépose une note sous `<git-common-dir>/ezk/retro-notes/`, sans commit ni PR,
#       au format du carnet versionné (front-matter date / session / type) ;
#   N2  la note survit à `git worktree remove --force` du worktree qui l'a déposée ;
#   N3  `verse` la range dans le dépôt (la PR de rangement de la rétro la committe) ;
#   N4  refus : corps vide, titre manquant, type inconnu, note introuvable, carnet en lecture
#       seule (échec rapide, jamais une boucle sans fin) ;
#   N5  `ezk retro note` route bien vers ce script, et la note atterrit dans le dépôt du dossier
#       courant ;
#   N6  une INIT_CWD laissée par un pnpm parent ne détourne plus `ezk` vers un autre dépôt, et les
#       scripts qu'il lance lisent le vrai dossier ; lancé par pnpm, `ezk` la croit toujours
#       (fiche 20261004181110120 : chaque gate déposait une note parasite dans le vrai carnet).
set -euo pipefail

NOTE="$(cd "$(dirname "$0")" && pwd)/note.sh"
EZK="$(cd "$(dirname "$0")/../../.." && pwd)/bin/ezk.mjs"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
FAIL=0
ok() { if eval "$2"; then echo "  ok — $1"; else echo "  ÉCHEC — $1"; FAIL=1; fi; }

cd "$TMP" && git init -q -b main repo && cd repo
git config user.email t@t && git config user.name t && git config commit.gpgsign false
mkdir -p features && echo "# Backlog" > features/README.md
echo x > a.txt && git add . && git commit -qm base
git worktree add -q "$TMP/wt-a" -b a && git worktree add -q "$TMP/wt-b" -b b
DIR="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)/ezk/retro-notes"

echo "N1 — add dépose la note hors de git, sans commit :"
P="$(cd "$TMP/wt-a" && printf 'Le portier a dit durable=1 à tort.\n' | bash "$NOTE" add "Note perdue avec le worktree" --type problème)"
ok "écrite sous git-common-dir/ezk/retro-notes/" "[ \"\$(dirname \"\$P\")\" = \"\$DIR\" ]"
ok "nom <id 17 chiffres>-<slug>.md"              "basename \"\$P\" | grep -qE '^[0-9]{17}-note-perdue-avec-le-worktree\\.md\$'"
ok "front-matter : date, session, type"          "grep -q '^date: ' \"\$P\" && grep -q '^session: \"a / wt-a\"' \"\$P\" && grep -q '^type: problème' \"\$P\""
ok "porte le titre et le corps"                  "grep -q '^# Note perdue avec le worktree' \"\$P\" && grep -q 'durable=1 à tort' \"\$P\""
ok "type par défaut : friction"                  "(cd \"\$TMP/wt-a\" && echo corps | bash \"\$NOTE\" add 'sans type') | xargs grep -q '^type: friction'"
ok "aucun commit créé"                           "[ \"\$(git -C \"\$TMP/wt-a\" rev-list --count HEAD)\" = 1 ]"
ok "le worktree reste propre"                    "[ -z \"\$(git -C \"\$TMP/wt-a\" status --porcelain)\" ]"

echo "N2 — la note survit à la suppression forcée du worktree :"
echo sale > "$TMP/wt-a/non-valide.txt"
git worktree remove --force "$TMP/wt-a"
ok "list la voit depuis un autre worktree"       "(cd \"\$TMP/wt-b\" && bash \"\$NOTE\" list) | grep -q 'note-perdue-avec-le-worktree'"
ok "list compte 2 notes"                         "[ \"\$(cd \"\$TMP/wt-b\" && bash \"\$NOTE\" list | wc -l | tr -d ' ')\" = 2 ]"

echo "N3 — verse range la note dans le dépôt, pour la PR de rangement :"
NAME="$(basename "$P")"
(cd "$TMP/wt-b" && bash "$NOTE" verse docs/retro-notes/traitees "$NAME" >/dev/null)
ok "la note est dans docs/retro-notes/traitees/" "[ -f \"\$TMP/wt-b/docs/retro-notes/traitees/\$NAME\" ]"
ok "elle a quitté le carnet hors git"            "! (cd \"\$TMP/wt-b\" && bash \"\$NOTE\" list) | grep -q \"\$NAME\""
ok "l'autre note reste en attente"               "[ \"\$(cd \"\$TMP/wt-b\" && bash \"\$NOTE\" list | wc -l | tr -d ' ')\" = 1 ]"

echo "N4 — refus :"
ok "corps vide ⇒ exit 2"        "! (cd \"\$TMP/wt-b\" && printf '  \n' | bash \"\$NOTE\" add titre) >/dev/null 2>&1"
ok "titre manquant ⇒ exit 2"    "! (cd \"\$TMP/wt-b\" && echo corps | bash \"\$NOTE\" add) >/dev/null 2>&1"
ok "type inconnu ⇒ exit 2"      "! (cd \"\$TMP/wt-b\" && echo corps | bash \"\$NOTE\" add titre --type nawak) >/dev/null 2>&1"
ok "note introuvable ⇒ exit 1"  "! (cd \"\$TMP/wt-b\" && bash \"\$NOTE\" verse docs/x absente.md) >/dev/null 2>&1"
ok "verse sans note ⇒ exit 2"   "! (cd \"\$TMP/wt-b\" && bash \"\$NOTE\" verse docs/x) >/dev/null 2>&1"
ok "hors dépôt ⇒ exit 2"        "! (cd \"\$TMP\" && echo corps | bash \"\$NOTE\" add titre) >/dev/null 2>&1"
ok "--root sans dossier ⇒ exit 2" "! (cd \"\$TMP/wt-b\" && echo corps | bash \"\$NOTE\" --root '' add titre) >/dev/null 2>&1"
chmod 555 "$DIR"
ok "carnet en lecture seule ⇒ échec rapide, pas de boucle" \
   "( cd \"\$TMP/wt-b\" && echo corps | bash \"\$NOTE\" add titre >/dev/null 2>&1 ); [ \$? = 1 ]"
chmod 755 "$DIR"

echo "N5 — ezk retro note route vers ce script, et la note atterrit dans le dépôt courant :"
MEGA="$(cd "$(dirname "$EZK")/.." && pwd -P)"
if [[ -f "$EZK" ]] && [[ -d "$MEGA/node_modules/tsx" ]]; then
  OUTE="$(cd "$TMP/wt-b" && echo 'via ezk' | node "$EZK" retro note "Depuis la commande ezk" 2>/dev/null)"
  ok "la note est déposée par ezk retro note" "echo \"\$OUTE\" | grep -q 'depuis-la-commande-ezk\\.md\$' && [ -f \"\$(echo \"\$OUTE\" | tail -1)\" ]"
  ok "dans le carnet du dépôt du test, pas ailleurs" "[ \"\$(dirname \"\$(echo \"\$OUTE\" | tail -1)\")\" = \"\$DIR\" ]"

  echo "N6 — une INIT_CWD laissée par un pnpm parent ne détourne plus ezk :"
  cd "$TMP" && git init -q -b main autre && cd autre
  git config user.email t@t && git config user.name t && git config commit.gpgsign false
  mkdir -p features .vectorz && echo "# Backlog" > features/README.md && printf 'github: false\n' > .vectorz/config.yml
  git add . && git commit -qm base
  AUTRE="$(pwd -P)"
  AUTRE_DIR="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)/ezk/retro-notes"
  # La fuite rejouée : le pnpm parent a noté un autre dossier, puis le test s'est placé dans le sien.
  OUTF="$(cd "$TMP/wt-b" && echo 'fuite' | INIT_CWD="$AUTRE" npm_package_json="$MEGA/package.json" node "$EZK" retro note "Fuite rejouee" 2>/dev/null)"
  ok "la note va dans le dépôt du dossier courant" "[ \"\$(dirname \"\$(echo \"\$OUTF\" | tail -1)\")\" = \"\$DIR\" ]"
  ok "rien dans l'autre dépôt"                     "[ ! -d \"\$AUTRE_DIR\" ]"
  OUTC="$(cd "$TMP/wt-b" && INIT_CWD="$AUTRE" npm_package_json="$MEGA/package.json" node "$EZK" config . 2>/dev/null)"
  ok "les scripts lancés lisent le vrai dossier, pas la variable périmée" "echo \"\$OUTC\" | grep -q \"Config projet    : \$(cd \"\$TMP/wt-b\" && pwd -P)/\""
  # Le vrai cas pnpm : le dossier courant est celui du package.json, INIT_CWD dit où l'on avait tapé.
  OUTP="$(cd "$MEGA" && echo 'pnpm' | INIT_CWD="$AUTRE" npm_package_json="$MEGA/package.json" node "$EZK" retro note "Lance par pnpm" 2>/dev/null)"
  ok "lancé par pnpm, ezk croit toujours INIT_CWD" "[ \"\$(dirname \"\$(echo \"\$OUTP\" | tail -1)\")\" = \"\$AUTRE_DIR\" ]"
else
  echo "  (sauté : dépendances de mega-city absentes, lance pnpm install)"
fi

echo
if [ "$FAIL" = 0 ]; then echo "test-note: TOUT VERT"; else echo "test-note: ÉCHECS"; exit 1; fi
