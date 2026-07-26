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
#   handoff.sh help
#
# `path` et `carry` sont read-only ; seul `add` écrit.

set -uo pipefail

KEEP="${EZK_HANDOFF_KEEP:-3}"
CARRY_MAX=40                # borne de ce que `carry` rend au rédacteur

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2; exit 2
fi
ROOT="$(git rev-parse --show-toplevel)" || exit 2
FILE="$ROOT/.claude/handoff.md"
ARCHIVE="$ROOT/.claude/handoff.archive.md"

usage() { sed -n '2,30p' "$0" | sed 's/^# \{0,1\}//'; }

ensure_gitignored() {
  # `.claude/handoff.md` est de l'ÉPHÉMÈRE PERSONNEL : jamais committé. On garantit
  # l'entrée .gitignore AVANT d'écrire, jamais après — sinon une session parallèle
  # pourrait committer le fichier entre l'écriture et l'ignore.
  git -C "$ROOT" check-ignore -q ".claude/handoff.md" 2>/dev/null && return 0
  printf '\n# note de handoff ezk-archive — éphémère personnel, jamais committée\n.claude/\n' \
    >> "$ROOT/.gitignore"
  echo "ℹ .gitignore : entrée « .claude/ » ajoutée avant écriture." >&2
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
    # Read-only. Rend UNIQUEMENT la section **Pending de la PREMIÈRE entrée (la plus
    # récente), bornée : le rédacteur n'a jamais besoin de lire le fichier entier.
    [[ -f "$FILE" ]] || exit 0
    awk '
      /^## / { if (seen) exit; seen=1; next }        # 2ᵉ en-tête = fin de l entree
      seen && /^\*\*Pending/ { insec=1; print; next }
      insec && /^\*\*/ { exit }                       # section suivante = fin
      insec { print }
    ' "$FILE" | head -n "$CARRY_MAX"
    ;;

  add)
    TITLE="${2:-}"
    if [[ -z "$TITLE" ]]; then echo "✗ handoff.sh add « <titre> » — titre manquant." >&2; exit 2; fi
    BODY="$(cat)"
    if [[ -z "${BODY//[[:space:]]/}" ]]; then echo "✗ corps vide sur stdin — rien écrit." >&2; exit 2; fi
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
  *) echo "✗ verbe inconnu « $1 » (path|carry|add|help)" >&2; usage >&2; exit 2 ;;
esac
