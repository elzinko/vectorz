#!/usr/bin/env bash
# Vérifie que les liens markdown RELATIFS résolvent sur le disque.
# Déterministe, read-only : aucun jugement, aucune écriture. cf. ADR-0001 §2 (le script range).
#
# Deux défauts récurrents, tous deux mécaniques, que ce contrôle attrape :
#   1. profondeur relative fausse — un `../docs/…` recopié d'un dossier vers un
#      sous-dossier descend d'un niveau de trop ;
#   2. cible déplacée par `ezk-backlog ship` dans `done/` — les liens entrants ne suivent pas.
#
# Usage : check-links.sh [racine-projet] [chemin-relatif...]
#   défauts : racine = le produit mega-city (parent de bin/) ; périmètre = features/ docs/adr/
#   Backlog racine vectorz :
#     check-links.sh <racine-vectorz> features docs/adr docs/captures
#
# Résolution LEXICALE (`.` et `..` réduits sur la chaîne), comme GitHub et les rendus
# markdown — pas de suivi de symlink : on juge le lien tel qu'il sera cliqué.
#
# Sortie : une ligne par lien cassé sur stdout, `fichier:ligne<TAB>cible<TAB>→ résolu` ;
#          résumé sur stderr ; code 1 s'il reste un lien cassé, 2 si le périmètre est invalide.
set -uo pipefail
set -f   # pas de glob : les segments de chemin sont des données, pas des motifs

ROOT="${1:-"$(cd "$(dirname "$0")/.." && pwd)"}"
shift || true
cd "$ROOT" 2>/dev/null || { echo "erreur: racine introuvable : $ROOT" >&2; exit 2; }

if [ "$#" -gt 0 ]; then PATHS="$*"; else PATHS="features docs/adr"; fi

# ── Découverte des fichiers ──────────────────────────────────────────────────────
files=""
for p in $PATHS; do
  if [ -d "$p" ]; then
    files="${files}$(find "$p" -type f -name '*.md' \
      -not -path '*/node_modules/*' -not -path '*/.git/*' -not -path '*/.claude/worktrees/*' \
      | LC_ALL=C sort)"$'\n'
  elif [ -f "$p" ]; then
    files="${files}${p}"$'\n'
  else
    echo "erreur: chemin absent de ${ROOT} : $p" >&2
    exit 2
  fi
done
files="$(printf '%s' "$files" | grep -v '^[[:space:]]*$' || true)"
[ -n "$files" ] || { echo "erreur: aucun .md dans le périmètre : $PATHS" >&2; exit 2; }
nb_files="$(printf '%s\n' "$files" | wc -l | tr -d ' ')"

# ── Extraction des cibles → `fichier \t ligne \t cible` ──────────────────────────
# Ignore : blocs de code clôturés (``` / ~~~), ancres pures (#…), schémas connus et
# tout `xxx://`. Retire l'ancre et le titre optionnel `(cible "titre")`.
# NB : la liste des schémas est EXPLICITE à dessein. Un `^[a-z]+:` générique avalerait
# `types.ts:75` — une vraie cible cassée — en la prenant pour une URL.
read -r -d '' EXTRACT <<'AWK' || true
function emit(t) {
  sub(/^[[:space:]]+/, "", t); sub(/[[:space:]]+$/, "", t)
  sub(/[[:space:]].*$/, "", t)
  sub(/^</, "", t); sub(/>$/, "", t)
  if (t == "" || t ~ /^#/) return
  if (t ~ /^(https?|ftps?|mailto|tel|data|file|git|ssh):/) return
  if (t ~ /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//) return
  sub(/#.*$/, "", t)
  if (t == "") return
  printf "%s\t%d\t%s\n", FILENAME, FNR, t
}
FNR == 1 { fence = 0 }
/^[[:space:]]*(```|~~~)/ { fence = 1 - fence; next }
fence { next }
{
  if ($0 ~ /^\[[^]]+\]:[[:space:]]*[^[:space:]]/) {
    d = $0; sub(/^\[[^]]+\]:[[:space:]]*/, "", d); emit(d)
  }
  rest = $0
  while (match(rest, /\]\([^)]*\)/)) {
    emit(substr(rest, RSTART + 2, RLENGTH - 3))
    rest = substr(rest, RSTART + RLENGTH)
  }
}
AWK

# ── Normalisation lexicale : réduit `.` et `..` sans toucher au disque ───────────
norm() {
  local seg out IFS=/
  out=""
  for seg in $1; do
    case "$seg" in
      ''|.) ;;
      ..)
        if [ -n "$out" ] && [ "${out##*/}" != ".." ]; then
          case "$out" in */*) out="${out%/*}";; *) out="";; esac
        else
          out="${out:+$out/}.."
        fi ;;
      *) out="${out:+$out/}$seg" ;;
    esac
  done
  printf '%s' "$out"
}

# ── Vérification ─────────────────────────────────────────────────────────────────
checked=0; skipped_abs=0; broken=0; report=""

while IFS=$'\t' read -r f line target; do
  [ -n "${target:-}" ] || continue
  case "$target" in
    /*) skipped_abs=$((skipped_abs + 1)); continue ;;
  esac
  checked=$((checked + 1))
  resolved="$(norm "$(dirname "$f")/$target")"
  [ -e "$resolved" ] && continue
  broken=$((broken + 1))
  report="${report}${f}:${line}"$'\t'"${target}"$'\t'"→ ${resolved}"$'\n'
done < <(printf '%s\n' "$files" | tr '\n' '\0' | xargs -0 awk "$EXTRACT")

[ -z "$report" ] || printf '%s' "$report"

[ "$skipped_abs" -eq 0 ] || \
  echo "check-links: $skipped_abs lien(s) absolu(s) ignoré(s) — non vérifiables sur disque" >&2
echo "check-links: $checked lien(s) relatif(s) dans $nb_files fichier(s) — $broken cassé(s)" >&2
[ "$broken" -eq 0 ] || exit 1
