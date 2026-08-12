#!/usr/bin/env bash
# Génère une VUE PORTFOLIO transverse (racine vectorz + mega-city) → PORTFOLIO.md à la racine.
# Lecture seule sur les front-matters (source de vérité) — ne modifie aucun backlog.
# Deux backlogs restent séparés (ADR-0017 A13) ; ceci est la vue de lecture par-dessus.
# Doctrine ADR-0001 : le script agrège/trie, le LLM juge. NE PAS éditer PORTFOLIO.md à la main.
#
# Usage : portfolio.sh [racine-vectorz]   (défaut : parent de products/, déduit de bin/)
set -euo pipefail

ROOT="${1:-"$(cd "$(dirname "$0")/../../.." && pwd)"}"
cd "$ROOT"
[ -d features ] || { echo "erreur: pas de features/ à la racine ${ROOT}" >&2; exit 1; }
[ -d products/mega-city/features ] || { echo "erreur: pas de products/mega-city/features/" >&2; exit 1; }

SEP=$'\x1f'
OUT="PORTFOLIO.md"

# extract $1=file $2=product → id,title,type,prio,status,pr,ready,created,version,epic,PRODUCT
extract() {
  awk -v product="$2" '
    function unquote(s) { gsub(/^"|"$/, "", s); return s }
    BEGIN { infm=0 }
    /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
    infm==1 {
      if ($0 ~ /^id:/)       { sub(/^id:[[:space:]]*/, "");       id=unquote($0) }
      if ($0 ~ /^title:/)    { sub(/^title:[[:space:]]*/, "");    title=unquote($0) }
      if ($0 ~ /^type:/)     { sub(/^type:[[:space:]]*/, "");     sub(/[[:space:]]*#.*$/, ""); type=$0 }
      if ($0 ~ /^priority:/) { sub(/^priority:[[:space:]]*/, ""); sub(/[[:space:]]*#.*$/, ""); prio=$0 }
      if ($0 ~ /^status:/)   { sub(/^status:[[:space:]]*/, "");   sub(/[[:space:]]*#.*$/, ""); status=$0 }
      if ($0 ~ /^pr:/)       { sub(/^pr:[[:space:]]*/, "");       pr=unquote($0) }
      if ($0 ~ /^ready:/)    { sub(/^ready:[[:space:]]*/, "");    sub(/[[:space:]]*#.*$/, ""); ready=$0 }
      if ($0 ~ /^created:/)  { sub(/^created:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); created=$0 }
      if ($0 ~ /^version:/)  { sub(/^version:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); version=unquote($0) }
      if ($0 ~ /^epic:/)     { sub(/^epic:[[:space:]]*/, "");     sub(/[[:space:]]*#.*$/, ""); epic=unquote($0) }
    }
    END { printf "%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\n", \
          id, title, type, prio, status, pr, ready, created, version, epic, product }
  ' "$1" "$1"
}

rows=""
for f in features/[0-9]*.md; do
  [ -e "$f" ] || continue
  rows="${rows}$(extract "$f" "vectorz")"$'\n'
done
for f in products/mega-city/features/[0-9]*.md; do
  [ -e "$f" ] || continue
  rows="${rows}$(extract "$f" "mega-city")"$'\n'
done

st_label() {
  case "$1" in
    shipped) echo '✅ shipped';; in-progress) echo '🟠 in-progress';;
    blocked) echo '⛔ blocked';; idea) echo '💡 idea';; *) echo '🔴 todo';;
  esac
}

# emit_table : lit les lignes filtrées sur stdin, colonne Produit, tri déjà fait par l'appelant
emit_table() {
  echo '| Prod | # | Titre | Type | Prio | Statut | PR |'
  echo '|------|---|-------|------|------|--------|----|'
  while IFS="$SEP" read -r id title type prio status pr ready created version epic product; do
    [ -z "$id" ] && continue
    title="${title//|/\\|}"; pr="${pr//|/\\|}"
    echo "| ${product} | ${id} | ${title} | ${type} | ${prio} | $(st_label "$status") | ${pr} |"
  done
}

{
  echo "# 🗂️ Portfolio Vectorz — vue transverse des deux backlogs"
  echo ''
  echo '> **Vue de LECTURE auto-générée** (`products/mega-city/bin/portfolio.sh`) par-dessus les'
  echo '> deux backlogs, qui restent séparés (ADR-0017 A13) : `features/` (vectorz/cop1) et'
  echo '> `products/mega-city/features/` (méthode). **Ne pas éditer à la main.** Source de vérité ='
  echo '> le front-matter de chaque fiche ; chaque backlog garde son index propre (`BACKLOG.md`).'
  echo ''

  echo '## 🎯 Tirables maintenant (`ready`, tous backlogs confondus)'
  echo ''
  echo 'Les fiches `todo` passées au gate DoR (`ready:`), dans l’ordre de tirage (P0→P3, puis produit, puis id).'
  echo ''
  readies="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="todo" && $7!="" && $3!="epic"' | sort -t"$SEP" -k4,4 -k11,11 -k1,1)"
  if [ -n "$readies" ]; then printf '%s\n' "$readies" | emit_table; else echo '_Aucune fiche ready — flux gelé, groomer une tête de file._'; fi
  echo ''

  echo '## 🟠 En cours (`in-progress`)'
  echo ''
  inprog="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="in-progress"' | sort -t"$SEP" -k4,4 -k11,11 -k1,1)"
  if [ -n "$inprog" ]; then printf '%s\n' "$inprog" | emit_table; else echo '_Rien en cours._'; fi
  echo ''

  echo '## 📋 Actionnable (todo + blocked, hors idées et épics)'
  echo ''
  echo 'Tri P0→P3, puis produit, puis id. `blocked` inclus (dépendance dure — voir la fiche).'
  echo ''
  printf '%s' "$rows" | awk -F"$SEP" '($5=="todo" || $5=="blocked") && $3!="epic"' \
    | sort -t"$SEP" -k4,4 -k11,11 -k1,1 | emit_table
  echo ''

  epics="$(printf '%s' "$rows" | awk -F"$SEP" '$3=="epic"' | sort -t"$SEP" -k4,4 -k11,11 -k1,1)"
  if [ -n "$epics" ]; then
    echo '## 🧭 Épics (jamais tirables — tirer leurs enfants ready)'
    echo ''
    printf '%s\n' "$epics" | emit_table
    echo ''
  fi

  echo '## 💡 Idées (non groomées, hors flux P0→P3)'
  echo ''
  ideas="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="idea" && $3!="epic"' | sort -t"$SEP" -k4,4 -k11,11 -k1,1)"
  if [ -n "$ideas" ]; then printf '%s\n' "$ideas" | emit_table; else echo '_Aucune idée en attente._'; fi
  echo ''

  # Compteurs déterministes par produit (le script compte, le LLM juge — ADR-0001).
  echo '## 📊 Compteurs (déterministes)'
  echo ''
  printf '%s' "$rows" | awk -F"$SEP" '
    NF {
      p=$11; tot[p]++; totall++
      if ($3=="epic") { epic[p]++; next }
      st[p"/"$5]++
      if ($5=="todo" && $7!="") ready[p]++
    }
    END {
      printf "| Produit | Total | 🔴 todo (ready) | 🟠 in-prog | ⛔ blocked | 💡 idea | 🧭 épics |\n"
      printf "|---------|-------|-----------------|-----------|-----------|---------|---------|\n"
      split("vectorz mega-city", order, " ")
      for (i=1;i<=2;i++){ p=order[i];
        printf "| %s | %d | %d (%d) | %d | %d | %d | %d |\n", p, tot[p]+0, \
          st[p"/todo"]+0, ready[p]+0, st[p"/in-progress"]+0, st[p"/blocked"]+0, st[p"/idea"]+0, epic[p]+0 }
    }'
  echo ''
  echo '> Ne compte pas les fiches livrées (`done/`) — voir chaque `BACKLOG.md` de backlog pour l’historique.'
} > "$OUT"

echo "${OUT} régénéré."
