#!/usr/bin/env bash
# ezk-archive — MARQUEUR DE PROGRESSION d'un run de clôture (fiche 20261002155911264).
#
# Un run `ezk-archive run` écrit en plusieurs points (SKILL.md) : 5 mémoire · 6 handoff · 7 verdict ·
# 8 archive-session, plus 9 carnet (best-effort). Coupé en plein travail — fin de session, contexte —
# il laissait un état à moitié écrit, sans rien pour dire ce qui restait : le pilote revérifiait tout
# à la main (session muti du 2026-10-01 : snapshot + mémoire écrits, handoff et index non). On rend le
# run REPRENABLE : chaque point fait est marqué au fil de l'eau ; relancé, `check` voit ce qui manque,
# et l'agent ne refait QUE les points manquants — aucune écriture en double.
#
# Où vit le marqueur : HORS du worktree, un fichier PAR BRANCHE, dans le dossier git commun —
# `<git-common-dir>/ezk/archive-runs/<branche>.md`. Même lieu et même raison que le journal de sprint
# (fiche 20261004181110201) et la note de passation : l'app Claude recycle les worktrees, un marqueur
# rangé dans le worktree partirait avec lui. Par branche : une session = une branche ; deux sessions
# en parallèle ne se marchent pas dessus.
#
# ADR-0001 : le script RANGE (il tient le marqueur, déterministe), le LLM JUGE (il fait le travail de
# chaque point, puis le marque). `check` et `status` sont READ-ONLY ; `begin`, `done` et `clear` écrivent.
#
# Verbes :
#   begin              ouvre un run (idempotent : garde un run déjà en cours — c'est ça, reprendre)
#   done <point>       marque un point fait ; <point> ∈ {memoire,handoff,verdict,archive-session,carnet}
#   status             READ-ONLY : NONE | INCOMPLETE done=… missing=… | COMPLETE done=…
#   clear              efface le marqueur (run entièrement terminé)
#   -h | --help
#   Dernier argument optionnel : <racine> du dépôt.
#
# Sortie de `status` (une ligne, comme les portiers — le verdict passe par stdout) :
#   ARCHIVE_RUN: NONE                                   aucun run en cours
#   ARCHIVE_RUN: INCOMPLETE done=<a,b> missing=<c,d>    un run précédent n'est pas fini
#   ARCHIVE_RUN: COMPLETE done=<a,b,c,d>                tous les points REQUIS sont faits (reste à clear)
#   exit 0 pour tout verdict ; exit 2 = erreur d'usage, écriture impossible, ou pas un dépôt git.

set -uo pipefail

# Points d'écriture du run (SKILL.md). REQUIS = la clôture n'est « complète » que lorsqu'ils sont tous
# faits ; `carnet` est best-effort (tracké s'il est fait, jamais exigé).
REQUIRED_POINTS="memoire handoff verdict archive-session"
OPTIONAL_POINTS="carnet"

usage() { sed -n '2,33p' "$0" | sed 's/^# \{0,1\}//'; }
die_usage() { echo "archive-progress.sh : $1" >&2; usage >&2; exit 2; }

CMD="${1:-}"
case "$CMD" in
  begin|done|status|clear) shift ;;
  -h|--help) usage; exit 0 ;;
  "") die_usage "verbe attendu (begin|done|status|clear)" ;;
  *) die_usage "verbe inconnu « $CMD »" ;;
esac

POINT=""
ROOT=""
if [[ "$CMD" == "done" ]]; then
  [[ $# -ge 1 ]] || die_usage "done demande un point (${REQUIRED_POINTS// /|}|${OPTIONAL_POINTS})"
  POINT="$1"; shift
fi
[[ $# -ge 1 ]] && ROOT="$1"

known_point() { # 0 si $1 est un point connu
  local p
  for p in $REQUIRED_POINTS $OPTIONAL_POINTS; do [[ "$p" == "$1" ]] && return 0; done
  return 1
}

if [[ -n "$ROOT" ]]; then cd "$ROOT" || exit 2; fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2; exit 2
fi

# Chemin du marqueur : même résolution que sprint.sh / handoff.sh (pwd -P, par branche).
COMMON="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)" || exit 2
BRANCH="$(git branch --show-current 2>/dev/null)"
[[ -n "$BRANCH" ]] || BRANCH="_detached"  # clé STABLE (même choix que sprint.sh/check.sh, revue v0.14)
BRANCH_SAFE="$(printf '%s' "$BRANCH" | LC_ALL=C sed 's#[^A-Za-z0-9._/-]#-#g')"
FILE="$COMMON/ezk/archive-runs/$BRANCH_SAFE.md"

# Les points déjà faits, un par ligne (vide si pas de marqueur). Lignes vides et commentaires ignorés.
done_points() {
  [[ -f "$FILE" ]] || return 0
  grep -vE '^[[:space:]]*($|#)' "$FILE" 2>/dev/null || true
}

# Les points requis encore manquants, séparés par des virgules (vide si tous faits).
missing_required() {
  local done p out=""
  done="$(done_points)"
  for p in $REQUIRED_POINTS; do
    printf '%s\n' "$done" | grep -qxF "$p" || out="${out:+$out,}$p"
  done
  printf '%s' "$out"
}

joined_done() { done_points | grep -vE '^[[:space:]]*$' | paste -sd, - 2>/dev/null | sed 's/[[:space:]]//g'; }

case "$CMD" in
  begin)
    local_resumed=0
    if [[ -f "$FILE" ]]; then
      local_resumed=1
    else
      mkdir -p "$(dirname "$FILE")" || { echo "✗ création du marqueur impossible ($FILE)" >&2; exit 2; }
      {
        echo "# Run ezk-archive — $(date +%F) — branche $BRANCH"
        echo "# Un point fait par ligne (fiche 20261002155911264). Reprise : check lit ce fichier."
      } > "$FILE" || { echo "✗ écriture du marqueur impossible ($FILE)" >&2; exit 2; }
    fi
    echo "ARCHIVE_RUN: BEGIN resumed=${local_resumed}"
    ;;

  done)
    known_point "$POINT" || die_usage "point inconnu « $POINT » (${REQUIRED_POINTS// /|}|${OPTIONAL_POINTS})"
    # begin implicite : marquer un point ouvre le run s'il ne l'était pas.
    if [[ ! -f "$FILE" ]]; then
      mkdir -p "$(dirname "$FILE")" || { echo "✗ création du marqueur impossible ($FILE)" >&2; exit 2; }
      {
        echo "# Run ezk-archive — $(date +%F) — branche $BRANCH"
        echo "# Un point fait par ligne (fiche 20261002155911264). Reprise : check lit ce fichier."
      } > "$FILE"
    fi
    # Idempotent : un point déjà marqué n'est jamais ajouté deux fois (zéro doublon, critère 2).
    if done_points | grep -qxF "$POINT"; then
      echo "ARCHIVE_RUN: DONE point=${POINT} (déjà marqué)"
    else
      printf '%s\n' "$POINT" >> "$FILE" || { echo "✗ écriture du marqueur impossible ($FILE)" >&2; exit 2; }
      echo "ARCHIVE_RUN: DONE point=${POINT}"
    fi
    ;;

  status)
    if [[ ! -f "$FILE" ]]; then echo "ARCHIVE_RUN: NONE"; exit 0; fi
    miss="$(missing_required)"
    if [[ -n "$miss" ]]; then
      echo "ARCHIVE_RUN: INCOMPLETE done=$(joined_done) missing=${miss}"
    else
      echo "ARCHIVE_RUN: COMPLETE done=$(joined_done)"
    fi
    ;;

  clear)
    rm -f "$FILE" 2>/dev/null || { echo "✗ effacement du marqueur impossible ($FILE)" >&2; exit 2; }
    echo "ARCHIVE_RUN: CLEARED"
    ;;
esac
