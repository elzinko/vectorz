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
# `handoff.archive.md` — rien n'est jamais supprimé, mais le fichier vivant est
# stationnaire. ADR-0001 : le script range, le LLM rédige.
#
# Ce qui garantit qu'aucun report ne se perd malgré la rotation : `carry` remonte la
# section **Pending de l'entrée la plus récente. Le rédacteur écrit donc l'UNION de
#   - ce que `carry` lui rend (les pendings NON-git : billing, décisions PO, todos) et
#   - ce que `check.sh` lui donne (les pendings git, eux, sont recalculés à chaque run
#     depuis la source de vérité live — les recopier d'une entrée à l'autre les périmait).
#
# Usage :
#   handoff.sh where                   → chemin du fichier, sans rien créer
#   handoff.sh legacy                  → l'ancienne note du worktree, si elle reste à reprendre
#   handoff.sh path                    → chemin du fichier (le crée s'il manque)
#   handoff.sh carry                   → section **Pending de l'entrée la plus récente
#   handoff.sh add "<titre>" < corps   → insère l'entrée en tête, puis fait tourner l'anneau
#   handoff.sh durable "<titre>" < corps → écrit une COPIE VERSIONNÉE dans docs/sessions/
#   handoff.sh help
#
# `where`, `legacy` et `carry` sont read-only ; `path`, `add` et `durable` écrivent.
#
# Où vit la note (fiche 20261003105820077) : dans `<git-common-dir>/ezk/`, le dossier git que
# tous les worktrees d'un dépôt partagent. L'app Claude supprime un worktree à l'archivage, ou le
# recycle pour une autre session : une note rangée dans `<worktree>/.claude/` partait avec lui.
# Le dossier commun survit à la suppression d'un worktree, reste hors de git, et l'app ne le
# copie jamais dans un worktree neuf. Une note restée dans l'ancien lieu
# (`<worktree>/.claude/handoff.md`) est reprise une fois par `add`, puis ignorée.
#
# Machine jetable (fiche 0189) : la note locale vit hors de git, donc elle est perdue avec un
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
# `pwd -P` : le même chemin, qu'on parte du dossier principal ou d'un worktree (macOS : /var → /private/var).
COMMON="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)" || exit 2
EZK_DIR="$COMMON/ezk"
FILE="$EZK_DIR/handoff.md"
ARCHIVE="$EZK_DIR/handoff.archive.md"
# L'ancien lieu, dans le worktree : lu tant que la note commune n'existe pas, repris une fois par `add`.
LEGACY="$ROOT/.claude/handoff.md"
LEGACY_ARCHIVE="$ROOT/.claude/handoff.archive.md"
# Empreintes des entrées déjà reprises de l'ancien lieu. L'app copie la note du dossier principal
# dans chaque worktree neuf : sans cette mémoire, chaque copie serait reprise une fois de plus.
IMPORTED="$EZK_DIR/legacy-imported"

usage() { sed -n '2,44p' "$0" | sed 's/^# \{0,1\}//'; }

# `add` est un read-modify-write : on lit HEADER/REST, on compose un fichier temporaire,
# puis on le `mv` en place. Deux sessions parallèles (le PO travaille en worktrees) peuvent
# lire le MÊME instantané et le dernier `mv` écrase l'entrée de l'autre — une perte de
# données dans le scénario même que la persistance du handoff est censée couvrir
# (finding Codex PR #56). On sérialise donc le cycle complet.
#
# `mkdir` plutôt que `flock` : atomique sur tout POSIX, et présent partout — `flock` n'est
# pas livré avec macOS. Le verrou porte sur le dépôt (git-common-dir) pour couvrir les
# worktrees, qui partagent le fichier.
LOCK=""
acquire_lock() {
  local tries=0
  LOCK="$COMMON/ezk-handoff.lock"
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
  mkdir -p "$EZK_DIR"
  {
    echo "# Handoff — $(basename "$(dirname "$COMMON")")"
    echo
    echo "> Éphémère personnel, rangé hors de git (dossier commun des worktrees). Append-only, entrée la plus récente en tête."
    echo "> Anneau FIFO : au-delà de $KEEP entrées, les plus anciennes passent dans handoff.archive.md."
    echo                                  # sépare l'en-tête de la 1ʳᵉ entrée (HEADER l'absorbe ensuite)
  } > "$FILE"
}

# Découpe une note en entrées, une par fichier, sans lignes vides de fin : une même entrée a la même
# empreinte, qu'elle soit au milieu ou à la fin d'une copie.
split_entries() { # $1 = note, $2 = dossier de sortie
  awk -v d="$2" '
    function flush() { if (n) { out = d "/" sprintf("%05d", n); printf "%s", buf > out; close(out) } }
    /^## / { flush(); n++; buf = $0 "\n"; blanks = ""; next }
    !n { next }
    /^[[:space:]]*$/ { blanks = blanks $0 "\n"; next }
    { buf = buf blanks $0 "\n"; blanks = "" }
    END { flush() }
  ' "$1"
}

# La date d'une entrée, tirée de son titre « ## AAAA-MM-JJ — … » ; 0000-00-00 sans date.
entry_date() {
  local d
  d="$(sed -n '1s/^## \([0-9]\{4\}-[0-9]\{2\}-[0-9]\{2\}\).*/\1/p' "$1")"
  echo "${d:-0000-00-00}"
}

# La date la plus récente des entrées d'une note ; avec --unimported, des seules entrées pas encore
# reprises (rien imprimé s'il n'y en a aucune). Read-only.
newest_date() { # [--unimported] note
  local only=0 parts f d max=""
  [[ "$1" == "--unimported" ]] && { only=1; shift; }
  [[ -s "$1" ]] || return 0
  parts="$(mktemp -d)"; split_entries "$1" "$parts"
  for f in "$parts"/*; do
    [[ -f "$f" ]] || continue
    (( only )) && grep -qxF "$(git hash-object "$f")" "$IMPORTED" 2>/dev/null && continue
    d="$(entry_date "$f")"
    [[ -z "$max" || "$d" > "$max" ]] && max="$d"
  done
  rm -rf "$parts"
  [[ -n "$max" ]] && echo "$max"
  return 0
}

# Remet les entrées d'une note dans l'ordre des dates, les plus récentes en tête. Le tri est stable,
# et une entrée sans date suit sa voisine : il ne déplace que ce qu'une reprise a mis à la fin.
sort_entries() { # $1 = note
  local f="$1" tmp
  tmp="$(mktemp)"
  {
    awk '/^## /{exit} {print}' "$f"
    awk '
      function flush() { if (n) printf "%s\t%05d\t%s\n", key, n, buf }
      BEGIN { key = "9999-99-99" }
      /^## / { flush(); n++; buf = $0
               if ($0 ~ /^## [0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]/) key = substr($0, 4, 10)
               next }
      n { buf = buf "\001" $0 }
      END { flush() }
    ' "$f" | LC_ALL=C sort -t "$(printf '\t')" -k1,1r -k2,2n \
           | awk -F '\t' '{ t = $3; for (i = 4; i <= NF; i++) t = t "\t" $i; gsub("\001", "\n", t); print t }'
  } > "$tmp"
  mv "$tmp" "$f"
}

# Reprend une fois les entrées d'une note de l'ancien lieu. Une entrée déjà reprise, d'où qu'elle
# vienne, est sautée : la copie que l'app pose dans un worktree neuf ne double jamais la note commune.
# Dans la note vivante, les entrées reprises prennent leur place par date : une entrée plus récente
# que la note commune reste en tête, et `carry` la voit.
import_legacy() { # $1 = ancien fichier, $2 = cible, $3 = en-tête de la cible si elle manque
  local old="$1" target="$2" parts sum f taken=0
  [[ -s "$old" ]] || return 0
  parts="$(mktemp -d)"; split_entries "$old" "$parts"
  for f in "$parts"/*; do
    [[ -f "$f" ]] || continue
    sum="$(git hash-object "$f")"
    grep -qxF "$sum" "$IMPORTED" 2>/dev/null && continue
    [[ -f "$target" ]] || printf '%s\n\n' "$3" > "$target"
    [[ -n "$(tail -c 1 "$target")" ]] && echo >> "$target"
    { cat "$f"; echo; } >> "$target"
    echo "$sum" >> "$IMPORTED"
    taken=$((taken + 1))
  done
  rm -rf "$parts"
  (( taken > 0 )) || return 0
  [[ "$target" == "$FILE" ]] && sort_entries "$target"
  echo "ℹ ancienne note reprise : $taken entrée(s) de $old." >&2
}

case "${1:-help}" in
  where)
    echo "$FILE"
    ;;

  legacy)
    # Read-only : le chemin de l'ancienne note du worktree, si elle porte une entrée pas encore reprise.
    [[ -n "$(newest_date --unimported "$LEGACY")" ]] && echo "$LEGACY"
    exit 0
    ;;

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
    #
    # La note commune gagne sur l'ancien lieu : celui-ci n'est lu que tant qu'aucune note commune
    # n'existe (dépôt pas encore repris par un `add`).
    # Une exception : l'ancienne note du worktree porte une entrée pas encore reprise, plus récente
    # que toute la note commune. C'est la session qui a écrit là avant la bascule ; son Pending passe
    # devant, jusqu'au prochain `add` qui la reprend.
    SRC=""
    if [[ -f "$FILE" ]]; then
      SRC="$FILE"
      LEGACY_NEWEST="$(newest_date --unimported "$LEGACY")"
      [[ -n "$LEGACY_NEWEST" && "$LEGACY_NEWEST" > "$(newest_date "$FILE")" ]] && SRC="$LEGACY"
    elif [[ -f "$LEGACY" ]]; then
      SRC="$LEGACY"
    fi
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
    # Création EXCLUSIVE (noclobber = O_EXCL) : deux processus qui écrivent le même titre dans la même
    # seconde ne peuvent pas obtenir le même fichier, l'un d'eux passe à la seconde suivante.
    while ! ( set -o noclobber; : > "$OUT" ) 2>/dev/null; do
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
    ensure_file
    import_legacy "$LEGACY" "$FILE"
    import_legacy "$LEGACY_ARCHIVE" "$ARCHIVE" "# Handoff — archive (entrées sorties de l'anneau, les plus récentes en tête)"

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
  *) echo "✗ verbe inconnu « $1 » (where|legacy|path|carry|add|durable|help)" >&2; usage >&2; exit 2 ;;
esac
