#!/usr/bin/env bash
# ezk-sprint:start / ezk-sprint:close — le cycle de vie du SPRINT (fiche 20260930123438875, ADR-0054).
#
# Un sprint = un LOT de stories → un incrément. Ce script porte le MÉCANISME déterministe
# (ADR-0051 : cœur = script, jugement = LLM). Le choix du lot (planning) et l'intake
# (reconcile, review, next) restent du jugement : ils sont décrits dans SKILL.md.
#
#   start --dry-run        ≡ `check` : exactement le portier, strictement READ-ONLY.
#   start --lot <ids>      passe le portier puis écrit le journal de branche (hors du worktree, cf. plus
#                          bas). N'écrit RIEN d'autre : ni branche git, ni commit, ni statut de fiche.
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
#         | CLOSE: REFUSED malformed_story sprint=<n> rows=<k>   (une case du lot n'est ni [ ], ni [x], ni [~])
#         | CLOSE: ABANDONED sprint=<n> done=<d> deferred=<r> open=<o>   (close --abandon)
#   Les refus de close ajoutent une ligne `HINT:` quand --abandon est la sortie (ou quand le marqueur est à corriger).
#   start ajoute `WARN: loader des fiches introuvable …` quand les titres n'ont pas pu être lus par le loader (ci-dessous).
#   Chaque réponse finit par `--- END ---`.
#
# Format du lot dans SPRINT.md : `- [ ] <id> — <titre>` ouverte · `- [x] …` livrée · `- [~] …` reportée.
# Toute autre case (`- [X] …`, `- [] …`, `- [-] …`) est REFUSÉE à la clôture, `--abandon` compris : une case que
# les totaux ne voient pas ne doit jamais être omise en silence du sprint scellé.
# Une référence de PR ou de commit en fin de ligne — `(PR #12)`, `(#12)`, `(local abc1234)` — est reprise
# dans l'incrément ; toute autre parenthèse (un bout de titre) est ignorée.
# Sections portées d'un sprint au suivant (savoir de SESSION) : Notes / décisions, Galères & gestes (labo),
# Incréments scellés de la session. Le lot, lui, est propre à chaque sprint.
#
# Ligne d'incrément : les stories livrées ET celles qui ne le sont pas y gardent leur id. Le prochain `start`
# remplace le lot ; cette ligne est ce qui reste de lui dans le journal de session (ezk-archive).
#   - Sprint 2 — <objectif> — 1 livrée, 1 reportée : <id> (PR #12) — reportée : <id>
#   - Sprint 3 — <objectif> — abandonné (<raison>) — 0 livrée, 0 reportée, 1 ouverte — ouverte : <id>
#
# Titres des stories : lus par le LOADER du catalogue (tsx + bin/fiche-rows.ts), règle development/fiche-read-via-loader.
# Un skill installé par `lawgiver bind-global` n'est pas lancé depuis le catalogue : voir loader_root. Loader introuvable
# (copie hors du catalogue, sans MEGA_CITY_ROOT) : le sprint s'ouvre quand même, les titres viennent du NOM des fichiers
# et un `WARN:` le dit.

set -uo pipefail

# Chemin PHYSIQUE : installé en lien (`bind-global --link`), le skill est un symlink vers le catalogue ; le chemin
# logique (~/.claude/skills/…) ne le contient pas.
HERE="$(cd "$(dirname "$0")" && pwd -P)"
MC="$(cd "$HERE/../../.." && pwd)" # products/mega-city quand le script est lancé depuis le catalogue ou par un lien
CHECK="$HERE/check.sh"
# Le journal vit HORS du worktree, un fichier par BRANCHE, dans le dossier git commun (FILE, calculé
# après `cd` plus bas). L'ancien lieu — la racine du worktree — ne sert plus qu'à reprendre un journal
# resté là avant la bascule (fiche 20261004181110201).
LEGACY_FILE="SPRINT.md"
H_NOTES="## Notes / décisions"
H_LABO="## Galères & gestes (labo)" # titre exact : lu par ezk-archive et ezk-chef
H_SEALED="## Incréments scellés de la session"

usage() {
  cat <<'USAGE'
sprint.sh — cycle de vie du sprint (ezk-sprint start / close, ADR-0054)

  start --dry-run                  ≡ `check` : le portier, strictement read-only
  start --lot <id[,id…]>           ouvre un sprint (passe le portier, écrit le journal de branche)
        [--objective "<texte>"]    objectif du sprint (titre du journal)
        [--override "<raison>"]    passe outre un portier ALERT ; la raison est journalisée
  close                            scelle l'incrément (refuse si une story du lot est ouverte)
  close --abandon "<raison>"       fin anormale : ferme le sprint SANS incrément (raison journalisée)
  -h, --help                       cette aide
  Dernier argument optionnel : <racine> du dépôt.

  MEGA_CITY_ROOT=<dépôt>/products/mega-city   (environnement) le catalogue qui porte le loader des fiches,
                                   quand le skill est installé en COPIE hors du catalogue. Sinon : titres tirés des noms de fichier.
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

# --- où vit le journal : hors du worktree, un fichier par BRANCHE ------------------
# L'app Claude recycle un worktree d'une session à l'autre. Un journal rangé à la racine du worktree
# partait avec lui — ou pire, la session suivante, sur une AUTRE branche, en héritait (arrivé 3 fois en
# 2 jours). On le range dans `<git-common-dir>/ezk/sprints/<branche>.md`, le dossier git que TOUS les
# worktrees d'un dépôt partagent — même lieu et même raison que la note de passation (handoff.sh,
# fiche 20261003105820077). Clé par branche : chaque branche a son récit, un worktree neuf sur une
# branche neuve ouvre « Sprint 1 », et le journal survit à `git worktree remove`.
# `pwd -P` : le même chemin qu'on parte du principal ou d'un worktree (macOS : /var → /private/var).
EZK_COMMON="$(cd "$(git rev-parse --path-format=absolute --git-common-dir)" && pwd -P)" || exit 2
BRANCH="$(git branch --show-current 2>/dev/null)"
# HEAD détaché : pas de branche. La clé doit être STABLE pendant tout le sprint — un sprint PRODUIT des
# commits, donc un `_detached/<sha>` bougerait à chaque commit et rendrait le sprint ouvert introuvable à
# `close` (revue v0.14). On fixe `_detached` ; l'appartenance est vérifiée plus bas (garde journal_mismatch).
[[ -n "$BRANCH" ]] || BRANCH="_detached"
# Le « / » d'une branche devient un sous-dossier, comme git range ses refs. La sanitisation n'est PAS
# injective (`a+b` et `a-b` → `a-b.md`) : une collision est possible mais RARE, et la garde d'appartenance
# (journal_mismatch, plus bas) la rattrape — elle refuse d'écrire sur le journal d'une autre branche.
BRANCH_SAFE="$(printf '%s' "$BRANCH" | LC_ALL=C sed 's#[^A-Za-z0-9._/-]#-#g')"
FILE="$EZK_COMMON/ezk/sprints/$BRANCH_SAFE.md"

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
lot_malformed() { # les cases du lot qui RESSEMBLENT à une case (`- [?]`, un caractère au plus) sans être [ ] [x] [~]
  # `lot_lines` ne les voit pas : sceller les omettrait en silence des totaux et de l'incrément. Une puce dont
  # le crochet est plus long (`- [la fiche](…)`, un lien) n'est pas une case et n'est pas comptée.
  awk '
    /^## (Lot|Backlog)/ { inlot=1; next }
    /^## /              { inlot=0 }
    inlot && /^- \[.?\]/ && !/^- \[[ x~]\] / { print }
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
items_of() { # $1 = marqueur de case (x, ~ ou espace) → les stories de cette case sur une ligne : « id (réf), id »
  local line out=""
  while IFS= read -r line; do
    [[ -n "$line" ]] || continue
    out="${out:+$out, }$(item_of "${line#- \[?\] }")"
  done < <(lot_lines | grep -F -- "- [$1] ")
  printf '%s' "$out"
}
# Où est le loader ? Dans le CATALOGUE (products/mega-city : tsx + bin/fiche-rows.ts), pas dans le skill. Un skill
# installé par `lawgiver bind-global` n'est pas lancé depuis le catalogue :
#   · en LIEN, le script est un symlink, son chemin PHYSIQUE (HERE) mène au catalogue (MC) ;
#   · en COPIE, rien autour de lui : $MEGA_CITY_ROOT désigne le catalogue.
# Premier candidat qui porte les deux pièces ; sinon code 1 (les titres se dégradent, cf. do_start).
loader_root() {
  local c
  for c in "${MEGA_CITY_ROOT:-}" "$MC"; do
    if [[ -n "$c" && -f "$c/bin/fiche-rows.ts" && -x "$c/node_modules/.bin/tsx" ]]; then echo "$c"; return 0; fi
  done
  return 1
}

# --- start -------------------------------------------------------------------------
# Le journal vit désormais hors du worktree (dossier git commun) : git ne le voit jamais, rien à exclure.
# Mais un SPRINT.md d'AVANT la bascule peut traîner à la racine (étranger, non repris). Ce script ne
# l'écrit plus, mais un leftover « non suivi » rendrait le dépôt sale, et le merge local
# (ship-merge.sh --local) refuserait un dépôt qu'il juge sale. On l'exclut donc de git EN LOCAL
# (info/exclude), sans toucher un fichier du projet (fiche 20261003200945204). Absent, déjà ignoré
# ou déjà suivi : rien à faire.
exclude_sprint_file() {
  [[ -e "$LEGACY_FILE" ]] || return 0
  git check-ignore -q "$LEGACY_FILE" 2>/dev/null && return 0
  git ls-files --error-unmatch -- "$LEGACY_FILE" >/dev/null 2>&1 && return 0
  local excl
  excl="$(git rev-parse --git-path info/exclude)" || return 1
  mkdir -p "$(dirname "$excl")" && printf '/%s\n' "$LEGACY_FILE" >> "$excl"
}

sprint_file_content() { # le nouveau journal de sprint, sur stdout (variables de do_start)
  echo "# Sprint ${n} — ${OBJ:-sans objectif}"
  echo "Statut: en cours   Ouvert: ${today}"
  echo "Branche: ${BRANCH}"
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
  mkdir -p "$(dirname "$FILE")"

  # 0) bascule depuis l'ancien lieu. On ne regarde un SPRINT.md resté à la racine QUE si la branche n'a
  #    pas encore de journal commun : dès qu'il existe, la racine est ignorée pour toujours (la branche
  #    a déjà son récit). Jamais repris en silence : repris une fois s'il porte la marque de la branche
  #    courante, signalé sinon (fiche 20261004181110201).
  if [[ ! -e "$FILE" && -s "$LEGACY_FILE" ]]; then
    local legacy_branch
    legacy_branch="$(sed -nE 's/^Branche:[[:space:]]*(.*[^[:space:]])[[:space:]]*$/\1/p' "$LEGACY_FILE" 2>/dev/null | head -1)"
    if [[ -n "$legacy_branch" && "$legacy_branch" == "$BRANCH" ]]; then
      if mv "$LEGACY_FILE" "$FILE" 2>/dev/null; then
        echo "SPRINT-MIGRATION: ancien ${LEGACY_FILE} repris pour la branche ${BRANCH} → ${FILE}"
      else
        # Jamais repris en silence (contrat) : si le mv échoue, on le DIT — sinon la branche repartirait
        # de zéro et son historique resterait bloqué à la racine, git-exclu, sans un mot (revue v0.14).
        echo "SPRINT-MIGRATION-FAILED: impossible de déplacer ${LEGACY_FILE} → ${FILE} ; l'ancien journal reste à la racine et n'est PAS repris. Déplace-le à la main avant de relancer." >&2
      fi
    else
      echo "SPRINT-FOREIGN: ${LEGACY_FILE} à la racine du worktree n'appartient pas à la branche courante (${BRANCH})${legacy_branch:+ — il porte « ${legacy_branch} »} : non repris, journal neuf ouvert."
    fi
  fi

  # Garde d'appartenance : si le journal commun existe DÉJÀ mais porte une AUTRE branche (collision de
  # sanitisation `a+b`/`a-b`, ou résidu d'une autre session détachée), ne l'adopte PAS en silence — refuse
  # avec la raison (revue v0.14). Un journal sans en-tête `Branche:` (ancien format, ou adopté pré-bascule)
  # est grandfathered : on ne refuse pas. L'adoption ci-dessus a déjà posé `Branche: <courante>`.
  if [[ -e "$FILE" ]]; then
    local file_branch
    file_branch="$(sed -nE 's/^Branche:[[:space:]]*(.*[^[:space:]])[[:space:]]*$/\1/p' "$FILE" 2>/dev/null | head -1)"
    if [[ -n "$file_branch" && "$file_branch" != "$BRANCH" ]]; then
      echo "START: REFUSED journal_mismatch branche=${BRANCH} journal=${file_branch}"
      echo "SPRINT_FILE: ${FILE}"
      echo "HINT: ce chemin de journal appartient à « ${file_branch} » (collision de nom de branche ?) — renomme ta branche ou déplace ${FILE}, puis relance."
      end
    fi
  fi

  # Un leftover resté à la racine (étranger signalé, ou coexistant) ne doit pas salir le dépôt : le
  # portier le verrait « non suivi », et le merge local (ship-merge.sh --local) refuserait. On l'exclut
  # AVANT le portier. Absent, déjà ignoré ou déjà suivi : rien à faire.
  exclude_sprint_file || echo "WARN: ${LEGACY_FILE} n'a pas pu être exclu de git (leftover vu comme non suivi)" >&2

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
  # Loader introuvable (cf. loader_root) : on n'échoue pas pour un titre. On le tire du NOM du fichier
  # (`features/<id>_<slug>.md`, jamais du front-matter) et on le dit par un WARN.
  local mc rows row title i=0 lot_text="" warn=""
  if mc="$(loader_root)"; then
    rows="$("$mc/node_modules/.bin/tsx" "$mc/bin/fiche-rows.ts" "${lot_files[@]}")" || { echo "sprint.sh : lecture des fiches impossible" >&2; exit 2; }
    while IFS= read -r row; do
      IFS=$'\x1f' read -r _ title _ <<< "$row"
      lot_text="${lot_text}- [ ] ${lot_ids[$i]} — ${title}"$'\n'
      i=$((i + 1))
    done <<< "$rows"
  else
    warn="WARN: loader des fiches introuvable — titres tirés du nom de fichier. Titres exacts au prochain start : MEGA_CITY_ROOT=<dépôt>/products/mega-city (après pnpm install)"
    for f in "${lot_files[@]}"; do
      title="${f##*/}"; title="${title%.md}"; title="${title#"${lot_ids[$i]}"}"; title="${title#[_-]}"
      lot_text="${lot_text}- [ ] ${lot_ids[$i]} — ${title}"$'\n'
      i=$((i + 1))
    done
  fi

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
  if [[ -n "$warn" ]]; then echo "$warn"; fi
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

# Le compte rendu du sprint (fiche 20261008072305169, ADR-0068) : à la clôture, on sort les FAITS par
# `ezk sprint report` (lot scellé lu dans SPRINT.md, périmètre « ce sprint ») et on committe le document
# via le helper partagé `commit-doc-via-worktree.sh` (local = squash local ; PR = branche + commande).
# Best-effort : tout échec ici LAISSE le sprint scellé (le compte rendu est un livrable, pas le sceau).
emit_sprint_report() { # $1 = numéro de sprint · $2 = objectif · $3 = raison d'abandon (vide si sceau normal)
  local n="$1" obj="$2" reason="$3" root repo_main slug tmp report_md day dest_rel helper tsx
  # On appelle le bin DIRECTEMENT (pas `ezk sprint report`, dont le wrapper refuse hors dépôt de méthode).
  # tsx + le bin vivent dans le catalogue ($MC) ; absents (install en copie) → on dégrade proprement.
  tsx="$MC/node_modules/.bin/tsx"
  if [[ ! -x "$tsx" || ! -f "$MC/bin/sprint-report.ts" ]]; then
    echo "SPRINT-REPORT: sauté (catalogue indisponible) — sprint scellé"; return 0
  fi
  root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
  # Le commit du compte rendu vise le dépôt où `main` est checkout. En WORKTREE, ce n'est PAS `root`
  # (le worktree est sur une autre branche) mais le checkout principal = parent du git-dir commun ;
  # sinon `ship-merge --local` échoue (« main is already used by worktree »). En dépôt simple, c'est `root`.
  repo_main="$(cd "$(dirname "$(git rev-parse --git-common-dir 2>/dev/null)")" 2>/dev/null && pwd)" || repo_main="$root"
  [[ -n "$repo_main" ]] || repo_main="$root"
  # slug sûr depuis l'objectif (accents retirés), repli n<N> : il entre dans un nom de fichier.
  slug="$(printf '%s' "${obj:-sprint $n}" | tr '[:upper:]' '[:lower:]' | tr -cs 'a-z0-9' '-' | sed 's/^-*//;s/-*$//' | cut -c1-48 | sed 's/-*$//')"
  [[ -n "$slug" ]] || slug="n${n}"
  tmp="$(mktemp -d)"
  if ! "$tsx" "$MC/bin/sprint-report.ts" "$slug" --repo-root "$root" --project-root "$root" --sprint-md "$FILE" --allow-undated --out "$tmp" >/dev/null 2>&1; then
    echo "SPRINT-REPORT: non produit (sprint:report a échoué) — sprint scellé quand même" >&2
    rm -rf "$tmp" 2>/dev/null || true; return 0
  fi
  report_md="$(ls "$tmp"/*-sprint-"$slug".md 2>/dev/null | head -1)"
  [[ -f "$report_md" ]] || { echo "SPRINT-REPORT: non produit (fichier absent) — sprint scellé quand même" >&2; rm -rf "$tmp"; return 0; }
  # Sprint abandonné : la raison entre dans le compte rendu (ADR-0068, cas abandon).
  [[ -n "$reason" ]] && printf '\n## Abandon\n\n%s\n' "$reason" >> "$report_md"
  day="$(basename "$report_md")"; day="${day%%-sprint-*}"
  dest_rel="docs/sprints/$(basename "$report_md")"
  helper="$MC/bin/commit-doc-via-worktree.sh"
  if [[ -f "$helper" ]]; then
    bash "$helper" --repo "$repo_main" --file "$report_md" --dest-rel "$dest_rel" \
      --branch-base "docs/sprint-report-${day}" --subject "docs(sprints): compte rendu du sprint ${n} — ${slug}" \
      --kind-tag SPRINT-REPORT --kind-noun "compte rendu" || echo "SPRINT-REPORT: commit non intégré (cf. ci-dessus) — sprint scellé" >&2
  else
    echo "SPRINT-REPORT: helper introuvable ($helper) — compte rendu non committé (sprint scellé)" >&2
  fi
  rm -rf "$tmp" 2>/dev/null || true
}

do_close() {
  if [[ "$(sprint_state)" != "open" ]]; then
    echo "CLOSE: REFUSED not_open"
    end
  fi

  local n obj n_open n_done n_def bad n_bad
  n="$(sprint_number)"
  obj="$(sprint_objective)"

  # Une case mal formée (`[X]`, `[]`…) n'est ni ouverte, ni livrée, ni reportée : les décomptes ci-dessous ne la
  # voient pas, et sceller l'omettrait. On refuse AVANT toute écriture, pour `close` comme pour `close --abandon` :
  # le résumé inscrit dans la session doit dire vrai.
  bad="$(lot_malformed)"
  if [[ -n "$bad" ]]; then
    n_bad="$(printf '%s\n' "$bad" | grep -c '')"
    echo "CLOSE: REFUSED malformed_story sprint=${n} rows=${n_bad}"
    printf '%s\n' "$bad" | sed -e 's/^/STORY_MALFORMED: /'
    echo "HINT: une case du lot n'est ni [ ] (ouverte), ni [x] (livrée), ni [~] (reportée) : corrige le marqueur dans ${FILE}, puis relance close"
    end
  fi

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

  # Les stories NON livrées gardent leur id dans la ligne : le prochain `start` remplace le lot, et cette ligne est
  # tout ce qui reste de lui dans le journal de session (ezk-archive en tire les fiches travaillées).
  local def_items open_items tail_def="" tail_open="" seal_line
  def_items="$(items_of '~')"
  open_items="$(items_of ' ')"
  if [[ -n "$def_items" ]]; then tail_def=" — $(plural "$n_def" reportée) : ${def_items}"; fi
  if [[ -n "$open_items" ]]; then tail_open=" — $(plural "$n_open" ouverte) : ${open_items}"; fi
  if (( HAS_ABANDON )); then
    seal_line="- Sprint ${n} — ${obj:-sans objectif} — abandonné (${ABANDON}) — ${n_done} $(plural "$n_done" livrée), ${n_def} $(plural "$n_def" reportée), ${n_open} $(plural "$n_open" ouverte)${done_items:+ : $done_items}${tail_def}${tail_open}"
  else
    seal_line="- Sprint ${n} — ${obj:-sans objectif} — ${n_done} $(plural "$n_done" livrée), ${n_def} $(plural "$n_def" reportée) : ${done_items}${tail_def}"
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
  # Compte rendu du sprint (ADR-0068) : écrit + committé après le sceau, pour SEALED comme pour ABANDONED.
  emit_sprint_report "$n" "${obj:-sans objectif}" "$ABANDON"
  echo "NEXT: session — ezk-retro (rétro) · ezk-backlog next|groom (planning) · ezk-sprint start (sprint suivant) · ezk-archive (lever la session)"
  end
}

case "$CMD" in
  start) do_start ;;
  close) do_close ;;
esac
