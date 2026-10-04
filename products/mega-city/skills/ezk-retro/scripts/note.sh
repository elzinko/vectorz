#!/usr/bin/env bash
# ezk-retro — le carnet de rétro, hors de git (fiche 20261003105820077, voie A).
#
# Pourquoi : déposer une note dans `docs/retro-notes/` depuis un worktree demandait un fichier, un
# commit, une PR de docs et une fusion par le PO. Les idées n'étaient pas déposées, et les rétros
# trouvaient le carnet vide. Ici, une note se dépose en une commande, sans commit ni PR, dans le
# dossier git que tous les worktrees du dépôt partagent : `<git-common-dir>/ezk/retro-notes/`. Il
# survit à la suppression d'un worktree d'app. La rétro lit ces notes au temps 1, puis les verse
# dans git par sa PR de rangement. Revers accepté : une note en attente ne survit pas à un nouveau
# clone du dépôt.
#
# Usage :
#   note.sh [--root <dépôt>] add "<titre>" [--type friction|idée|problème] < corps
#                                          → dépose la note, imprime son chemin
#   note.sh [--root <dépôt>] list          → les notes en attente (un chemin par ligne), read-only
#   note.sh [--root <dépôt>] verse <dossier> <nom>…
#                                          → déplace les notes nommées dans <dossier> (dans le
#                                            dépôt, ex. docs/retro-notes/traitees/) : la PR de
#                                            rangement de la rétro les committe
#   note.sh help
#
# Le format est celui du carnet versionné (docs/retro-notes/README.md) : un fichier
# `<AAAAMMDDHHMMSSmmm>-<slug>.md`, front-matter date / session / type, corps auto-porteur.

set -uo pipefail

usage() { sed -n '2,24p' "$0" | sed 's/^# \{0,1\}//'; }

ROOT="."
if [[ "${1:-}" == "--root" ]]; then
  if [[ -z "${2:-}" ]]; then echo "✗ --root sans dossier." >&2; exit 2; fi
  ROOT="$2"; shift 2
fi
if ! git -C "$ROOT" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git : ${ROOT}" >&2; exit 2
fi
WORKTREE="$(git -C "$ROOT" rev-parse --show-toplevel)"
COMMON="$(cd "$(git -C "$ROOT" rev-parse --path-format=absolute --git-common-dir)" && pwd -P)"
DIR="$COMMON/ezk/retro-notes"

slugify() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]' | LC_ALL=C sed 's/[^a-z0-9]\{1,\}/-/g; s/^-//; s/-$//' | cut -c1-50
}

# Id horodaté à la milliseconde, comme les fiches (fiche 0180). `date` de macOS n'a pas %N.
stamp() {
  local ms
  ms="$(perl -MTime::HiRes=time -e 'printf "%03d", (time() * 1000) % 1000' 2>/dev/null || echo 000)"
  printf '%s%s' "$(date +%Y%m%d%H%M%S)" "$ms"
}

case "${1:-help}" in
  add)
    TITLE="${2:-}"; TYPE="friction"
    if [[ -z "$TITLE" ]]; then echo "✗ note.sh add « <titre> » — titre manquant." >&2; exit 2; fi
    if [[ "${3:-}" == "--type" ]]; then TYPE="${4:-}"; fi
    case "$TYPE" in
      friction|idée|problème) ;;
      *) echo "✗ type « $TYPE » inconnu (friction|idée|problème)." >&2; exit 2 ;;
    esac
    BODY="$(cat)"
    if [[ -z "${BODY//[[:space:]]/}" ]]; then echo "✗ corps vide sur stdin — rien écrit." >&2; exit 2; fi
    SLUG="$(slugify "$TITLE")"; [[ -n "$SLUG" ]] || SLUG="note"
    if ! mkdir -p "$DIR" 2>/dev/null || [[ ! -w "$DIR" ]]; then
      echo "✗ carnet non inscriptible : $DIR — rien écrit." >&2; exit 1
    fi
    # Création EXCLUSIVE (noclobber) : deux dépôts dans la même milliseconde ne s'écrasent pas. La
    # boucle est bornée : un échec qui n'est pas une collision ne doit jamais tourner sans fin.
    TRIES=0
    OUT="$DIR/$(stamp)-$SLUG.md"
    while ! ( set -o noclobber; : > "$OUT" ) 2>/dev/null; do
      TRIES=$((TRIES + 1))
      if (( TRIES >= 50 )); then echo "✗ impossible de créer la note dans $DIR — rien écrit." >&2; exit 1; fi
      OUT="$DIR/$(stamp)-$SLUG.md"
    done
    {
      echo "---"
      echo "date: $(date +%F)"
      echo "session: \"$(git -C "$WORKTREE" branch --show-current 2>/dev/null || echo detached) / $(basename "$WORKTREE")\""
      echo "type: $TYPE"
      echo "---"
      echo
      echo "# $TITLE"
      echo
      printf '%s\n' "$BODY"
    } > "$OUT"
    echo "$OUT"
    ;;

  list)
    ls -1 "$DIR"/*.md 2>/dev/null | sort
    exit 0
    ;;

  verse)
    DEST="${2:-}"
    if [[ -z "$DEST" ]] || (( $# < 3 )); then
      echo "✗ note.sh verse <dossier> <nom>… — dossier ou notes manquants." >&2; exit 2
    fi
    shift 2
    [[ "$DEST" == /* ]] || DEST="$WORKTREE/$DEST"
    mkdir -p "$DEST"
    RC=0
    for NAME in "$@"; do
      SRC="$DIR/$(basename "$NAME")"
      if [[ ! -f "$SRC" ]]; then echo "✗ note introuvable : $NAME" >&2; RC=1; continue; fi
      if [[ -e "$DEST/$(basename "$SRC")" ]]; then echo "✗ existe déjà : $DEST/$(basename "$SRC")" >&2; RC=1; continue; fi
      mv "$SRC" "$DEST/" && echo "$DEST/$(basename "$SRC")"
    done
    exit "$RC"
    ;;

  help|-h|--help) usage ;;
  *) echo "✗ verbe inconnu « $1 » (add|list|verse|help)" >&2; usage >&2; exit 2 ;;
esac
