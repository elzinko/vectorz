#!/usr/bin/env bash
# Génère PORTFOLIO.md à la racine depuis la **liste unique** `features/` (0064).
# Lecture seule sur les front-matters — ne modifie aucun backlog.
# Le produit vient du champ `product:` (plus du chemin).
# Doctrine ADR-0001 : le script agrège/trie, le LLM juge. NE PAS éditer PORTFOLIO.md à la main.
#
# Usage : portfolio.sh [racine-vectorz]   (défaut : parent de products/, déduit de bin/)
set -euo pipefail

ROOT="${1:-"$(cd "$(dirname "$0")/../../.." && pwd)"}"
cd "$ROOT"
[ -d features ] || { echo "erreur: pas de features/ à la racine ${ROOT}" >&2; exit 1; }

SEP=$'\x1f'
OUT="PORTFOLIO.md"

# extract $1=file → id,title,type,prio,status,pr,ready,created,version,epic,product
extract() {
  awk '
    function unquote(s) { gsub(/^"|"$/, "", s); return s }
    BEGIN { infm=0; product="vectorz" }
    /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
    infm==1 {
      if ($0 ~ /^id:/)       { sub(/^id:[[:space:]]*/, "");       id=$0 }
      if ($0 ~ /^product:/)  { sub(/^product:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); product=$0 }
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
  ' "$1"
}

rows=""
for f in features/[0-9]*.md; do
  [ -e "$f" ] || continue
  rows="${rows}$(extract "$f")"$'\n'
done

st_label() {
  case "$1" in
    shipped) echo '✅ shipped';; in-progress) echo '🟠 in-progress';;
    blocked) echo '⛔ blocked';; idea) echo '💡 idea';; *) echo '🔴 todo';;
  esac
}

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
  echo "# 🗂️ Portfolio Vectorz — liste unique \`features/\`"
  echo ''
  echo '> **Vue de LECTURE auto-générée** (`products/mega-city/bin/portfolio.sh`) sur la'
  echo '> liste unique `features/` (fiche **0064**). Le produit = champ `product:`.'
  echo '> **Ne pas éditer à la main.** Source de vérité = le front-matter de chaque fiche.'
  echo ''

  echo '## 🎯 Tirables maintenant (`ready`)'
  echo ''
  echo 'Les fiches `todo` passées au gate DoR (`ready:`), ordre P0→P3, puis produit, puis id.'
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

  echo '## 📊 Compteurs (déterministes)'
  echo ''
  printf '%s' "$rows" | awk -F"$SEP" '
    NF {
      p=$11; tot[p]++;
      if ($3=="epic") { epic[p]++; next }
      st[p"/"$5]++
      if ($5=="todo" && $7!="") ready[p]++
      if (!(p in seen)) { seen[p]=1; order[++n]=p }
    }
    END {
      printf "| Produit | Total | 🔴 todo (ready) | 🟠 in-prog | ⛔ blocked | 💡 idea | 🧭 épics |\n"
      printf "|---------|-------|-----------------|-----------|-----------|---------|---------|\n"
      for (i=1;i<=n;i++){ p=order[i];
        printf "| %s | %d | %d (%d) | %d | %d | %d | %d |\n", p, tot[p]+0, \
          st[p"/todo"]+0, ready[p]+0, st[p"/in-progress"]+0, st[p"/blocked"]+0, st[p"/idea"]+0, epic[p]+0 }
    }'
  echo ''
  echo '> Ne compte pas les fiches livrées (`done/`) — voir `features/README.md`.'
} > "$OUT"

echo "${OUT} régénéré."
