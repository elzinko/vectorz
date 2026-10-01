#!/usr/bin/env bash
# vectorz-launcher v1
# Lance l'app d'une branche depuis n'importe quel worktree du projet.
#
# FICHIER INSTALLÉ par vectorz (tools/launcher/install.sh) : ne l'édite pas ici, la prochaine
# mise à jour l'écraserait. Ce qui est propre au projet vit dans scripts/dev-branch.conf.
#
#   dev-branch.sh [start] [<branche>] [--as <variante>] [--port N] [--open]
#   dev-branch.sh stop [<branche> | --all] [--as <variante>] [--remove]
#   dev-branch.sh list
#   dev-branch.sh doctor
#
# Sans <branche> : l'arbre courant. Avec <branche> : l'arbre où elle est déjà extraite, sinon un
# arbre de run dédié (détaché, créé puis réutilisé). Ne devine jamais un port ni une commande :
# tout part de la déclaration du projet. Ne tue jamais un process qu'il n'a pas lancé lui-même.
# Codes : 0 ok · 1 refus ou usage · 2 port indisponible · 3 pas de réponse à temps (laissé en
# cours) · 4 mort au démarrage.
set -uo pipefail

say()  { printf '%s\n' "$*"; }
warn() { printf '%s\n' "$*" >&2; }
die()  { warn "erreur: $1"; exit "${2:-1}"; }
abs()  { ( cd "$1" 2>/dev/null && pwd -P ); }

command -v git >/dev/null 2>&1 || die "git introuvable"
CALLER_TREE="$(git rev-parse --show-toplevel 2>/dev/null)" || die "pas dans un dépôt git"
CALLER_TREE="$(abs "$CALLER_TREE")"
COMMON="$(abs "$(git rev-parse --git-common-dir 2>/dev/null)")"
if [ "$(basename "$COMMON")" = ".git" ]; then MAIN_ROOT="$(dirname "$COMMON")"; else MAIN_ROOT="$CALLER_TREE"; fi
RUN_DIR="$MAIN_ROOT/.vectorz/run"

# ── Déclaration du projet ────────────────────────────────────────────────────────────────
reset_decl() {
  local v
  for v in $(compgen -v DEV_START__); do unset "$v"; done
  DEV_START=''; DEV_STOP=''; DEV_STATE=''; DEV_ISOLATION=''
  DEV_PORT_BASE=4100; DEV_PORT_RANGE=200; DEV_RESERVED_PORTS=''; DEV_PORT_ENV=''
  DEV_URL_PATH='/'; DEV_ENV_FILES='.env'; DEV_DEPS='auto'; DEV_TREES_DIR='.worktrees'
  DEV_WAIT=60; DEV_CMD_HINT='bash scripts/dev-branch.sh'
}

# La déclaration de l'arbre cible gagne ; à défaut celle de l'arbre appelant, puis de l'arbre principal.
load_conf() {
  local c
  CONF=''
  for c in "$1/scripts/dev-branch.conf" "$CALLER_TREE/scripts/dev-branch.conf" "$MAIN_ROOT/scripts/dev-branch.conf"; do
    if [ -f "$c" ]; then reset_decl; CONF="$c"; . "$c"; return 0; fi # shellcheck disable=SC1090
  done
  reset_decl
  return 1
}

pick_start() { # $1 = variante ('' = défaut) → START_CMD
  START_CMD="$DEV_START"
  [ -n "${1:-}" ] || return 0
  case "$1" in *[!A-Za-z0-9_-]*) die "nom de variante invalide : « $1 »";; esac
  eval "START_CMD=\${DEV_START__$(printf '%s' "$1" | tr '-' '_'):-}"
  [ -n "$START_CMD" ] || die "variante « $1 » non déclarée (DEV_START__$1 dans ${CONF:-scripts/dev-branch.conf})"
}

# Les emplacements obligatoires. Rien n'est deviné : un vide = un refus qui dit quoi remplir.
decl_problems() {
  PROBLEMS=''
  [ -n "$CONF" ] || { PROBLEMS="- aucune déclaration (scripts/dev-branch.conf) : installe-la avec tools/launcher/install.sh de vectorz"; return 1; }
  [ -n "$START_CMD" ] || PROBLEMS="$PROBLEMS
- DEV_START vide : dis comment lancer l'app (une commande, qui lit \$PORT)"
  [ -n "$DEV_STATE" ] || PROBLEMS="$PROBLEMS
- DEV_STATE vide : dis ce que « état neuf » veut dire ici (« sans objet — raison » est accepté)"
  [ -n "$DEV_ISOLATION" ] || PROBLEMS="$PROBLEMS
- DEV_ISOLATION vide : dis ce qui est isolé ET ce qui ne l'est pas"
  case "$DEV_PORT_BASE" in ''|*[!0-9]*) PROBLEMS="$PROBLEMS
- DEV_PORT_BASE doit être un nombre";; esac
  [ -z "$PROBLEMS" ]
}

# ── Identité d'un stack ──────────────────────────────────────────────────────────────────
hash6() { printf '%s' "$1" | { shasum -a 256 2>/dev/null || sha256sum 2>/dev/null || cksum; } | cut -c1-6; }
slug_of() { # feat/foo et feat-foo ne doivent pas se confondre : on ajoute un court hash du nom brut
  local base
  base="$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+//; s/-+$//')"
  base="${base:0:40}"; [ -n "$base" ] || base="branche"
  printf '%s-%s' "$base" "$(hash6 "$1")"
}
stack_id() { local i; i="$(slug_of "$1")"; [ -z "${2:-}" ] || i="$i.$2"; printf '%s' "$i"; }

current_branch() { # $1 = arbre
  local b
  b="$(git -C "$1" symbolic-ref --short -q HEAD 2>/dev/null)"
  [ -n "$b" ] || b="detached-$(git -C "$1" rev-parse --short HEAD 2>/dev/null)"
  printf '%s' "$b"
}

tree_of_branch() { # chemin de l'arbre où $1 est extraite (vide sinon)
  git -C "$MAIN_ROOT" worktree list --porcelain 2>/dev/null | awk -v b="refs/heads/$1" '
    /^worktree /{p=substr($0,10)} /^branch /{ if (substr($0,8)==b) { print p; exit } }'
}

trees_dir() { case "$DEV_TREES_DIR" in /*) printf '%s' "$DEV_TREES_DIR";; *) printf '%s' "$MAIN_ROOT/$DEV_TREES_DIR";; esac; }

resolve_target() { # $1 = <branche> ou vide → BRANCH TREE DEDICATED REF
  local arg="${1:-}" cur t r
  cur="$(current_branch "$CALLER_TREE")"; DEDICATED=0; REF=''
  if [ -z "$arg" ] || [ "$arg" = "$cur" ]; then BRANCH="$cur"; TREE="$CALLER_TREE"; return 0; fi
  BRANCH="$arg"
  t="$(tree_of_branch "$arg")"
  if [ -n "$t" ] && [ -d "$t" ]; then TREE="$(abs "$t")"; return 0; fi
  for r in "refs/heads/$arg" "refs/remotes/$arg" "refs/remotes/origin/$arg" "refs/tags/$arg"; do
    if git -C "$MAIN_ROOT" rev-parse --verify --quiet "$r^{commit}" >/dev/null 2>&1; then REF="$r"; break; fi
  done
  [ -n "$REF" ] || die "branche inconnue : « $arg » (ni locale, ni origin/…, ni tag) — fais un fetch si elle est distante"
  DEDICATED=1; TREE="$(trees_dir)/run-$(slug_of "$arg")"
}

prepare_tree() { # crée l'arbre de run dédié, ou le met à jour s'il est propre
  if [ -d "$TREE" ]; then
    if [ -n "$(git -C "$TREE" status --porcelain 2>/dev/null)" ]; then
      warn "  arbre de run modifié : lancé tel quel ($TREE)"
    elif git -C "$TREE" checkout -q --detach "$REF" 2>/dev/null; then
      say "  arbre de run mis à jour sur $REF"
    fi
  else
    mkdir -p "$(dirname "$TREE")"
    git -C "$MAIN_ROOT" worktree add --quiet --detach "$TREE" "$REF" >/dev/null 2>&1 || die "création de l'arbre de run impossible ($TREE)"
    say "  arbre de run créé : $TREE"
  fi
}

# ── Ports, processus ─────────────────────────────────────────────────────────────────────
port_busy() { # vrai si quelque chose écoute déjà
  local p="$1"
  if command -v lsof >/dev/null 2>&1 && lsof -nP -iTCP:"$p" -sTCP:LISTEN >/dev/null 2>&1; then return 0; fi
  ( exec 3<>"/dev/tcp/127.0.0.1/$p" ) 2>/dev/null
}

proc_sig() { ps -o lstart= -p "$1" 2>/dev/null | sed 's/^ *//; s/ *$//'; }

stack_alive() { # $1 = dossier du stack : le pid existe ET c'est bien le process qu'on a lancé
  local pid sig
  [ -f "$1/pid" ] || return 1
  pid="$(cat "$1/pid" 2>/dev/null)"; sig="$(cat "$1/sig" 2>/dev/null)"
  case "$pid" in ''|*[!0-9]*) return 1;; esac
  kill -0 "$pid" 2>/dev/null || return 1
  [ -n "$sig" ] && [ "$(proc_sig "$pid")" = "$sig" ]
}

live_stack_ports() {
  local s
  for s in "$RUN_DIR"/*/; do
    [ -f "${s}port" ] || continue
    if stack_alive "${s%/}"; then cat "${s}port"; fi
  done
}

pick_port() {
  local taken p end
  taken=" $DEV_RESERVED_PORTS $(live_stack_ports | tr '\n' ' ') "
  p="$DEV_PORT_BASE"; end=$((DEV_PORT_BASE + DEV_PORT_RANGE))
  while [ "$p" -le "$end" ]; do
    case "$taken" in *" $p "*) : ;; *) if ! port_busy "$p"; then printf '%s' "$p"; return 0; fi ;; esac
    p=$((p + 1))
  done
  return 1
}

kill_group() { # $1 = pid du chef de groupe (lancé avec set -m) : TERM, puis KILL si ça résiste
  local pid="$1" i=0
  kill -TERM -- "-$pid" 2>/dev/null || kill -TERM "$pid" 2>/dev/null
  while [ "$i" -lt 25 ] && kill -0 "$pid" 2>/dev/null; do sleep 0.2; i=$((i + 1)); done
  if kill -0 "$pid" 2>/dev/null; then kill -KILL -- "-$pid" 2>/dev/null || kill -KILL "$pid" 2>/dev/null; fi
  return 0
}

# ── Préparation de l'arbre : .env et dépendances ─────────────────────────────────────────
sync_env() { # copie depuis l'arbre principal les fichiers absents — jamais d'écrasement, jamais affichés
  local f
  [ "$TREE" != "$MAIN_ROOT" ] || return 0
  for f in $DEV_ENV_FILES; do
    [ -f "$MAIN_ROOT/$f" ] && [ ! -e "$TREE/$f" ] || continue
    if git -C "$TREE" check-ignore -q "$f" 2>/dev/null; then
      mkdir -p "$(dirname "$TREE/$f")"; cp -p "$MAIN_ROOT/$f" "$TREE/$f"
      say "  env : $f copié depuis l'arbre principal (valeurs non affichées)"
    else
      warn "  env : $f NON copié — git ne l'ignore pas dans cet arbre (ajoute-le au .gitignore)"
    fi
  done
}

ensure_deps() { # $1 = fichier journal
  local cmd="$DEV_DEPS" lock=''
  [ "$cmd" != "none" ] || return 0
  if [ "$cmd" = "auto" ]; then
    if   [ -f "$TREE/pnpm-lock.yaml" ];    then cmd='pnpm install --frozen-lockfile'; lock=pnpm-lock.yaml
    elif [ -f "$TREE/package-lock.json" ]; then cmd='npm ci';                         lock=package-lock.json
    elif [ -f "$TREE/yarn.lock" ];         then cmd='yarn install --frozen-lockfile'; lock=yarn.lock
    else return 0; fi
    if [ -d "$TREE/node_modules" ] && [ ! "$TREE/$lock" -nt "$TREE/node_modules" ]; then return 0; fi
  fi
  say "  deps : $cmd"
  ( cd "$TREE" && bash -c "$cmd" ) >>"$1" 2>&1 || { tail -n 15 "$1" >&2; die "installation des dépendances échouée (journal : $1)" 4; }
}

# ── Démarrage ────────────────────────────────────────────────────────────────────────────
write_meta() { # $1 = dossier du stack
  {
    printf 'BRANCH=%q\nTREE=%q\nDEDICATED=%q\nVARIANT=%q\nPORT=%q\nURL=%q\n' "$BRANCH" "$TREE" "$DEDICATED" "$VARIANT" "$PORT" "$URL"
    printf 'STATE=%q\nISOLATION=%q\nSTOPCMD=%q\nHINT=%q\n' "$DEV_STATE" "$DEV_ISOLATION" "$DEV_STOP" "$DEV_CMD_HINT"
  } >"$1/meta"
}

show_stack() { # $1 = dossier du stack
  ( . "$1/meta"
    say "branche: $BRANCH${VARIANT:+ (variante $VARIANT)}"
    if [ "$DEDICATED" = 1 ]; then say "arbre: $TREE (arbre de run dédié)"; else say "arbre: $TREE"; fi
    say "url: $URL"
    say "port: $PORT"
    say "état neuf: $STATE"
    say "isolation: $ISOLATION"
    say "journal: $1/run.log"
    say "arrêter: $HINT stop $BRANCH${VARIANT:+ --as $VARIANT}"
  )
}

wait_ready() { # $1 pid · $2 port · $3 secondes → 0 prêt · 3 délai dépassé · 4 mort
  local i=0 max=$(( $3 * 5 ))
  while [ "$i" -lt "$max" ]; do
    port_busy "$2" && return 0
    kill -0 "$1" 2>/dev/null || { port_busy "$2" && return 0; return 4; }
    sleep 0.2; i=$((i + 1))
  done
  return 3
}

open_url() { if command -v open >/dev/null 2>&1; then open "$1"; elif command -v xdg-open >/dev/null 2>&1; then xdg-open "$1" >/dev/null 2>&1; fi; }

cleanup_unlaunched() { # rien n'a été lancé (refus, port, dépendances) : on ne laisse pas de miettes
  if [ -n "${STACK_DIR:-}" ] && [ -d "$STACK_DIR" ] && [ ! -f "$STACK_DIR/pid" ]; then
    mv "$STACK_DIR/run.log" "$RUN_DIR/last-$(basename "$STACK_DIR").log" 2>/dev/null
    rm -rf "$STACK_DIR"
  fi
}

cmd_start() {
  local arg='' want_port='' do_open=0 S pid rc
  VARIANT=''; STACK_DIR=''
  trap cleanup_unlaunched EXIT
  while [ $# -gt 0 ]; do
    case "$1" in
      --as)   [ $# -ge 2 ] || die "--as attend un nom de variante"; VARIANT="$2"; shift 2;;
      --port) [ $# -ge 2 ] || die "--port attend un numéro"; want_port="$2"; shift 2;;
      --open) do_open=1; shift;;
      -*)     die "option inconnue : $1";;
      *)      [ -z "$arg" ] || die "une seule branche à la fois"; arg="$1"; shift;;
    esac
  done
  load_conf "$CALLER_TREE" || true
  pick_start "$VARIANT"
  decl_problems || { warn "refus : la déclaration du projet est incomplète$PROBLEMS"; exit 1; }
  resolve_target "$arg"
  S="$RUN_DIR/$(stack_id "$BRANCH" "$VARIANT")"
  if stack_alive "$S" && [ -f "$S/meta" ]; then say "déjà lancé :"; show_stack "$S"; return 0; fi

  [ "$DEDICATED" = 0 ] || prepare_tree
  if [ "$TREE" != "$CALLER_TREE" ]; then # la branche peut porter sa propre déclaration
    load_conf "$TREE" || true; pick_start "$VARIANT"
    decl_problems || { warn "refus : la déclaration de la branche est incomplète$PROBLEMS"; exit 1; }
  fi

  rm -rf "$S"; mkdir -p "$S/data"; STACK_DIR="$S"
  sync_env
  ensure_deps "$S/run.log"
  if [ -n "$want_port" ]; then
    case "$want_port" in ''|*[!0-9]*) die "--port attend un numéro";; esac
    port_busy "$want_port" && die "le port $want_port est déjà occupé (on ne tue jamais un process qu'on n'a pas lancé)" 2
    PORT="$want_port"
  else
    PORT="$(pick_port)" || die "aucun port libre entre $DEV_PORT_BASE et $((DEV_PORT_BASE + DEV_PORT_RANGE))" 2
  fi
  URL="http://127.0.0.1:$PORT$DEV_URL_PATH"
  printf '%s\n' "$PORT" >"$S/port"
  write_meta "$S"

  ( cd "$TREE" || exit 1
    set -m
    env PORT="$PORT" ${DEV_PORT_ENV:+"$DEV_PORT_ENV=$PORT"} VZ_PORT="$PORT" VZ_URL="$URL" VZ_STACK="$(basename "$S")" \
        VZ_BRANCH="$BRANCH" VZ_TREE="$TREE" VZ_STATE_DIR="$S/data" \
      nohup bash -c "$START_CMD" >>"$S/run.log" 2>&1 </dev/null &
    printf '%s\n' "$!" >"$S/pid"
  )
  pid="$(cat "$S/pid")"
  proc_sig "$pid" >"$S/sig"

  wait_ready "$pid" "$PORT" "$DEV_WAIT"; rc=$?
  if [ "$rc" = 4 ]; then
    warn "l'app est morte au démarrage — fin du journal :"; tail -n 15 "$S/run.log" >&2
    mv "$S/run.log" "$RUN_DIR/last-$(basename "$S").log" 2>/dev/null; rm -rf "$S"; exit 4
  fi
  show_stack "$S"
  if [ "$rc" = 3 ]; then warn "pas de réponse sur $URL après ${DEV_WAIT}s — laissé en cours (journal ci-dessus)"; exit 3; fi
  if [ "$do_open" = 1 ]; then open_url "$URL"; fi
  return 0
}

# ── Arrêt, liste, diagnostic ─────────────────────────────────────────────────────────────
stop_stack() { # $1 = dossier du stack · $2 = 1 pour retirer l'arbre de run dédié
  local S="$1" remove="$2"
  [ -f "$S/meta" ] || return 0
  ( . "$S/meta"
    id="$(basename "$S")"
    if [ -n "$STOPCMD" ]; then
      ( cd "$TREE" 2>/dev/null; env PORT="$PORT" VZ_PORT="$PORT" VZ_STACK="$id" VZ_BRANCH="$BRANCH" VZ_STATE_DIR="$S/data" bash -c "$STOPCMD" ) >>"$S/run.log" 2>&1 \
        || warn "  (DEV_STOP a échoué — on continue)"
    fi
    if stack_alive "$S"; then kill_group "$(cat "$S/pid")"; say "arrêté : $BRANCH (port $PORT)"
    else say "déjà arrêté : $BRANCH (port $PORT)"; fi
    if port_busy "$PORT"; then warn "  le port $PORT reste occupé par un process qui n'est pas le nôtre : non touché"; fi
    mv "$S/run.log" "$RUN_DIR/last-$id.log" 2>/dev/null; rm -rf "$S"
    if [ "$remove" = 1 ] && [ "$DEDICATED" = 1 ]; then
      if [ -n "$(git -C "$TREE" status --porcelain 2>/dev/null)" ]; then warn "  arbre de run modifié : conservé ($TREE)"
      elif git -C "$MAIN_ROOT" worktree remove "$TREE" >/dev/null 2>&1; then say "  arbre de run supprimé"
      else warn "  arbre de run non supprimé ($TREE)"; fi
    fi
  )
}

cmd_stop() {
  local arg='' all=0 remove=0 S n=0
  VARIANT=''
  while [ $# -gt 0 ]; do
    case "$1" in
      --as)     [ $# -ge 2 ] || die "--as attend un nom de variante"; VARIANT="$2"; shift 2;;
      --all)    all=1; shift;;
      --remove) remove=1; shift;;
      -*)       die "option inconnue : $1";;
      *)        [ -z "$arg" ] || die "une seule branche à la fois"; arg="$1"; shift;;
    esac
  done
  if [ "$all" = 1 ]; then
    for S in "$RUN_DIR"/*/; do [ -f "${S}meta" ] || continue; stop_stack "${S%/}" "$remove"; n=$((n + 1)); done
    [ "$n" -gt 0 ] || say "rien à arrêter pour ce projet."
    return 0
  fi
  [ -n "$arg" ] || arg="$(current_branch "$CALLER_TREE")"
  S="$RUN_DIR/$(stack_id "$arg" "$VARIANT")"
  [ -f "$S/meta" ] || { say "rien à arrêter pour « $arg »."; return 0; }
  stop_stack "$S" "$remove"
}

cmd_list() {
  local s n=0 st
  for s in "$RUN_DIR"/*/; do
    [ -f "${s}meta" ] || continue
    st=mort; if stack_alive "${s%/}"; then st=actif; fi
    ( . "${s}meta"; printf '%-6s %-5s %s  [%s%s]  %s\n' "$st" "$PORT" "$URL" "$BRANCH" "${VARIANT:+ --as $VARIANT}" "$TREE" )
    n=$((n + 1))
  done
  [ "$n" -gt 0 ] || say "aucun stack lancé pour ce projet."
}

cmd_doctor() {
  local v
  VARIANT=''
  load_conf "$CALLER_TREE" || true
  pick_start ''
  say "projet: $MAIN_ROOT"
  say "déclaration: ${CONF:-(aucune)}"
  if decl_problems; then
    say "start: $START_CMD"
    for v in $(compgen -v DEV_START__); do say "variante ${v#DEV_START__}: $(eval "printf '%s' \"\${$v}\"")"; done
    say "état neuf: $DEV_STATE"
    say "isolation: $DEV_ISOLATION"
    say "ports: à partir de $DEV_PORT_BASE (réservés : ${DEV_RESERVED_PORTS:-aucun})"
    say "arbres de run: $(trees_dir)"
    say "OK : la déclaration est complète."
    return 0
  fi
  say "INCOMPLET :$PROBLEMS"
  if [ -f "$CALLER_TREE/package.json" ] && command -v node >/dev/null 2>&1; then
    say "scripts qui ressemblent à un serveur de dev (candidats — rien n'est deviné, choisis et déclare) :"
    node -e 'const s=(require(process.argv[1]).scripts)||{};Object.keys(s).filter(k=>/^(dev|start|serve)(:|$)/.test(k)).forEach(k=>console.log("  - "+k+" -> "+s[k]))' "$CALLER_TREE/package.json" 2>/dev/null
  fi
  return 1
}

usage() { sed -n '2,15p' "$0" | sed 's/^# \{0,1\}//'; }

sub="${1:-start}"
case "$sub" in
  start)       shift; cmd_start "$@";;
  stop)        shift; cmd_stop "$@";;
  list)        cmd_list;;
  doctor)      cmd_doctor;;
  help|-h|--help) usage;;
  *)           cmd_start "$@";; # `dev-branch.sh feat/x` = `dev-branch.sh start feat/x`
esac
