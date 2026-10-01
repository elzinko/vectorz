#!/usr/bin/env bash
# ezk-sprint:start / ezk-sprint:close — le cycle de vie du SPRINT (fiche 20260930123438875, ADR-0054).
#
# Un sprint = un LOT de stories → un incrément. Ce script porte le MÉCANISME déterministe
# (ADR-0051 : cœur = script, jugement = LLM). Le choix du lot (planning) et l'intake
# (reconcile, review, next) restent du jugement : ils sont décrits dans SKILL.md.
#
#   start --dry-run        ≡ `check` : exactement le portier, strictement READ-ONLY.
#   start --lot <ids>      passe le portier puis écrit SPRINT.md (gitignoré). N'écrit RIEN d'autre :
#                          ni branche, ni commit, ni statut de fiche.
#   close                  scelle l'incrément. Ne touche JAMAIS la session (docs/sessions/,
#                          .claude/handoff.md) : c'est le métier d'ezk-archive.
#   close --abandon "<r>"  fin ANORMALE : ferme le sprint sans incrément. Seule sortie quand rien
#                          n'est livré (ou que le PO arrête). Le savoir de session est conservé.
#
# CONTRAT — comme check.sh, le verdict passe par stdout, jamais par le code retour :
#   exit 0 pour tout verdict ; exit 2 = erreur d'usage, écriture impossible, ou pas un dépôt git.
#   start : START: OPENED sprint=<n> stories=<k>
#         | START: REFUSED gate=ALERT            (suivi du bloc du portier)
#         | START: REFUSED open_sprint sprint=<n>
#         | START: REFUSED lot_unknown id=<id>
#   close : CLOSE: SEALED sprint=<n> done=<d> deferred=<r>
#         | CLOSE: OPEN sprint=<n> open=<k>      (une story du lot est encore ouverte)
#         | CLOSE: REFUSED not_open
#         | CLOSE: REFUSED empty_increment sprint=<n>   (rien de livré : pas d'incrément à sceller)
#         | CLOSE: ABANDONED sprint=<n> done=<d> deferred=<r> open=<o>   (close --abandon)
#   Les refus de close ajoutent une ligne `HINT:` quand --abandon est la sortie.
#   Chaque réponse finit par `--- END ---`.
#
# Format du lot dans SPRINT.md : `- [ ] <id> — <titre>` ouverte · `- [x] …` livrée · `- [~] …` reportée.
# Une référence de PR ou de commit en fin de ligne — `(PR #12)`, `(#12)`, `(local abc1234)` — est reprise
# dans l'incrément ; toute autre parenthèse (un bout de titre) est ignorée.
# Sections portées d'un sprint au suivant (savoir de SESSION) : Notes / décisions, Galères & gestes (labo),
# Incréments scellés de la session. Le lot, lui, est propre à chaque sprint.

set -uo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
MC="$(cd "$HERE/../../.." && pwd)" # products/mega-city
CHECK="$HERE/check.sh"
FILE="SPRINT.md"
H_NOTES="## Notes / décisions"
H_LABO="## Galères & gestes (labo)" # titre exact : lu par ezk-archive et ezk-chef
H_SEALED="## Incréments scellés de la session"

usage() {
  cat <<'USAGE'
sprint.sh — cycle de vie du sprint (ezk-sprint start / close, ADR-0054)

  start --dry-run                  ≡ `check` : le portier, strictement read-only
  start --lot <id[,id…]>           ouvre un sprint (passe le portier, écrit SPRINT.md)
        [--objective "<texte>"]    objectif du sprint (titre de SPRINT.md)
        [--override "<raison>"]    passe outre un portier ALERT ; la raison est journalisée
  close                            scelle l'incrément (refuse si une story du lot est ouverte)
  close --abandon "<raison>"       fin anormale : ferme le sprint SANS incrément (raison journalisée)
  -h, --help                       cette aide
  Dernier argument optionnel : <racine> du dépôt.
USAGE
}
die_usage() { echo "sprint.sh : $1" >&2; usage >&2; exit 2; }
end() { echo "--- END ---"; exit 0; }

CMD="${1:-}"
case "$CMD" in
  start|close) shift ;;
  -h|--help)   usage; exit 0 ;;
  "")          die_usage "sous-commande attendue (start|close)" ;;
  *)           die_usage "sous-commande inconnue « $CMD »" ;;
esac

DRY=0; LOT=""; OBJ=""; OVERRIDE=""; HAS_OVERRIDE=0; ABANDON=""; HAS_ABANDON=0; ROOT=""
while (( $# )); do
  case "$1" in
    --dry-run)   DRY=1 ;;
    --lot)       [[ $# -ge 2 ]] || die_usage "--lot demande une valeur"; LOT="$2"; shift ;;
    --objective) [[ $# -ge 2 ]] || die_usage "--objective demande une valeur"; OBJ="$2"; shift ;;
    --override)  [[ $# -ge 2 ]] || die_usage "--override demande une raison"; OVERRIDE="$2"; HAS_OVERRIDE=1; shift ;;
    --abandon)   [[ $# -ge 2 ]] || die_usage "--abandon demande une raison"; ABANDON="$2"; HAS_ABANDON=1; shift ;;
    -h|--help)   usage; exit 0 ;;
    --*)         die_usage "option inconnue « $1 »" ;;
    *)           ROOT="$1" ;;
  esac
  shift
done
if (( DRY )) && [[ "$CMD" != "start" ]]; then die_usage "--dry-run n'existe que pour start"; fi
if (( HAS_ABANDON )) && [[ "$CMD" != "close" ]]; then die_usage "--abandon n'existe que pour close"; fi
if (( HAS_OVERRIDE )) && [[ "$CMD" != "start" ]]; then die_usage "--override n'existe que pour start"; fi
if (( HAS_OVERRIDE )) && [[ -z "${OVERRIDE//[[:space:]]/}" ]]; then
  die_usage "--override exige une raison non vide (elle est journalisée)"
fi
if (( HAS_ABANDON )) && [[ -z "${ABANDON//[[:space:]]/}" ]]; then
  die_usage "--abandon exige une raison non vide (elle est journalisée)"
fi

if [[ -n "$ROOT" ]]; then cd "$ROOT" || exit 2; fi
if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "✗ pas dans un dépôt git." >&2
  exit 2
fi
cd "$(git rev-parse --show-toplevel)" || exit 2

# `check` ≡ `start --dry-run` : on rend la main au portier, tel quel. Rien n'est écrit.
if (( DRY )); then exec bash "$CHECK" --gate; fi

# --- lecture de SPRINT.md ----------------------------------------------------------
sprint_state() { # none | open | closed — un SPRINT.md d'ancien format (sans `Statut: clos`) compte comme ouvert
  if [[ ! -s "$FILE" ]]; then echo none; return; fi
  if head -5 "$FILE" | grep -q 'Statut:[[:space:]]*clos'; then echo closed; else echo open; fi
}
sprint_number() { # numéro lu dans l'en-tête « # Sprint N — … » (0 si absent)
  local n
  n="$(sed -nE 's/^# Sprint ([0-9]+).*/\1/p' "$FILE" 2>/dev/null | head -1)"
  echo "${n:-0}"
}
sprint_objective() {
  sed -nE 's/^# Sprint [0-9]+ — (.*)$/\1/p' "$FILE" 2>/dev/null | head -1
}
lot_lines() { # les cases du lot (section `## Lot`, ou `## Backlog` des anciens SPRINT.md)
  awk '
    /^## (Lot|Backlog)/      { inlot=1; next }
    /^## /                   { inlot=0 }
    inlot && /^- \[[ x~]\] / { print }
  ' "$FILE"
}
count_lot() { lot_lines | grep -c -F -- "- [$1] " || true; }
section_body() { # $1 = titre de section (préfixe) ; imprime son corps sans lignes vides de bord
  awk -v h="$1" '
    index($0, h) == 1 { on=1; next }
    /^## /            { on=0 }
    on                { l[++n]=$0 }
    END {
      s=1; while (s<=n && l[s] ~ /^[[:space:]]*$/) s++
      e=n; while (e>=s && l[e] ~ /^[[:space:]]*$/) e--
      for (i=s; i<=e; i++) print l[i]
    }
  ' "$2"
}
plural() { if (( $1 > 1 )); then echo "$2s"; else echo "$2"; fi; }
item_of() { # $1 = ligne de lot sans sa case → « id » ou « id (réf) » ; la réf doit ressembler à une PR ou un commit
  local rest="$1" id grp ref=""
  local re_pr='^(PR[[:space:]]+)?#[0-9]+'
  local re_sha='^(local[[:space:]]+)?[0-9a-f]{7,40}([^0-9a-zA-Z]|$)'
  grp="$(printf '%s\n' "$rest" | sed -nE 's/.*\(([^()]*)\)[[:space:]]*$/\1/p')"
  if [[ -n "$grp" ]]; then
    if [[ "$grp" =~ $re_pr ]] || [[ "$grp" =~ $re_sha ]]; then ref="$grp"; fi
  fi
  if [[ "$rest" == *" — "* ]]; then
    id="${rest%% — *}"
  else # ancien format : pas de « — », on garde le libellé sans sa parenthèse finale
    id="$(printf '%s\n' "$rest" | sed -E 's/[[:space:]]*\([^()]*\)[[:space:]]*$//')"
  fi
  if [[ -n "$ref" ]]; then echo "${id} (${ref})"; else echo "${id}"; fi
}
fiche_path() { # $1 = id → chemin de la fiche active (features/, résolu par NOM de fichier), vide si introuvable
  local f
  for f in features/"$1"_*.md features/"$1"-*.md; do
    if [[ -e "$f" ]]; then echo "$f"; return; fi
  done
}

# --- start -------------------------------------------------------------------------
sprint_file_content() { # le nouveau SPRINT.md, sur stdout (variables de do_start)
  echo "# Sprint ${n} — ${OBJ:-sans objectif}"
  echo "Statut: en cours   Ouvert: ${today}"
  echo
  echo "## Lot  (1 ligne = 1 story = 1 PR ; [x] livrée · [~] reportée · [ ] ouverte)"
  printf '%s' "$lot_text"
  echo
  echo "$H_NOTES"
  if [[ -n "$notes" ]]; then printf '%s\n' "$notes"; fi
  echo
  echo "$H_LABO"
  if [[ -n "$labo" ]]; then printf '%s\n' "$labo"; fi
  echo
  echo "$H_SEALED"
  if [[ -n "$sealed" ]]; then printf '%s\n' "$sealed"; fi
}

do_start() {
  [[ -n "$LOT" ]] || die_usage "start demande --lot <id[,id…]> (ou --dry-run pour le seul portier)"

  # 1) un seul sprint ouvert à la fois
  if [[ "$(sprint_state)" == "open" ]]; then
    echo "START: REFUSED open_sprint sprint=$(sprint_number)"
    end
  fi

  # 2) le lot : chaque story doit exister dans features/. Un id n'est jamais un motif de glob.
  local ids id f lot_ids=() lot_files=()
  IFS=',' read -r -a ids <<< "$LOT"
  for id in "${ids[@]}"; do
    id="${id//[[:space:]]/}"
    [[ -n "$id" ]] || continue
    f=""
    if [[ "$id" =~ ^[0-9A-Za-z_-]+$ ]]; then f="$(fiche_path "$id")"; fi
    if [[ -z "$f" ]]; then
      echo "START: REFUSED lot_unknown id=$id"
      end
    fi
    lot_ids+=("$id")
    lot_files+=("$f")
  done
  local n_stories=${#lot_ids[@]}
  (( n_stories > 0 )) || die_usage "--lot est vide"

  # Les titres sont LUS PAR LE LOADER (règle development/fiche-read-via-loader), jamais par un awk maison.
  local tsx="$MC/node_modules/.bin/tsx" rows row title i=0 lot_text=""
  [[ -x "$tsx" ]] || { echo "sprint.sh : tsx introuvable ($tsx) — lancer « pnpm install »" >&2; exit 2; }
  rows="$("$tsx" "$MC/bin/fiche-rows.ts" "${lot_files[@]}")" || { echo "sprint.sh : lecture des fiches impossible" >&2; exit 2; }
  while IFS= read -r row; do
    IFS=$'\x1f' read -r _ title _ <<< "$row"
    lot_text="${lot_text}- [ ] ${lot_ids[$i]} — ${title}"$'\n'
    i=$((i + 1))
  done <<< "$rows"

  # 3) le portier : ALERT = choix humain ; seul un override journalisé passe outre
  local gate verdict alert=0
  gate="$(bash "$CHECK" --gate)"
  verdict="$(printf '%s\n' "$gate" | grep -m1 '^VERDICT:' || true)"
  if [[ "$verdict" != "VERDICT: CLEAR" ]]; then alert=1; fi
  if (( alert && ! HAS_OVERRIDE )); then
    echo "START: REFUSED gate=ALERT"
    printf '%s\n' "$gate" # le bloc du portier se termine déjà par `--- END ---`
    exit 0
  fi

  # 4) écriture : le lot est neuf, le savoir de session (notes, labo, incréments) est reporté
  local today prev_n=0 notes="" labo="" sealed="" n
  today="$(date +%F)"
  if [[ -s "$FILE" ]]; then
    prev_n="$(sprint_number)"
    notes="$(section_body "$H_NOTES" "$FILE")"
    labo="$(section_body "$H_LABO" "$FILE")"
    sealed="$(section_body "$H_SEALED" "$FILE")"
  fi
  n=$((prev_n + 1))
  if (( alert )); then
    notes="${notes:+$notes$'\n'}- Override du portier (${verdict#VERDICT: }) — ${OVERRIDE} (${today})"
  fi
  if ! { sprint_file_content > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"; }; then
    echo "sprint.sh : écriture de ${FILE} impossible" >&2
    exit 2
  fi

  echo "START: OPENED sprint=${n} stories=${n_stories}"
  echo "SPRINT_FILE: ${FILE}"
  echo "NEXT: stories — la boucle 1→10 pour chaque story du lot (une PR chacune), puis \`ezk-sprint close\`"
  end
}

# --- close -------------------------------------------------------------------------
write_closed() { # $1 = ligne du journal des incréments ; $2 = raison d'abandon (vide pour un sceau normal)
  local today has_status=1
  today="$(date +%F)"
  head -5 "$FILE" | grep -q 'Statut:' || has_status=0
  SEAL="$1" ABANDON="$2" awk -v today="$today" -v head="$H_SEALED" -v hs="$has_status" '
    function flush() { if (insec && !done) { print ENVIRON["SEAL"]; done=1 } }
    function closed(o,   sfx) {
      sfx = ""; if (ENVIRON["ABANDON"] != "") sfx = "   Abandon: " ENVIRON["ABANDON"]
      return "Statut: clos   " o "Clos: " today sfx
    }
    NR == 1 { print; if (hs == 0) { print closed(""); st=1 }; next }
    NR <= 5 && !st && /Statut:/ {
      # `Statut:` en début de ligne (format actuel) ou en fin de ligne (ancien « Périmètre: … Statut: … »)
      match($0, /Statut:/); pre = substr($0, 1, RSTART - 1)
      o = ""; if (match($0, /Ouvert: [0-9-]+/)) o = substr($0, RSTART, RLENGTH) "   "
      print pre closed(o); st=1; next
    }
    index($0, head) == 1 { print; insec=1; seen=1; next }
    /^## / && insec      { flush(); insec=0 }
    { print }
    END { if (insec) flush(); if (!seen) { print ""; print head; print ENVIRON["SEAL"] } }
  ' "$FILE" > "$FILE.tmp" && mv "$FILE.tmp" "$FILE"
}

do_close() {
  if [[ "$(sprint_state)" != "open" ]]; then
    echo "CLOSE: REFUSED not_open"
    end
  fi

  local n obj n_open n_done n_def
  n="$(sprint_number)"
  obj="$(sprint_objective)"
  n_open="$(count_lot ' ')"
  n_done="$(count_lot x)"
  n_def="$(count_lot '~')"

  if (( ! HAS_ABANDON )); then
    if (( n_open > 0 )); then
      echo "CLOSE: OPEN sprint=${n} open=${n_open}"
      lot_lines | grep -F -- '- [ ] ' | sed -E 's/^- \[ \] /STORY_OPEN: /'
      echo "HINT: termine ou reporte ([~]) ces stories ; ou close --abandon \"<raison>\" si le PO arrête le sprint"
      end
    fi
    if (( n_done == 0 )); then
      echo "CLOSE: REFUSED empty_increment sprint=${n}"
      echo "HINT: rien n'est livré, donc pas d'incrément ; close --abandon \"<raison>\" ferme le sprint sans le sceller"
      end
    fi
  fi

  # les stories livrées : id + référence de PR ou de commit
  local line item inc_lines="" done_items=""
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    item="$(item_of "${line#- \[x\] }")"
    inc_lines="${inc_lines}INCREMENT: ${item}"$'\n'
    done_items="${done_items:+$done_items, }${item}"
  done < <(lot_lines | grep -F -- '- [x] ')

  local seal_line
  if (( HAS_ABANDON )); then
    seal_line="- Sprint ${n} — ${obj:-sans objectif} — abandonné (${ABANDON}) — ${n_done} $(plural "$n_done" livrée), ${n_def} $(plural "$n_def" reportée), ${n_open} $(plural "$n_open" ouverte)${done_items:+ : $done_items}"
  else
    seal_line="- Sprint ${n} — ${obj:-sans objectif} — ${n_done} $(plural "$n_done" livrée), ${n_def} $(plural "$n_def" reportée) : ${done_items}"
  fi

  # Statut → clos, et la ligne d'incrément en fin de section. Rien d'autre n'est touché.
  if ! write_closed "$seal_line" "$ABANDON"; then
    echo "sprint.sh : écriture de ${FILE} impossible" >&2
    exit 2
  fi

  if (( HAS_ABANDON )); then
    echo "CLOSE: ABANDONED sprint=${n} done=${n_done} deferred=${n_def} open=${n_open}"
    if (( n_open > 0 )); then lot_lines | grep -F -- '- [ ] ' | sed -E 's/^- \[ \] /STORY_OPEN: /'; fi
  else
    echo "CLOSE: SEALED sprint=${n} done=${n_done} deferred=${n_def}"
    printf '%s' "$inc_lines"
  fi
  if (( n_def > 0 )); then
    lot_lines | grep -F -- '- [~] ' | sed -E 's/^- \[~\] /STORY_DEFERRED: /'
  fi
  echo "NEXT: session — ezk-retro (rétro) · ezk-backlog next|groom (planning) · ezk-sprint start (sprint suivant) · ezk-archive (lever la session)"
  end
}

case "$CMD" in
  start) do_start ;;
  close) do_close ;;
esac
