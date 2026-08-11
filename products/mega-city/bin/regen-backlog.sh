#!/usr/bin/env bash
# Régénère l'index features/BACKLOG.md depuis les front-matters (source de vérité).
# Déterministe : tri P0→P3 puis id ; aucun jugement. cf. ADR-0001 §2 (le script range).
# Layout v2 (Skema) : README.md = guide humain curé ; BACKLOG.md = index généré.
# Usage : regen-backlog.sh [racine-projet] [titre-index]   (fiche 0072 / ADR-0017 A13)
#
# Deux copies à garder alignées (corps identique après set -euo) :
#   products/mega-city/bin/regen-backlog.sh  (source monorepo)
#   skills/ezk-backlog/scripts/regen-backlog.sh  (vendored skill-only)
#   Si $0 est sous …/bin/, défaut racine = parent du bin (produit mega-city) ;
#   sinon racine **obligatoire** (pas de défaut vers le dossier skill).
#   Backlog racine vectorz : regen-backlog.sh <racine-vectorz> "Backlog features & bugs — vectorz"
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
if [[ -n "${1:-}" ]]; then
  ROOT="$1"
elif [[ "$(basename "$_SCRIPT_DIR")" == "bin" ]]; then
  ROOT="$(cd "$_SCRIPT_DIR/.." && pwd)"
else
  echo "erreur: racine-projet obligatoire (copie skill — pas de défaut produit)" >&2
  exit 1
fi
TITLE="${2:-Backlog — mega-city}"
cd "$ROOT"
[ -d features ] || { echo "erreur: pas de dossier features/ dans ${ROOT}" >&2; exit 1; }

SEP=$'\x1f'

extract() { # $1=file → champs \x1f : id, title, type, priority, status, pr, ready, created, version, epic, product
  awk '
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
      if ($0 ~ /^product:/)  { sub(/^product:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); product=unquote($0) }
    }
    END { printf "%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\n", id, title, type, prio, status, pr, ready, created, version, epic, product }
  ' "$1"
}

rows=""
done_ids=""
for f in features/[0-9]*.md features/done/[0-9]*.md; do
  [ -e "$f" ] || continue
  line="$(extract "$f")"
  rows="${rows}${line}"$'\n'
  case "$f" in features/done/*) done_ids="${done_ids} ${line%%${SEP}*}";; esac
done

# Intégrité épics (ADR-0017 A7) + unicité des ids (fiche 0064) — warnings non bloquants.
printf '%s' "$rows" | awk -F"$SEP" '
  NF {
    nr++; rowid[nr]=$1; rowtype[nr]=$3; ref[nr]=$10
    if ($3 == "epic") isepic[$1]=1
    seen[$1]++
  }
  END {
    for (i=1; i<=nr; i++) {
      if (ref[i] != "" && !(ref[i] in isepic))
        printf "warning: fiche %s — epic: %s introuvable ou non-epic\n", rowid[i], ref[i] | "cat 1>&2"
      if (ref[i] != "" && rowtype[i] == "epic")
        printf "warning: fiche %s — une épic ne référence pas d%sépic (2 niveaux max, ADR-0017)\n", rowid[i], "\047" | "cat 1>&2"
    }
    for (id in seen)
      if (seen[id] > 1)
        printf "warning: id %s en double (%d fiches) — collision structurelle\n", id, seen[id] | "cat 1>&2"
  }'

# Colonnes conditionnelles (ADR-0017 A12) : Version / Épic / Produit (0064).
has_version="$(printf '%s' "$rows" | awk -F"$SEP" '$9 != "" { f=1 } END { print f+0 }')"
has_epic_col="$(printf '%s' "$rows" | awk -F"$SEP" '$10 != "" { f=1 } END { print f+0 }')"
has_product="$(printf '%s' "$rows" | awk -F"$SEP" '$11 != "" { f=1 } END { print f+0 }')"
has_epics="$(printf '%s' "$rows" | awk -F"$SEP" '$3 == "epic" { f=1 } END { print f+0 }')"

cols='| # | Titre | Type | Prio |'
dash='|---|-------|------|------|'
if [ "$has_version" = 1 ]; then cols="${cols} Version |"; dash="${dash}---------|"; fi
if [ "$has_epic_col" = 1 ]; then cols="${cols} Épic |"; dash="${dash}------|"; fi
if [ "$has_product" = 1 ]; then cols="${cols} Produit |"; dash="${dash}---------|"; fi
cols="${cols} Statut | PR |"
dash="${dash}--------|----|"

emit_row() { # $1..$11 = champs ; émet une ligne de table avec les colonnes actives
  local id="$1" title="$2" type="$3" prio="$4" status="$5" pr="$6" version="$9" epic="${10}" product="${11}"
  local st
  case "$status" in
    shipped) st='✅ shipped';;
    in-progress) st='🟠 in-progress';;
    blocked) st='⛔ blocked';;
    idea) st='💡 idea';;
    *) st='🔴 todo';;
  esac
  title="${title//|/\\|}"
  pr="${pr//|/\\|}"
  local line="| $id | $title | $type | $prio |"
  if [ "$has_version" = 1 ]; then line="${line} ${version} |"; fi
  if [ "$has_epic_col" = 1 ]; then line="${line} ${epic} |"; fi
  if [ "$has_product" = 1 ]; then line="${line} ${product} |"; fi
  echo "${line} $st | $pr |"
}

{
  echo "# ${TITLE}"
  echo ''
  echo '> Index auto-généré (`regen-backlog.sh` mega-city, via `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.'
  echo '> Guide du dossier : [README.md](README.md). Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.'
  # Lien vers la séquence décidée (PLAN.md, curée hors index) — ré-émis à chaque regen
  # pour qu'il survive à la régénération (le contenu de PLAN.md n'est pas touché).
  if [ -f features/PLAN.md ]; then
    echo ''
    echo '> 📋 Séquence décidée (curée, hors index) : [PLAN.md](PLAN.md).'
  fi
  echo ''
  echo "$cols"
  echo "$dash"
  printf '%s' "$rows" | awk -F"$SEP" '$5 != "idea" && $3 != "epic"' | sort -t"$SEP" -k4,4 -k1,1 | \
    while IFS="$SEP" read -r id title type prio status pr ready created version epic product; do
      emit_row "$id" "$title" "$type" "$prio" "$status" "$pr" "$ready" "$created" "$version" "$epic" "$product"
    done

  if [ "$has_epics" = 1 ]; then
    echo ''
    echo '## 🧭 Épics (jamais tirables — tirer leurs enfants ready, ADR-0017)'
    echo ''
    echo "$cols"
    echo "$dash"
    printf '%s' "$rows" | awk -F"$SEP" '$3 == "epic"' | sort -t"$SEP" -k4,4 -k1,1 | \
      while IFS="$SEP" read -r id title type prio status pr ready created version epic product; do
        emit_row "$id" "$title" "$type" "$prio" "$status" "$pr" "$ready" "$created" "$version" "$epic" "$product"
      done
  fi

  ideas="$(printf '%s' "$rows" | awk -F"$SEP" '$5 == "idea" && $3 != "epic"')"
  if [ -n "$ideas" ]; then
    echo ''
    echo '## 💡 Idées (non groomées)'
    echo ''
    echo "$cols"
    echo "$dash"
    printf '%s\n' "$ideas" | sort -t"$SEP" -k4,4 -k1,1 | \
      while IFS="$SEP" read -r id title type prio status pr ready created version epic product; do
        emit_row "$id" "$title" "$type" "$prio" "$status" "$pr" "$ready" "$created" "$version" "$epic" "$product"
      done
  fi
  echo ''
  echo "> Livrées (\`done/\`) : $(echo "$done_ids" | tr ' ' '\n' | grep -v '^$' | sort | paste -sd ',' - | sed 's/,/, /g')."
} > features/BACKLOG.md

echo "features/BACKLOG.md régénéré ($(printf '%s' "$rows" | grep -c .) fiches)."

# Compteurs déterministes (ADR-0016 §5 / fiche 0071) — le script compte, le LLM juge.
printf '%s' "$rows" | awk -F"$SEP" '
  NF { n++; c[$5]++; if ($5=="todo" && $7!="" && $3!="epic") r++; if ($3=="epic") e++ }
  END { printf "stats: total=%d · idea=%d · todo=%d (dont ready=%d) · in-progress=%d · blocked=%d · shipped=%d · épics=%d\n", \
        n, c["idea"], c["todo"], r, c["in-progress"], c["blocked"], c["shipped"], e }'
median="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="todo" && $8!="" { print $8 }' | sort | awk '{ a[NR]=$0 } END { if (NR) print a[int((NR+1)/2)] }')"
if [ -n "$median" ]; then
  echo "stats: création médiane des todo = ${median}"
fi
