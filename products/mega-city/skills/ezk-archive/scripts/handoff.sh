#!/usr/bin/env bash
# ezk-archive — LE RANGEUR de la note de handoff.
#
# Pourquoi ce script existe (fiche 0088) : `.claude/handoff.md` était lu EN ENTIER par
# un LLM (20 Ko, deux fois par run : un `cat | head -400` puis un `Read`), puis réécrit
# par un `Edit`. Sa purge attendait qu'une entrée soit « ENTIÈREMENT résolue » — une
# condition qui dépend d'un événement EXTERNE : deux branches pending depuis six jours
# suffisaient à bloquer toute purge, donc le fichier ne faisait que grossir.
#
# On remplace ça par une borne qui ne dépend de rien : un ANNEAU FIFO de N entrées
# (EZK_HANDOFF_KEEP, défaut 3). Au-delà, la plus ancienne part en tête de
# `.claude/handoff.archive.md` — rien n'est jamais supprimé, mais le fichier vivant est
# stationnaire. ADR-0001 : le script range, le LLM rédige.
#
# Ce qui garantit qu'aucun report ne se perd malgré la rotation : `carry` remonte la
# section **Pending de l'entrée la plus récente. Le rédacteur écrit donc l'UNION de
#   - ce que `carry` lui rend (les pendings NON-git : billing, décisions PO, todos) et
#   - ce que `check.sh` lui donne (les pendings git, eux, sont recalculés à chaque run
#     depuis la source de vérité live — les recopier d'une entrée à l'autre les périmait).
#
# Usage :
#   handoff.sh path                    → chemin du fichier (le crée s'il manque)
#   handoff.sh carry                   → section **Pending de l'entrée la plus récente
#   handoff.sh add "<titre>" < corps   → insère l'entrée en tête, puis fait tourner l'anneau
#   handoff.sh durable "<titre>" < corps → écrit une COPIE VERSIONNÉE dans docs/sessions/
#   handoff.sh help
#
# `path` et `carry` sont read-only ; `add` et `durable` écrivent.
#
# Machine jetable (fiche 0189) : `.claude/handoff.md` est ignoré par git, donc perdu avec un
# conteneur de session cloud. `durable` écrit la même note dans
# docs/sessions/AAAA-MM-JJ-handoff-HHMMSS-<slug>.md : à committer ET pousser par l'humain
# (le script ne committe ni ne pousse jamais). L'heure sert à l'ordre : l'ordre des noms est
# l'ordre du temps. `carry` lit la plus récente des deux sources — la note locale ou la
# copie versionnée — pour qu'un nouveau clone retrouve le Pending.

set -uo pipefail

KEEP="${EZK_HANDOFF_KEEP:-3}"
CARRY_MAX=40                # borne de ce que `carry` rend au rédacteur

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2; exit 2
fi
ROOT="$(git rev-parse --show-toplevel)" || exit 2
FILE="$ROOT/.claude/handoff.md"
ARCHIVE="$ROOT/.claude/handoff.archive.md"

usage() { sed -n '2,40p' "$0" | sed 's/^# \{0,1\}//'; }

# `add` est un read-modify-write : on lit HEADER/REST, on compose un fichier temporaire,
# puis on le `mv` en place. Deux sessions parallèles (le PO travaille en worktrees) peuvent
# lire le MÊME instantané et le dernier `mv` écrase l'entrée de l'autre — une perte de
# données dans le scénario même que la persistance du handoff est censée couvrir
# (finding Codex PR #56). On sérialise donc le cycle complet.
#
# `mkdir` plutôt que `flock` : atomique sur tout POSIX, et présent partout — `flock` n'est
# pas livré avec macOS. Le verrou porte sur le dépôt (git-common-dir) pour couvrir les
# worktrees, qui partagent le fichier mais pas leur arborescence de travail.
LOCK=""
acquire_lock() {
  local common tries=0
  common="$(git -C "$ROOT" rev-parse --git-common-dir 2>/dev/null)"
  [[ "$common" != /* ]] && common="$ROOT/$common"
  LOCK="$common/ezk-handoff.lock"
  while ! mkdir "$LOCK" 2>/dev/null; do
    # Verrou périmé (session tuée avant de le rendre) : au-delà de 60 s, on le reprend.
    if [[ -d "$LOCK" ]] && [[ -n "$(find "$LOCK" -maxdepth 0 -mmin +1 2>/dev/null)" ]]; then
      rmdir "$LOCK" 2>/dev/null && continue
    fi
    tries=$((tries + 1))
    if (( tries > 100 )); then                     # ~10 s
      echo "✗ verrou du handoff occupé (${LOCK}) — rien écrit." >&2; exit 3
    fi
    sleep 0.1
  done
  trap 'rmdir "$LOCK" 2>/dev/null || true' EXIT INT TERM
}

ensure_gitignored() {
  # `.claude/handoff.md` est de l'ÉPHÉMÈRE PERSONNEL : jamais committé. On garantit
  # l'entrée .gitignore AVANT d'écrire, jamais après — sinon une session parallèle
  # pourrait committer le fichier entre l'écriture et l'ignore.
  #
  # On n'ignore QUE les deux fichiers du handoff, jamais `.claude/` en entier (fiche 0189) : ce
  # dossier peut être versionné (agents, skills, réglages du projet), et l'ignorer d'un bloc les
  # ferait disparaître de `git status`.
  local f missing=""
  for f in .claude/handoff.md .claude/handoff.archive.md; do
    git -C "$ROOT" check-ignore -q "$f" 2>/dev/null || missing="${missing}${f}"$'\n'
  done
  [[ -z "$missing" ]] && return 0
  { printf '\n# note de handoff ezk-archive — éphémère personnel, jamais committée\n'
    printf '%s' "$missing"; } >> "$ROOT/.gitignore"
  echo "ℹ .gitignore : handoff.md et handoff.archive.md ajoutés avant écriture." >&2
}

# mtime portable (voir test-check-gate.sh : `stat -f` est du BSD, mais sur GNU il veut dire --file-system).
if stat -c %Y . >/dev/null 2>&1; then mtime() { stat -c %Y "$1"; }   # GNU coreutils
else                                  mtime() { stat -f %m "$1"; }   # BSD / macOS
fi

SESSIONS_DIR="$ROOT/docs/sessions"

# La copie versionnée la plus récente. L'heure est dans le nom : l'ordre des noms est l'ordre du temps.
latest_durable() {
  ls -1 "$SESSIONS_DIR"/*-handoff-*.md 2>/dev/null | sort | tail -n 1
}

# La section **Pending d'un fichier de handoff, bornée (le rédacteur ne lit jamais le fichier entier).
carry_from() {
  awk '
    /^## / { if (started) exit; next }              # entrée suivante APRÈS la section = fin
    /^\*\*Pending/ { started=1; print; next }       # 1re section Pending rencontrée (= la + récente)
    started && /^\*\*/ { exit }                     # section suivante = fin
    started { print }
  ' "$1" | head -n "$CARRY_MAX"
}

# Slug du titre pour le nom de fichier : ASCII minuscule, tirets, 40 caractères au plus.
slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | LC_ALL=C sed 's/[^a-z0-9]\{1,\}/-/g; s/^-//; s/-$//' | cut -c1-40
}

ensure_file() {
  [[ -f "$FILE" ]] && return 0
  mkdir -p "$(dirname "$FILE")"
  {
    echo "# Handoff — $(basename "$ROOT")"
    echo
    echo "> Éphémère personnel (gitignoré). Append-only, entrée la plus récente en tête."
    echo "> Anneau FIFO : au-delà de $KEEP entrées, les plus anciennes passent dans handoff.archive.md."
    echo                                  # sépare l'en-tête de la 1ʳᵉ entrée (HEADER l'absorbe ensuite)
  } > "$FILE"
}

case "${1:-help}" in
  path)
    ensure_file
    echo "$FILE"
    ;;

  carry)
    # Read-only. Rend la section **Pending la PLUS RÉCENTE QUI EXISTE, bornée : le
    # rédacteur n'a jamais besoin de lire le fichier entier.
    #
    # ⚠ « la plus récente qui existe », et non « celle de la première entrée ». Trouvé en
    # dogfoodant la clôture : toutes les entrées ne portent pas de section Pending — une
    # note courte de correction, par exemple, n'en a pas. Se limiter à la première entrée
    # rendait alors du vide, et TOUS les reports non-git de l'entrée précédente étaient
    # perdus au tour suivant (ici : deux décisions PO en attente sur des branches, plus une
    # fiche reportée). Un rituel dont la raison d'être est de ne rien perdre ne peut pas
    # dépendre de la forme de la dernière entrée écrite.
    #
    # Deux sources (fiche 0189) : la note locale, ignorée par git, et la copie versionnée que
    # `durable` écrit sur une machine jetable. La plus récente (mtime) gagne : sur un nouveau clone
    # la note locale n'existe pas, la copie prend le relais ; sur un poste normal, la note locale
    # reste la source tant qu'aucune copie plus récente n'est arrivée par un `git pull`.
    SRC=""
    [[ -f "$FILE" ]] && SRC="$FILE"
    DUR="$(latest_durable)"
    if [[ -n "$DUR" && -f "$DUR" ]]; then
      if [[ -z "$SRC" ]] || (( $(mtime "$DUR") > $(mtime "$SRC") )); then SRC="$DUR"; fi
    fi
    [[ -n "$SRC" ]] || exit 0
    carry_from "$SRC"
    ;;

  durable)
    TITLE="${2:-}"
    if [[ -z "$TITLE" ]]; then echo "✗ handoff.sh durable « <titre> » — titre manquant." >&2; exit 2; fi
    BODY="$(cat)"
    if [[ -z "${BODY//[[:space:]]/}" ]]; then echo "✗ corps vide sur stdin — rien écrit." >&2; exit 2; fi
    mkdir -p "$SESSIONS_DIR"
    DAY="$(date +%F)"; HMS="$(date +%H%M%S)"; SLUG="$(slugify "$TITLE")"
    [[ -n "$SLUG" ]] || SLUG="note"
    # Jamais d'écrasement : en cas de collision on avance l'heure d'une seconde, pour que
    # l'ordre des noms reste l'ordre du temps (un suffixe `-2` se trierait AVANT `.md`).
    OUT="$SESSIONS_DIR/$DAY-handoff-$HMS-$SLUG.md"
    while [[ -e "$OUT" ]]; do
      HMS="$(printf '%06d' $(( 10#$HMS + 1 )))"
      OUT="$SESSIONS_DIR/$DAY-handoff-$HMS-$SLUG.md"
    done
    {
      printf '# Handoff — %s\n\n' "$TITLE"
      printf '> Copie versionnée (machine jetable). À committer ET pousser : sans cela, elle disparaît avec le conteneur.\n\n'
      printf '## %s\n\n' "$TITLE"
      printf '%s\n' "$BODY"
    } > "$OUT"
    echo "$OUT"
    ;;

  add)
    TITLE="${2:-}"
    if [[ -z "$TITLE" ]]; then echo "✗ handoff.sh add « <titre> » — titre manquant." >&2; exit 2; fi
    BODY="$(cat)"
    if [[ -z "${BODY//[[:space:]]/}" ]]; then echo "✗ corps vide sur stdin — rien écrit." >&2; exit 2; fi
    # Verrou pris AVANT la lecture : lire puis verrouiller laisserait la fenêtre de course
    # ouverte (deux sessions liraient le même instantané avant que l'une n'écrive).
    acquire_lock
    ensure_gitignored
    ensure_file

    HEADER="$(awk '/^## /{exit} {print}' "$FILE")"
    REST="$(awk '/^## /{f=1} f{print}' "$FILE")"
    TMPF="$(mktemp)"
    {
      printf '%s\n' "$HEADER"
      printf '## %s\n\n' "$TITLE"
      printf '%s\n' "$BODY"
      [[ -n "$REST" ]] && { echo; printf '%s\n' "$REST"; }
    } > "$TMPF"

    # --- rotation de l'anneau -------------------------------------------------
    N="$(grep -c '^## ' "$TMPF" || true)"
    if (( N > KEEP )); then
      KEPT="$(mktemp)"; OLD="$(mktemp)"
      awk -v keep="$KEEP" -v kf="$KEPT" -v of="$OLD" '
        /^## / { n++ }
        { if (n <= keep) print > kf; else print > of }
      ' "$TMPF"
      if [[ -s "$OLD" ]]; then
        # Même mécanique que le fichier vivant : en-tête stable, entrées sous l'en-tête,
        # la plus récemment sortie en premier. Rien n'est jamais supprimé.
        if [[ ! -f "$ARCHIVE" ]]; then
          {
            echo "# Handoff — archive (entrées sorties de l'anneau, les plus récentes en tête)"
            echo
          } > "$ARCHIVE"
        fi
        A_HEADER="$(awk '/^## /{exit} {print}' "$ARCHIVE")"
        A_REST="$(awk '/^## /{f=1} f{print}' "$ARCHIVE")"
        {
          printf '%s\n' "$A_HEADER"
          cat "$OLD"
          [[ -n "$A_REST" ]] && printf '%s\n' "$A_REST"
        } > "$ARCHIVE.new"
        mv "$ARCHIVE.new" "$ARCHIVE"
        echo "ℹ rotation : $(( N - KEEP )) entrée(s) déplacée(s) vers $(basename "$ARCHIVE")." >&2
      fi
      mv "$KEPT" "$TMPF"; rm -f "$OLD"
    fi

    mv "$TMPF" "$FILE"
    echo "$FILE"
    ;;

  help|-h|--help) usage ;;
  *) echo "✗ verbe inconnu « $1 » (path|carry|add|durable|help)" >&2; usage >&2; exit 2 ;;
esac
