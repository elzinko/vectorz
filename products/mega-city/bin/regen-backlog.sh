#!/usr/bin/env bash
# Régénère features/README.md depuis les front-matters (source de vérité).
# Déterministe : tri P0→P3 puis id ; aucun jugement. cf. ADR-0001 §2 (le script range).
set -euo pipefail
cd "$(dirname "$0")/.."

SEP=$'\x1f'

extract() { # $1=file → champs séparés par \x1f : id, title, type, priority, status, pr, ready, created
  awk '
    function unquote(s) { gsub(/^"|"$/, "", s); return s }
    BEGIN { infm=0 }
    /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
    infm==1 {
      if ($0 ~ /^id:/)       { sub(/^id:[[:space:]]*/, "");       id=$0 }
      if ($0 ~ /^title:/)    { sub(/^title:[[:space:]]*/, "");    title=unquote($0) }
      if ($0 ~ /^type:/)     { sub(/^type:[[:space:]]*/, "");     sub(/[[:space:]]*#.*$/, ""); type=$0 }
      if ($0 ~ /^priority:/) { sub(/^priority:[[:space:]]*/, ""); sub(/[[:space:]]*#.*$/, ""); prio=$0 }
      if ($0 ~ /^status:/)   { sub(/^status:[[:space:]]*/, "");   sub(/[[:space:]]*#.*$/, ""); status=$0 }
      if ($0 ~ /^pr:/)       { sub(/^pr:[[:space:]]*/, "");       pr=unquote($0) }
      if ($0 ~ /^ready:/)    { sub(/^ready:[[:space:]]*/, "");    sub(/[[:space:]]*#.*$/, ""); ready=$0 }
      if ($0 ~ /^created:/)  { sub(/^created:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); created=$0 }
    }
    END { printf "%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\n", id, title, type, prio, status, pr, ready, created }
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

{
  echo '# Backlog — mega-city'
  echo ''
  echo '> Index auto-généré (`bin/regen-backlog.sh`, appelé par `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.'
  echo '> 1 fiche / sujet · 1 PR / feature · backlog commité sur `main`. Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.'
  echo ''
  echo '| # | Titre | Type | Prio | Statut | PR |'
  echo '|---|-------|------|------|--------|----|'
  printf '%s' "$rows" | awk -F"$SEP" '$5 != "idea"' | sort -t"$SEP" -k4,4 -k1,1 | while IFS="$SEP" read -r id title type prio status pr ready created; do
    case "$status" in
      shipped) st='✅ shipped';;
      in-progress) st='🟠 in-progress';;
      blocked) st='⛔ blocked';;
      *) st='🔴 todo';;
    esac
    title="${title//|/\\|}"
    pr="${pr//|/\\|}"
    echo "| $id | $title | $type | $prio | $st | $pr |"
  done

  ideas="$(printf '%s' "$rows" | awk -F"$SEP" '$5 == "idea"')"
  if [ -n "$ideas" ]; then
    echo ''
    echo '## 💡 Idées (non groomées)'
    echo ''
    echo '| # | Titre | Type | Prio | Statut | PR |'
    echo '|---|-------|------|------|--------|----|'
    printf '%s\n' "$ideas" | sort -t"$SEP" -k4,4 -k1,1 | while IFS="$SEP" read -r id title type prio status pr ready created; do
      title="${title//|/\\|}"
      pr="${pr//|/\\|}"
      echo "| $id | $title | $type | $prio | 💡 idea | $pr |"
    done
  fi
  echo ''
  echo "> Livrées (\`done/\`) : $(echo "$done_ids" | tr ' ' '\n' | grep -v '^$' | sort | paste -sd ',' - | sed 's/,/, /g')."
} > features/README.md

echo "features/README.md régénéré ($(printf '%s' "$rows" | grep -c .) fiches)."

# Compteurs déterministes (ADR-0016 §5 / fiche 0065) — le script compte, le LLM juge.
printf '%s' "$rows" | awk -F"$SEP" '
  NF { n++; c[$5]++; if ($5=="todo" && $7!="") r++ }
  END { printf "stats: total=%d · idea=%d · todo=%d (dont ready=%d) · in-progress=%d · blocked=%d · shipped=%d\n", \
        n, c["idea"], c["todo"], r, c["in-progress"], c["blocked"], c["shipped"] }'
median="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="todo" && $8!="" { print $8 }' | sort | awk '{ a[NR]=$0 } END { if (NR) print a[int((NR+1)/2)] }')"
if [ -n "$median" ]; then
  echo "stats: création médiane des todo = ${median}"
fi
