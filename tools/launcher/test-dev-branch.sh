#!/usr/bin/env bash
# Suite du lanceur universel (fiche 20260917162000501) : un projet-jouet JETABLE (un mini serveur
# Node), deux branches, un second worktree, et un faux process « étranger » pour prouver qu'on ne
# tue jamais ce qu'on n'a pas lancé. Hermétique : aucun réseau, aucun autre projet de la machine.
set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd -P)"
PASS=0; FAIL=0
ok() { PASS=$((PASS + 1)); printf '  ok   %s\n' "$1"; }
ko() { FAIL=$((FAIL + 1)); printf '  FAIL %s\n' "$1"; }
expect() { # expect "description" <commande…> : ok si la commande réussit
  local d="$1"; shift
  if "$@" >/dev/null 2>&1; then ok "$d"; else ko "$d"; fi
}
expect_not() { local d="$1"; shift; if "$@" >/dev/null 2>&1; then ko "$d"; else ok "$d"; fi; }
has() { case "$2" in *"$1"*) return 0;; *) return 1;; esac; } # has "aiguille" "botte de foin"

export GIT_AUTHOR_NAME=t GIT_AUTHOR_EMAIL=t@t GIT_COMMITTER_NAME=t GIT_COMMITTER_EMAIL=t@t
WORK="$(cd "$(mktemp -d)" && pwd -P)"
TOY="$WORK/toy"; WT="$WORK/toy-wt"
BASE=$((30000 + ($$ % 2000) * 10))
FOREIGN_PID=''

cleanup() {
  ( cd "$TOY" 2>/dev/null && bash scripts/dev-branch.sh stop --all >/dev/null 2>&1 )
  local f
  for f in "$TOY"/.vectorz/run/*/pid; do [ -f "$f" ] && kill -TERM -- "-$(cat "$f")" 2>/dev/null; done
  [ -z "$FOREIGN_PID" ] || kill "$FOREIGN_PID" 2>/dev/null
  rm -rf "$WORK"
}
trap cleanup EXIT

L()  { ( cd "$TOY" && bash scripts/dev-branch.sh "$@" ); }
LW() { ( cd "$WT" && bash scripts/dev-branch.sh "$@" ); }
field() { sed -n "s/^$1: //p" | head -n 1; }
get() { curl -fsS --max-time 3 "$1" 2>/dev/null; }

echo "== Installation dans un projet-jouet"
mkdir -p "$TOY" && cd "$TOY" || exit 1
git init -q -b main .
cat > server.js <<'JS'
const http = require('http'), fs = require('fs');
http.createServer((q, r) => r.end(fs.readFileSync('BRANCH.txt', 'utf8').trim() + '|' + (process.env.TOY_MODE || 'web') + '|' + (process.env.VZ_STATE_DIR || ''))).listen(+process.env.PORT, '127.0.0.1');
JS
printf 'main\n' > BRANCH.txt
printf '.env\nnode_modules/\n' > .gitignore
printf '{\n  "name": "toy",\n  "scripts": {\n    "start": "node server.js"\n  }\n}\n' > package.json
printf 'SECRET=hunter2-ne-doit-jamais-sortir\n' > .env
git add -A && git commit -qm init

out="$(bash "$HERE/install.sh" "$TOY" 2>&1)"
expect "le script est posé et exécutable" test -x "$TOY/scripts/dev-branch.sh"
expect "la déclaration est créée" test -f "$TOY/scripts/dev-branch.conf"
expect "package.json reste du JSON valide avec l'entrée dev:branch" node -e 'const p=require(process.argv[1]);if(p.scripts["dev:branch"]!=="bash scripts/dev-branch.sh"||p.scripts.start!=="node server.js")process.exit(1)' "$TOY/package.json"
expect ".gitignore ignore l'état d'exécution" git check-ignore -q .vectorz/run/x
expect ".gitignore ignore les arbres de run" git check-ignore -q .worktrees/x
out2="$(bash "$HERE/install.sh" "$TOY" 2>&1)"
has "script: à jour" "$out2" && [ "$(grep -c '^\.vectorz/run/$' .gitignore)" = 1 ] && ok "seconde installation : idempotente (rien de dupliqué)" || ko "seconde installation : idempotente"
expect "--check : rien à signaler après installation" bash "$HERE/install.sh" --check "$TOY"
echo "# bricolage local" >> "$TOY/scripts/dev-branch.sh"
expect_not "--check : signale une copie qui a dérivé" bash "$HERE/install.sh" --check "$TOY"
bash "$HERE/install.sh" "$TOY" >/dev/null 2>&1
expect "la mise à jour rétablit la copie" cmp -s "$HERE/dev-branch.sh" "$TOY/scripts/dev-branch.sh"
if ! env PATH=/usr/bin:/bin sh -c 'command -v node' >/dev/null 2>&1; then # sans node : l'entrée est reconnue par grep
  expect "--check sans node : l'entrée présente est reconnue" env PATH=/usr/bin:/bin bash "$HERE/install.sh" --check "$TOY"
  cp "$TOY/package.json" "$WORK/package.json.bak"; sed -i.bak 's/"dev:branch"/"x:y"/' "$TOY/package.json"; rm -f "$TOY/package.json.bak"
  expect_not "--check sans node : une entrée absente est une dérive (code 1)" env PATH=/usr/bin:/bin bash "$HERE/install.sh" --check "$TOY"
  cp "$WORK/package.json.bak" "$TOY/package.json"
fi
if [ -f "$HERE/../../scripts/dev-branch.sh" ]; then
  expect "la copie installée dans vectorz lui-même n'a pas dérivé" cmp -s "$HERE/dev-branch.sh" "$HERE/../../scripts/dev-branch.sh"
fi

echo "== Le lanceur ne devine rien"
out="$(L start feat/a 2>&1)"; rc=$?
[ "$rc" = 1 ] && has "DEV_START vide" "$out" && ok "déclaration vide : refus qui dit quoi remplir (code 1)" || ko "déclaration vide : refus (rc=$rc)"
out="$(L doctor 2>&1)"; rc=$?
[ "$rc" = 1 ] && has "start -> node server.js" "$out" && ok "doctor propose les candidats sans en choisir un" || ko "doctor : candidats (rc=$rc)"
expect_not "aucun arbre de run créé par un refus" test -d "$TOY/.worktrees"

cat > "$TOY/scripts/dev-branch.conf" <<EOF
DEV_START='node server.js'
DEV_START__alt='sh -c "TOY_MODE=alt node server.js & wait"'
DEV_START__boom='exit 3'
DEV_STOP='echo "\$VZ_STACK" >> $WORK/hook.log'
DEV_STATE=''
DEV_ISOLATION='port propre à la branche ; non isolé : le dépôt (lu seulement)'
DEV_PORT_BASE=$BASE
DEV_RESERVED_PORTS='$((BASE + 1))'
DEV_DEPS=none
DEV_WAIT=20
EOF
out="$(L start 2>&1)"; rc=$?
[ "$rc" = 1 ] && has "DEV_STATE vide" "$out" && ok "état de départ vide : refus (« sans objet » est accepté, le vide non)" || ko "DEV_STATE vide (rc=$rc)"
sed -i.bak "s|^DEV_STATE=''|DEV_STATE='sans objet — le jouet ne garde aucune donnée'|" "$TOY/scripts/dev-branch.conf" && rm -f "$TOY/scripts/dev-branch.conf.bak"
out="$(L doctor 2>&1)"; rc=$?
[ "$rc" = 0 ] && has "OK : la déclaration est complète" "$out" && ok "doctor : déclaration complète" || ko "doctor complet (rc=$rc)"

# On fige le lanceur et la déclaration dans le projet-jouet, puis on crée une branche et un second worktree.
git add -A && git commit -qm "chore: lanceur"
git checkout -q -b feat/a && printf 'feat-a\n' > BRANCH.txt && git commit -qam a && git checkout -q main
git checkout -q -b broken && sed -i.bak "s|^DEV_START='node server.js'|DEV_START=''|" scripts/dev-branch.conf && rm -f scripts/dev-branch.conf.bak && git commit -qam broken && git checkout -q main
git worktree add -q -b wip "$WT" main && printf 'wip\n' > "$WT/BRANCH.txt"

echo "== Ports : jamais un port réservé, jamais un port occupé, jamais un process étranger tué"
node -e 'require("http").createServer((q,r)=>r.end("foreign")).listen(+process.argv[1],"127.0.0.1")' "$BASE" &
FOREIGN_PID=$!; disown "$FOREIGN_PID"
for _ in 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20; do [ "$(get "http://127.0.0.1:$BASE/")" = foreign ] && break; sleep 0.2; done

echo "== Lancer l'arbre courant"
out="$(L start 2>&1)"; rc=$?
URL_MAIN="$(printf '%s\n' "$out" | field url)"; PORT_MAIN="$(printf '%s\n' "$out" | field port)"
[ "$rc" = 0 ] && ok "start : code 0" || ko "start : code $rc ($out)"
[ "$PORT_MAIN" = "$((BASE + 2))" ] && ok "port : saute l'occupé ($BASE) et le réservé ($((BASE + 1)))" || ko "port attendu $((BASE + 2)), reçu '$PORT_MAIN'"
R="$(get "$URL_MAIN")"
has "main|web|" "$R" && ok "l'app répond avec la bonne branche" || ko "réponse inattendue : $R"
out="$(L start 2>&1)"
has "déjà lancé" "$out" && [ "$(printf '%s\n' "$out" | field port)" = "$PORT_MAIN" ] && ok "relancer le même stack : réutilisé, pas de doublon" || ko "relance : $out"
PID_MAIN="$(cat "$TOY"/.vectorz/run/*/pid | head -n 1)"
[ "$(ps -o pgid= -p "$PID_MAIN" | tr -d ' ')" = "$PID_MAIN" ] && ok "le process est chef de son propre groupe (arrêt ciblable)" || ko "pas de groupe propre"
has "actif" "$(L list)" && ok "list : le stack est actif" || ko "list"

echo "== Lancer une autre branche, depuis n'importe où"
out="$(L start feat/a 2>&1)"; rc=$?
URL_A="$(printf '%s\n' "$out" | field url)"; TREE_A="$(printf '%s\n' "$out" | field arbre | sed 's/ (arbre de run dédié)//')"
[ "$rc" = 0 ] && has "feat-a|web|" "$(get "$URL_A")" && ok "feat/a : arbre de run dédié, bonne branche servie" || ko "feat/a ($rc) $out"
has "$TOY/.worktrees/run-feat-a-" "$TREE_A" && ok "l'arbre de run vit dans le dossier déclaré (ignoré par git)" || ko "arbre : $TREE_A"
[ "$(printf '%s\n' "$out" | field port)" = "$((BASE + 3))" ] && ok "second stack : port suivant, sans collision" || ko "port du second stack"
expect ".env copié dans l'arbre de run (la copie existe et est identique)" cmp -s "$TOY/.env" "$TREE_A/.env"
all="$out$(L list 2>&1)$(L doctor 2>&1)$(cat "$TOY"/.vectorz/run/feat-a-*/run.log 2>/dev/null)"
has "hunter2" "$all" && ko "le .env a fuité (start, list, doctor ou journal)" || ok "les valeurs du .env ne sont jamais affichées (start, list, doctor, journal)"
out="$(LW start 2>&1)"; rc=$?
[ "$rc" = 0 ] && has "wip|web|" "$(get "$(printf '%s\n' "$out" | field url)")" && ok "depuis un autre worktree : lance SA branche (wip)" || ko "wip ($rc) $out"
expect ".env copié aussi dans un worktree ordinaire" cmp -s "$TOY/.env" "$WT/.env"
has "[wip]" "$(L list)" && ok "list voit les stacks de tous les worktrees (état au dépôt commun)" || ko "list/wip"
S1="$(printf '%s' "$R" | cut -d'|' -f3)"; S2="$(get "$URL_A" | cut -d'|' -f3)"
[ -n "$S1" ] && [ -n "$S2" ] && [ "$S1" != "$S2" ] && ok "VZ_STATE_DIR : un dossier d'état distinct par stack" || ko "états : '$S1' '$S2'"

echo "== Variante nommée et groupe de process"
out="$(L start --as alt 2>&1)"; rc=$?
URL_ALT="$(printf '%s\n' "$out" | field url)"
[ "$rc" = 0 ] && has "main|alt|" "$(get "$URL_ALT")" && ok "--as alt : autre commande, autre stack, même branche" || ko "alt ($rc) $out"
L stop --as alt >/dev/null 2>&1
expect_not "stop de la variante ferme son port (même quand l'app est un enfant du lanceur)" get "$URL_ALT"
expect "…et laisse le stack par défaut tranquille" get "$URL_MAIN"
out="$(L start --as boom 2>&1)"; rc=$?
[ "$rc" = 4 ] && ok "app morte au démarrage : code 4, pas de stack fantôme" || ko "boom : code $rc"

echo "== Arrêt ciblé"
L stop feat/a >/dev/null 2>&1
expect_not "stop feat/a : son port est fermé" get "$URL_A"
expect "…le stack de main continue" get "$URL_MAIN"
[ "$(get "http://127.0.0.1:$BASE/")" = foreign ] && ok "…et le process étranger n'a pas été touché" || ko "process étranger tué"
expect "l'arbre de run est conservé sans --remove" test -d "$TREE_A"
has "feat-a" "$(cat "$WORK/hook.log" 2>/dev/null)" && ok "DEV_STOP exécuté (nettoyage déclaré par le projet)" || ko "hook DEV_STOP"
out="$(L stop feat/a 2>&1)"; has "rien à arrêter" "$out" && ok "double stop : sans effet" || ko "double stop : $out"

out="$(L start --as alt --port "$BASE" 2>&1)"; rc=$?
[ "$rc" = 2 ] && has "occupé" "$out" && [ "$(get "http://127.0.0.1:$BASE/")" = foreign ] && ok "--port occupé : refus (code 2), le process étranger survit" || ko "--port occupé ($rc)"

L start feat/a >/dev/null 2>&1; touch "$TREE_A/sale.txt"
out="$(L stop feat/a --remove 2>&1)"
has "conservé" "$out" && test -d "$TREE_A" && ok "--remove refuse de jeter un arbre modifié" || ko "--remove sur arbre sale : $out"
rm -f "$TREE_A/sale.txt"; L start feat/a >/dev/null 2>&1
L stop feat/a --remove >/dev/null 2>&1
expect_not "--remove supprime un arbre de run propre" test -d "$TREE_A"

echo "== Un pid recyclé n'est jamais tué"
L start feat/a >/dev/null 2>&1
REAL="$(cat "$TOY"/.vectorz/run/feat-a-*/pid)"
sleep 300 & SLEEPER=$!; disown "$SLEEPER"
printf '%s\n' "$SLEEPER" > "$TOY"/.vectorz/run/feat-a-*/pid; printf 'signature-bidon\n' > "$TOY"/.vectorz/run/feat-a-*/sig
out="$(L stop feat/a 2>&1)"
kill -0 "$SLEEPER" 2>/dev/null && has "déjà arrêté" "$out" && ok "signature différente : le pid n'est pas le nôtre, rien n'est tué" || ko "pid recyclé tué ? $out"
kill "$SLEEPER" 2>/dev/null; kill -TERM -- "-$REAL" 2>/dev/null

echo "== Refus : branche inconnue, déclaration de la branche incomplète, port réservé, variante invalide"
out="$(L start nexiste-pas 2>&1)"; rc=$?
[ "$rc" = 1 ] && has "branche inconnue" "$out" && ok "branche inconnue : refus net" || ko "branche inconnue ($rc)"
out="$(L start broken 2>&1)"; rc=$?
[ "$rc" = 1 ] && has "déclaration de la branche est incomplète" "$out" && ok "branche à déclaration incomplète : refus (code 1)" || ko "broken ($rc) $out"
[ -z "$(ls "$TOY/.worktrees" 2>/dev/null | grep broken)" ] && ! has "run-broken" "$(cd "$TOY" && git worktree list)" && ok "…et l'arbre de run créé pour l'occasion est retiré (aucun orphelin)" || ko "arbre de run orphelin après refus"
out="$(L start --as alt --port "$((BASE + 1))" 2>&1)"; rc=$?
[ "$rc" = 2 ] && has "réservé" "$out" && ok "--port réservé : refus (code 2)" || ko "--port réservé ($rc) $out"
out="$(L stop x --as '../../y' 2>&1)"; rc=$?
[ "$rc" = 1 ] && has "variante invalide" "$out" && ok "variante invalide refusée aussi à l'arrêt" || ko "variante invalide à stop ($rc) $out"

echo "== Arrêt général"
L stop --all >/dev/null 2>&1
expect_not "stop --all : main arrêté" get "$URL_MAIN"
[ "$(get "http://127.0.0.1:$BASE/")" = foreign ] && ok "stop --all : le process étranger survit" || ko "stop --all a tué un étranger"
has "aucun stack" "$(L list)" && ok "list : plus rien" || ko "list vide"

echo
if [ "$FAIL" = 0 ]; then echo "lanceur universel : $PASS contrôles, TOUT VERT"; exit 0; fi
echo "lanceur universel : $FAIL en échec sur $((PASS + FAIL))"; exit 1
