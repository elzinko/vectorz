#!/usr/bin/env bash
# journal-add.sh — écrit UNE entrée au journal des difficultés (fiche 20260904091853974).
#
# Le journal est un artefact INDÉPENDANT : une capture brute, écrite PENDANT le dev, directement
# dans un fichier durable de `docs/journal/`, hors `SPRINT.md`, taguée par fiche. Le labo
# (`ezk-chef extract`) le LIT à la demande ; rien ici ne dépend de lui.
#
# Usage : journal-add.sh [--slug <slug>] [--root <dir>] <id-fiche> <titre> <coincé> <réglé> [<pourquoi>]
#   <id-fiche>  chiffres seulement (l'id horodaté de la fiche concernée)
#   --slug      nom de la session ; défaut = la branche git courante. Un worktree = une branche =
#               un fichier : deux sprints en parallèle n'écrivent jamais dans le même fichier.
#   --root      racine du projet ; défaut = racine git courante, sinon le dossier courant
#
# Sortie : le chemin du fichier journal (relatif à la racine), en dernière ligne de stdout.
# Erreurs franches (code 1, rien d'écrit) : argument manquant ou vide, id non numérique.
set -euo pipefail

usage() {
  echo "Usage: $(basename "$0") [--slug <slug>] [--root <dir>] <id-fiche> <titre> <coincé> <réglé> [<pourquoi>]" >&2
}
die() { echo "erreur: $*" >&2; exit 1; }

SLUG=""
ROOT=""
while [ $# -gt 0 ]; do
  case "$1" in
    --slug) [ $# -ge 2 ] || { usage; exit 1; }; SLUG="$2"; shift 2 ;;
    --root) [ $# -ge 2 ] || { usage; exit 1; }; ROOT="$2"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    --) shift; break ;;
    -*) usage; die "option inconnue « $1 »" ;;
    *) break ;;
  esac
done

if [ $# -lt 4 ] || [ $# -gt 5 ]; then usage; exit 1; fi

# Une entrée tient sur une ligne par champ : on aplatit retours à la ligne, tabulations et espaces multiples.
oneline() { printf '%s' "$1" | tr '\n\r\t' '   ' | sed -e 's/  */ /g' -e 's/^ //' -e 's/ $//'; }

ID="$1"
TITRE="$(oneline "$2")"
COINCE="$(oneline "$3")"
REGLE="$(oneline "$4")"
POURQUOI="$(oneline "${5:-}")"

[[ "$ID" =~ ^[0-9]+$ ]] || die "id de fiche invalide « ${ID} » (attendu : chiffres uniquement)"
[ -n "$TITRE" ]  || die "le titre est vide"
[ -n "$COINCE" ] || die "« coincé » est vide"
[ -n "$REGLE" ]  || die "« réglé » est vide"

if [ -z "$ROOT" ]; then
  ROOT="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
fi
[ -d "$ROOT" ] || die "racine introuvable « ${ROOT} »"

# Slug par défaut : la branche courante (vide si HEAD détaché ou pas de dépôt git).
if [ -z "$SLUG" ]; then
  SLUG="$(git -C "$ROOT" symbolic-ref --short -q HEAD 2>/dev/null || true)"
fi
# Nom de fichier sûr : jamais de séparateur de chemin, d'espace ni de point en tête.
SLUG="$(printf '%s' "$SLUG" | sed -e 's#[^A-Za-z0-9._-]#-#g' -e 's#--*#-#g' -e 's#^[-.]*##' -e 's#[-.]*$##')"
[ -n "$SLUG" ] || SLUG="session"

DIR="$ROOT/docs/journal"
mkdir -p "$DIR"

# Un seul fichier par slug : on reprend le plus ancien s'il existe, sinon on le crée à la date du jour.
shopt -s nullglob
existants=("$DIR"/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-"$SLUG".md)
shopt -u nullglob
if [ ${#existants[@]} -gt 0 ]; then
  FILE="${existants[0]}"
else
  FILE="$DIR/$(date +%Y-%m-%d)-${SLUG}.md"
  printf '# Journal des difficultés — %s\n' "$SLUG" > "$FILE"
fi

{
  printf '\n## [%s] %s\n' "$ID" "$TITRE"
  printf -- '- **Coincé** : %s\n' "$COINCE"
  printf -- '- **Réglé** : %s\n' "$REGLE"
  if [ -n "$POURQUOI" ]; then
    printf -- '- **Pourquoi** : %s\n' "$POURQUOI"
  fi
} >> "$FILE"

printf '%s\n' "${FILE#"$ROOT"/}"
