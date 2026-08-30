#!/usr/bin/env bash
# Régénère le livre recipes/RECIPES.md depuis les front-matters (source de vérité).
# Clone de regen-backlog.sh (D2, fiche 20260824185422122) — mécanique identique en
# plus simple : pas de priorité/type/pr/épic, un id/titre/makes/status/home/composes.
# Déterministe : tri par id ; aucun jugement (ADR-0001 §2 — le script range).
#
# Usage : regen-recipes.sh [racine-projet]
#   défaut : racine = grand-parent du bin/ (racine vectorz, recipes/ est un dossier
#   frère de products/) — cf. résolution ci-dessous.
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -n "${1:-}" ]]; then
  ROOT="$1"
else
  # products/mega-city/bin -> products/mega-city -> products -> racine vectorz
  ROOT="$(cd "$_SCRIPT_DIR/../../.." && pwd)"
fi
cd "$ROOT"
[ -d recipes ] || { echo "erreur: pas de dossier recipes/ dans ${ROOT}" >&2; exit 1; }

SEP=$'\x1f'

extract() { # $1=file → champs \x1f : id, title, makes, status, home, source, composes, created, updated
  awk '
    function unquote(s) { gsub(/^"|"$/, "", s); return s }
    BEGIN { infm=0 }
    /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
    infm==1 {
      if ($0 ~ /^id:/)       { sub(/^id:[[:space:]]*/, "");       id=unquote($0) }
      if ($0 ~ /^title:/)    { sub(/^title:[[:space:]]*/, "");    title=unquote($0) }
      if ($0 ~ /^makes:/)    { sub(/^makes:[[:space:]]*/, "");    makes=unquote($0) }
      if ($0 ~ /^status:/)   { sub(/^status:[[:space:]]*/, "");   sub(/[[:space:]]*#.*$/, ""); status=unquote($0) }
      if ($0 ~ /^home:/)     { sub(/^home:[[:space:]]*/, "");     sub(/[[:space:]]*#.*$/, ""); home=unquote($0) }
      if ($0 ~ /^source:/)   { sub(/^source:[[:space:]]*/, "");   sub(/[[:space:]]*#.*$/, ""); source=unquote($0) }
      if ($0 ~ /^created:/)  { sub(/^created:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); created=$0 }
      if ($0 ~ /^updated:/)  { sub(/^updated:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); updated=$0 }
    }
    END { printf "%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\n", id, title, makes, status, home, source, created, updated }
  ' "$1"
}

rows=""
skipped=""
for f in recipes/*.md; do
  [ -e "$f" ] || continue
  [ "$(basename "$f")" = "RECIPES.md" ] && continue
  [ "$(basename "$f")" = "RECIPE_TEMPLATE.md" ] && continue
  line="$(extract "$f")"
  id_field="${line%%${SEP}*}"
  if [ -z "$id_field" ]; then
    skipped="${skipped}${f}"$'\n'
    continue
  fi
  rows="${rows}${line}${SEP}${f#recipes/}"$'\n'
done

# Warning non bloquant : ids en double (même anti-collision que le backlog).
printf '%s' "$rows" | awk -F"$SEP" '
  NF { seen[$1]++ }
  END { for (id in seen) if (seen[id] > 1) printf "warning: id %s en double (%d recettes) — collision structurelle\n", id, seen[id] | "cat 1>&2" }'

emit_row() { # $1=id $2=title $3=makes $4=status $5=home $6=rel
  local id="$1" title="$2" makes="$3" status="$4" home="$5" rel="$6"
  local st
  case "$status" in
    ready) st='✅ ready';;
    draft) st='📝 draft';;
    *) st="$status";;
  esac
  title="${title//|/\\|}"
  makes="${makes//|/\\|}"
  local id_cell="$id"
  [ -n "$rel" ] && id_cell="[$id]($rel)"
  echo "| $id_cell | $title | $makes | $st | $home |"
}

{
  echo '# Livre des recettes — vectorz'
  echo ''
  echo '> Index auto-généré (`regen-recipes.sh` mega-city) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque recette.'
  echo '> Gabarit : [RECIPE_TEMPLATE.md](RECIPE_TEMPLATE.md). Gardien : `ezk-chef`. Statuts : 📝 draft · ✅ ready.'
  echo ''
  echo '| Id | Titre | Fabrique | Statut | Emplacement |'
  echo '|----|-------|----------|--------|-------------|'
  printf '%s' "$rows" | awk -F"$SEP" 'NF' | sort -t"$SEP" -k1,1 | \
    while IFS="$SEP" read -r id title makes status home source created updated rel; do
      emit_row "$id" "$title" "$makes" "$status" "$home" "$rel"
    done
  echo ''
  if [ -n "$skipped" ]; then
    echo '## ⚠️ Sans front-matter (hors index — non normalisées)'
    echo ''
    printf '%s' "$skipped" | while IFS= read -r f; do
      [ -n "$f" ] && echo "- \`$f\`"
    done
    echo ''
  fi
} > recipes/RECIPES.md

echo "recipes/RECIPES.md régénéré ($(printf '%s' "$rows" | grep -c . || true) recettes)."
