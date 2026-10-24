#!/usr/bin/env bash
# Régénère l'index features/BACKLOG.md depuis les front-matters (source de vérité).
# Déterministe : tri P0→P3 puis id ; aucun jugement. cf. ADR-0001 §2 (le script range).
# Layout v2 (Skema) : README.md = guide humain curé ; BACKLOG.md = index généré.
# Usage : regen-backlog.sh [racine-projet] [titre-index]   (fiche 0072 / ADR-0017 A13)
#
# Deux copies à garder alignées (corps identique après set -euo) :
#   products/mega-city/bin/regen-backlog.sh  (source monorepo)
#   skills/ezk-backlog/scripts/regen-backlog.sh  (vendored skill-only)
#   Si $0 est sous …/bin/, défaut racine = parent du bin — valable pour un projet AUTONOME
#   seulement : si un ancêtre porte déjà un backlog (features/), la racine est NICHÉE et le
#   script REFUSE (fiche 20260823121712844) ; sinon racine **obligatoire** (pas de défaut
#   vers le dossier skill).
#   Backlog racine vectorz : regen-backlog.sh <racine-vectorz>   (titre lu dans features/README.md)
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Arguments. `--root <chemin>` et `--title <titre>` sont des DRAPEAUX : jamais confondus avec un
# positionnel, jamais pris pour un titre. La forme historique positionnelle [racine] [titre] reste
# acceptée. Un drapeau INCONNU échoue (code 2) au lieu d'être avalé ou glissé dans le H1 — sinon
# `regen --root <x>` écrivait « # --root » en tête de BACKLOG.md (fiche 20261011091552583).
ROOT=""
TITLE=""
_positionals=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --root) ROOT="${2:-}"; [[ -n "$ROOT" ]] || { echo "erreur: --root attend un chemin" >&2; exit 2; }; shift 2;;
    --root=*) ROOT="${1#--root=}"; shift;;
    --title) TITLE="${2:-}"; [[ -n "$TITLE" ]] || { echo "erreur: --title attend un titre" >&2; exit 2; }; shift 2;;
    --title=*) TITLE="${1#--title=}"; shift;;
    --) shift; while [[ $# -gt 0 ]]; do _positionals+=("$1"); shift; done;;
    --*) echo "erreur: drapeau inconnu: $1 (attendu --root <chemin> ou --title <titre>)" >&2; exit 2;;
    *) _positionals+=("$1"); shift;;
  esac
done
# Compat positionnelle [racine] [titre], seulement si le drapeau ne l'a pas déjà fixé.
[[ -z "$ROOT" && -n "${_positionals[0]:-}" ]] && ROOT="${_positionals[0]}"
[[ -z "$TITLE" && -n "${_positionals[1]:-}" ]] && TITLE="${_positionals[1]}"

if [[ -n "$ROOT" ]]; then
  : # racine fournie (drapeau --root ou positionnel)
elif [[ "$(basename "$_SCRIPT_DIR")" == "bin" ]]; then
  ROOT="$(cd "$_SCRIPT_DIR/.." && pwd)"
  # Défaut « parent du bin » refusé s'il est NICHÉ sous un autre backlog (ex. products/mega-city
  # sous la racine vectorz, depuis la liste unique de la fiche 0064) : le viser créerait un
  # backlog fantôme. Refus AVANT toute écriture ; la racine explicite reste toujours permise.
  _outer="$(dirname "$ROOT")"
  while [[ "$_outer" != "/" ]]; do
    if [[ -d "$_outer/features" ]]; then
      echo "erreur: racine nichée — ${ROOT} est sous ${_outer}, qui a déjà un backlog features/. Passe la vraie racine explicitement : regen-backlog.sh ${_outer}" >&2
      exit 1
    fi
    _outer="$(dirname "$_outer")"
  done
else
  echo "erreur: racine-projet obligatoire (copie skill — pas de défaut produit)" >&2
  exit 1
fi
cd "$ROOT"
[ -d features ] || { echo "erreur: pas de dossier features/ dans ${ROOT}" >&2; exit 1; }

# Titre de l'index (ligne 1) : le titre passé (--title ou positionnel), sinon `backlog_title:` dans
# l'en-tête de features/README.md, sinon un titre neutre. Le projet déclare son titre une fois et
# tous les outils le lisent : un appelant qui passerait le sien ferait basculer la ligne 1 d'un
# outil à l'autre (défaut constaté le 2026-10-02, « Backlog — mega-city » ↔ « … — vectorz »).
if [[ -z "$TITLE" && -f features/README.md ]]; then
  TITLE="$(awk '
    NR == 1 && !/^---[[:space:]]*$/ { exit }
    /^---[[:space:]]*$/ { fm++; if (fm == 2) exit; next }
    fm == 1 && /^backlog_title:/ {
      t = $0; sub(/^backlog_title:[[:space:]]*/, "", t); sub(/[[:space:]]+$/, "", t)
      q = substr(t, 1, 1)   # valeur YAML entre guillemets ou entre apostrophes : on retire la paire
      if (length(t) >= 2 && (q == "\"" || q == "\047") && substr(t, length(t), 1) == q) {
        t = substr(t, 2, length(t) - 2)
        if (q == "\047") gsub("\047\047", "\047", t)   # entre apostrophes, YAML écrit une apostrophe en double
      }
      print t; exit
    }
  ' features/README.md)"
fi
TITLE="${TITLE:-Backlog features & bugs}"

SEP=$'\x1f'

# Schéma des statuts — MIROIR de src/core/fiche-schema.ts (STATUT_DEFS : id=libellé, dans l'ordre du flux).
# Gardé par le test de contrat src/__tests__/fiche-schema-contract.test.ts : ajouter un statut au schéma
# sans le mettre ici fait échouer la suite. Libellés, légende et compteurs en dérivent — aucune autre liste.
STATUT_LABELS='idea=💡 idea|ready=🔵 ready|in-progress=🟠 in-progress|shipped=✅ shipped|superseded=🗑️ superseded|merged=🔀 merged|split=🧩 split'

label_of() { # $1=statut → LABEL (sans sous-shell) ; « ❓ statut » si inconnu — le validateur le signale
  local s="|${STATUT_LABELS}"
  case "$s" in
    *"|$1="*) LABEL="${s#*"|$1="}"; LABEL="${LABEL%%|*}";;
    *) LABEL="❓ $1";;
  esac
}

extract() { # $1=file → champs \x1f : id, title, type, priority, status, pr, created, version, product, milestone
  # Le type/champ `epic` a été retiré du modèle (ADR-0017 A16) : plus émis. 10 champs (product=9, milestone=10).
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
      if ($0 ~ /^created:/)  { sub(/^created:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); created=$0 }
      if ($0 ~ /^version:/)  { sub(/^version:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); version=unquote($0) }
      if ($0 ~ /^product:/)  { sub(/^product:[[:space:]]*/, "");  sub(/[[:space:]]*#.*$/, ""); product=unquote($0) }
      if ($0 ~ /^milestone:/){ sub(/^milestone:[[:space:]]*/, ""); sub(/[[:space:]]*#.*$/, ""); milestone=unquote($0) }
    }
    END { printf "%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\x1f%s\n", id, title, type, prio, status, pr, created, version, product, milestone }
  ' "$1"
}

rows=""
for f in features/[0-9]*.md features/done/[0-9]*.md; do
  [ -e "$f" ] || continue
  line="$(extract "$f")"
  # 11e champ = chemin de la fiche RELATIF à features/ (donc relatif à features/BACKLOG.md,
  # le document généré). Lien document-relative : `0050-slug.md`, `done/0000-slug.md` —
  # PAS `features/…` (qui, DANS BACKLOG.md, résoudrait `features/features/…`, revue Codex #184).
  rows="${rows}${line}${SEP}${f#features/}"$'\n'
done

# Unicité des ids (fiche 0064) — warning non bloquant. (L'intégrité épics a été retirée avec le type
# `epic`, ADR-0017 A16 : plus de référence inter-fiches à vérifier ici.)
printf '%s' "$rows" | awk -F"$SEP" '
  NF { seen[$1]++ }
  END {
    for (id in seen)
      if (seen[id] > 1)
        printf "warning: id %s en double (%d fiches) — collision structurelle\n", id, seen[id] | "cat 1>&2"
  }'

# Colonnes conditionnelles (ADR-0017 A12) : Version / Produit (0064). (Colonne Épic retirée — A16.)
has_version="$(printf '%s' "$rows" | awk -F"$SEP" '$8 != "" { f=1 } END { print f+0 }')"
has_product="$(printf '%s' "$rows" | awk -F"$SEP" '$9 != "" { f=1 } END { print f+0 }')"

cols='| # | Titre | Type | Prio |'
dash='|---|-------|------|------|'
if [ "$has_version" = 1 ]; then cols="${cols} Version |"; dash="${dash}---------|"; fi
if [ "$has_product" = 1 ]; then cols="${cols} Produit |"; dash="${dash}---------|"; fi
cols="${cols} Statut | PR |"
dash="${dash}--------|----|"

emit_row() { # $1..$9 = champs + $10 = chemin relatif ; émet une ligne de table
  local id="$1" title="$2" type="$3" prio="$4" status="$5" pr="$6" version="$8" product="$9" rel="${10}"
  local st
  label_of "$status"; st="$LABEL"
  title="${title//|/\\|}"
  pr="${pr//|/\\|}"
  # Id CLIQUABLE vers la fiche (règle human-facing-lisibility) — lien relatif au doc BACKLOG.md.
  local id_cell="$id"
  [ -n "$rel" ] && id_cell="[$id]($rel)"
  local line="| $id_cell | $title | $type | $prio |"
  if [ "$has_version" = 1 ]; then line="${line} ${version} |"; fi
  if [ "$has_product" = 1 ]; then line="${line} ${product} |"; fi
  echo "${line} $st | $pr |"
}

legend=""
IFS='|' read -r -a _pairs <<< "$STATUT_LABELS"
for _p in "${_pairs[@]}"; do legend="${legend:+${legend} · }${_p#*=}"; done

{
  echo "# ${TITLE}"
  echo ''
  echo '> Index auto-généré (`regen-backlog.sh` mega-city, via `/ezk-backlog regen`) — **ne pas éditer à la main**. Source de vérité = le front-matter de chaque fiche.'
  echo "> Guide du dossier : [README.md](README.md). Statuts : ${legend}."
  # Lien vers la séquence décidée (PLAN.md, curée hors index) — ré-émis à chaque regen
  # pour qu'il survive à la régénération (le contenu de PLAN.md n'est pas touché).
  if [ -f features/PLAN.md ]; then
    echo ''
    echo '> 📋 Séquence décidée (curée, hors index) : [PLAN.md](PLAN.md).'
  fi
  echo ''
  echo "$cols"
  echo "$dash"
  printf '%s' "$rows" | awk -F"$SEP" '$5 != "idea"' | sort -t"$SEP" -k4,4 -k1,1 | \
    while IFS="$SEP" read -r id title type prio status pr created version product milestone rel; do
      emit_row "$id" "$title" "$type" "$prio" "$status" "$pr" "$created" "$version" "$product" "$rel"
    done

  ideas="$(printf '%s' "$rows" | awk -F"$SEP" '$5 == "idea" && $10 != "parked"')"
  if [ -n "$ideas" ]; then
    echo ''
    echo '## 💡 Idées (non groomées)'
    echo ''
    echo "$cols"
    echo "$dash"
    printf '%s\n' "$ideas" | sort -t"$SEP" -k4,4 -k1,1 | \
      while IFS="$SEP" read -r id title type prio status pr created version product milestone rel; do
        emit_row "$id" "$title" "$type" "$prio" "$status" "$pr" "$created" "$version" "$product" "$rel"
      done
  fi

  # Parkées : fiches `idea` explicitement sorties du flux via `milestone: parked` (jalon
  # fermé par le PO) — hors tirage ET hors « Idées », pour que la liste active dise vrai.
  parked="$(printf '%s' "$rows" | awk -F"$SEP" '$5 == "idea" && $10 == "parked"')"
  if [ -n "$parked" ]; then
    echo ''
    echo '## ⏸️ Parkées (hors flux — jalon fermé par le PO, à rouvrir pour tirer)'
    echo ''
    echo "$cols"
    echo "$dash"
    printf '%s\n' "$parked" | sort -t"$SEP" -k4,4 -k1,1 | \
      while IFS="$SEP" read -r id title type prio status pr created version product milestone rel; do
        emit_row "$id" "$title" "$type" "$prio" "$status" "$pr" "$created" "$version" "$product" "$rel"
      done
  fi
  echo ''
  # Livrées : ids CLIQUABLES vers done/<fiche> (lien relatif au doc BACKLOG.md), triés par id.
  # Filtre `shipped` : une fiche `superseded` vit dans done/ mais n'est PAS livrée — elle reste
  # dans la table principale en 🗑️ ; ne pas la lister ici sous « Livrées » (revue 2026-09-10).
  done_summary="$(printf '%s' "$rows" | awk -F"$SEP" '$11 ~ /^done\// && $5 == "shipped"{ print $1 "\t" $11 }' | sort -k1,1 | awk -F'\t' 'NF{ printf "%s[%s](%s)", sep, $1, $2; sep=", " }')"
  echo "> Livrées (\`done/\`) : ${done_summary}."
} > features/BACKLOG.md

echo "features/BACKLOG.md régénéré ($(printf '%s' "$rows" | grep -c .) fiches)."

# Compteurs déterministes (ADR-0016 §5 / fiche 0071) — le script compte, le LLM juge.
order="$(printf '%s' "$STATUT_LABELS" | tr '|' '\n' | cut -d= -f1 | tr '\n' ' ')"
printf '%s' "$rows" | awk -F"$SEP" -v order="$order" '
  NF { n++; c[$5]++; if ($5=="idea" && $10=="parked") p++ }
  END {
    printf "stats: total=%d", n
    k = split(order, ids, " ")
    for (i = 1; i <= k; i++) {
      printf " · %s=%d", ids[i], c[ids[i]] + 0
      if (ids[i] == "idea") printf " · parked=%d", p + 0
    }
    printf "\n"
  }'
median="$(printf '%s' "$rows" | awk -F"$SEP" '$5=="ready" && $7!="" { print $7 }' | sort | awk '{ a[NR]=$0 } END { if (NR) print a[int((NR+1)/2)] }')"
if [ -n "$median" ]; then
  echo "stats: création médiane des ready = ${median}"
fi
