#!/usr/bin/env bash
# Skema migration 005 — retrait du champ date `ready:` (layout v4 → v5).
#
# En clair : `ready` est une COLONNE (`status: ready`), plus un champ date. Le champ `ready: AAAA-MM-JJ`
# est retiré du front-matter de toutes les fiches (actives et `done/`). Sa date n'est PAS perdue :
# pour chaque fiche qui portait une vraie date, une ligne de note datée est ajoutée AU BAS de la fiche,
# AVANT la suppression de la ligne. Elle n'est jamais dérivée de git (le squash-merge ment : une fiche
# livrée le 22 peut avoir été `ready` le 21).
#
# Même passage, même schéma : `blocked` n'est plus un statut mais un DRAPEAU posé par-dessus la colonne
# (`blocked:` + raison). Une fiche encore en `status: blocked` (layout v4) est convertie en colonne + drapeau,
# sinon le dossier serait déclaré layout 5 alors que le validateur v5 rejette ce statut.
#
# Décisions : fiche 20260823121712652 (groom + concurrence ezk-pm du 2026-09-30) · ADR-0016, amendement 2026-09-30.
#
# Ce que fait le script, et rien d'autre :
#   - fiches `features/[0-9]*.md` et `features/done/[0-9]*.md` : supprime la/les ligne(s) `ready:` du
#     FRONT-MATTER seulement (un `ready:` dans le corps, p. ex. un bloc de code, n'est jamais touché) ;
#   - valeur datée (non vide) → ajoute une note « Historique » au bas de la fiche ; le commentaire
#     d'origine n'est recopié que s'il porte une info (le texte-type du gabarit est écarté) ;
#   - valeur vide → suppression seule, aucune note ;
#   - `status: blocked` → `status: ready` si la fiche portait une date `ready:` (DoR passée), sinon
#     `status: idea` (même règle que la migration 003 pour `todo`), plus un drapeau
#     `blocked: "ancien statut blocked (migration 005) — raison à préciser"` — sauf si la fiche a déjà
#     sa propre ligne `blocked:`, conservée telle quelle ;
#   - `--apply` uniquement : `features/README.md` → `layout_version: 5` ; le gabarit déployé
#     `features/feature-template.md` perd sa ligne `ready:` (un nouvel `add` ne la recrée pas) et son
#     commentaire de `status:` annonce les statuts du layout 5.
# Idempotent : une fois les lignes parties et les `blocked` convertis, il n'y a plus rien à faire.
# Garde : refuse `--apply` si le dossier est avant le layout v4 — la migration 003 LIT le champ `ready:`
# pour scinder `todo` en `ready` / `idea`, il faut donc l'avoir passée avant.
#
# Usage : apply-005-retrait-champ-ready.sh [--apply] [racine-projet]
#   sans --apply : DRY-RUN — liste les changements, n'écrit rien.
#   avec --apply : réécrit les fiches concernées.
# Filet : les fiches sont versionnées par git — `git diff` montre tout, `git checkout` annule.
set -euo pipefail

APPLY=0
ARGS=()
for a in "$@"; do
  case "$a" in
    --apply) APPLY=1 ;;
    *) ARGS+=("$a") ;;
  esac
done
ROOT="${ARGS[0]:-.}"
ROOT="$(cd "$ROOT" && pwd)"
FEATURES="$ROOT/features"
[[ -d "$FEATURES" ]] || { echo "erreur: pas de features/ dans ${ROOT}" >&2; exit 1; }

README="$FEATURES/README.md"
installed=0
if [[ -f "$README" ]]; then
  installed="$(awk '/^layout_version:/ { sub(/^layout_version:[[:space:]]*/, ""); gsub(/[^0-9].*$/, ""); print; exit }' "$README")"
  installed="${installed:-0}"
fi
if [[ "$installed" -lt 4 && "$APPLY" -eq 1 ]]; then
  echo "erreur: layout_version ${installed} < 4 — applique d'abord les migrations pending (003 lit le champ ready: pour scinder todo en ready/idea), puis relance 005." >&2
  exit 2
fi

# Reste brut de la 1re ligne `ready:` du FRONT-MATTER (entre le 1er et le 2e ---) ; code 1 si absente.
ready_raw() {
  awk '
    /^---[[:space:]]*$/ { fm++; next }
    fm == 1 && /^ready:/ { sub(/^ready:[[:space:]]*/, ""); sub(/\r$/, ""); print; found = 1; exit }
    fm >= 2 { exit }
    END { exit !found }
  ' "$1"
}

# Valeur de la 1re ligne `$2:` du FRONT-MATTER de $1, sans commentaire ni guillemets ; vide si absente.
fm_value() {
  local v
  v="$(awk -v k="$2" '
    /^---[[:space:]]*$/ { fm++; next }
    fm == 1 && index($0, k ":") == 1 {
      s = substr($0, length(k) + 2); sub(/\r$/, "", s)
      if (substr(s, 1, 1) == " " || substr(s, 1, 1) == "\t") sub(/^[ \t]+/, "", s)
      if (substr(s, 1, 1) == "#") s = ""; else sub(/[ \t]+#.*$/, "", s)
      sub(/[ \t]+$/, "", s); print s; exit
    }
    fm >= 2 { exit }
  ' "$1")"
  v="${v#[\"\']}"; v="${v%[\"\']}"
  printf '%s' "$v"
}

# Code 0 si le FRONT-MATTER de $1 porte une ligne `$2:` (même vide).
fm_has_key() {
  awk -v k="$2" '
    /^---[[:space:]]*$/ { fm++; next }
    fm == 1 && index($0, k ":") == 1 { found = 1; exit }
    fm >= 2 { exit }
    END { exit !found }
  ' "$1"
}

# « valeur \x1f commentaire » : le commentaire commence au 1er `#` en tête de reste ou précédé d'un blanc.
split_value_comment() {
  awk '
    {
      s = $0; n = length(s); pos = 0
      for (i = 1; i <= n; i++) {
        c = substr(s, i, 1)
        if (c == "#" && (i == 1 || substr(s, i - 1, 1) ~ /[ \t]/)) { pos = i; break }
      }
      if (pos) { val = substr(s, 1, pos - 1); com = substr(s, pos + 1) } else { val = s; com = "" }
      gsub(/^[ \t]+|[ \t]+$/, "", val); gsub(/^[ \t]+|[ \t]+$/, "", com)
      printf "%s\x1f%s\n", val, com
    }
  '
}

# Écrit sur stdout la fiche SANS les lignes `ready:` du front-matter ; si $2 (nouveau statut) est
# donné, la ligne `status:` du front-matter est réécrite, suivie de la ligne $3 (drapeau) si elle est donnée.
rewrite_fm() { # $1=fichier $2=nouveau statut (ou vide) $3=ligne `blocked:` à insérer (ou vide)
  awk -v ns="$2" -v bl="$3" '
    /^---[[:space:]]*$/ { fm++ }
    fm == 1 && /^ready:/ { next }
    fm == 1 && ns != "" && !done && /^status:/ { print "status: " ns; if (bl != "") print bl; done = 1; next }
    { print }
  ' "$1"
}

# Ajoute une note en bas du fichier : fin de ligne garantie, UNE ligne vide avant la note.
append_note() { # $1=fichier $2=note
  local f="$1" note="$2"
  [[ -n "$(tail -c1 "$f")" ]] && printf '\n' >> "$f"
  [[ -n "$(tail -n1 "$f" | tr -d '[:space:]')" ]] && printf '\n' >> "$f"
  printf '%s\n' "$note" >> "$f"
}

SEP=$'\x1f'
BLOCKED_FLAG='blocked: "ancien statut blocked (migration 005) — raison à préciser"'
n_files=0; n_dated=0; n_empty=0; n_blocked=0
while IFS= read -r -d '' f; do
  has_ready=0; raw=""
  if raw="$(ready_raw "$f")"; then has_ready=1; fi
  is_blocked=0
  [[ "$(fm_value "$f" status)" == "blocked" ]] && is_blocked=1
  if [[ "$has_ready" -eq 0 && "$is_blocked" -eq 0 ]]; then continue; fi   # rien à faire pour cette fiche
  n_files=$((n_files + 1))
  rel="${f#"$ROOT"/}"

  value=""; note=""; msg=""
  if [[ "$has_ready" -eq 1 ]]; then
    vc="$(printf '%s' "$raw" | split_value_comment)"
    value="${vc%%"$SEP"*}"
    comment="${vc#*"$SEP"}"
    # Valeur quotée (`ready: "2026-08-21"`) : on garde le contenu de la date, pas les guillemets.
    value="${value#[\"\']}"; value="${value%[\"\']}"
    if [[ -n "$value" ]]; then
      n_dated=$((n_dated + 1))
      note="> **Historique** — DoR (\`ready\`) passée le ${value} · ancien champ front-matter \`ready:\`, retiré en migration 005."
      # Le texte-type du gabarit (« YYYY-MM-DD — posé(e) par le gate … ») n'apporte rien : écarté.
      if [[ -n "$comment" && "$comment" != YYYY-MM-DD* ]]; then
        note="${note%.} · note d'origine : ${comment%.}."
      fi
      msg="ready: ${value} → note datée + ligne supprimée"
    else
      n_empty=$((n_empty + 1))
      msg="ready: (vide) → ligne supprimée"
    fi
  fi

  new_status=""; flag_line=""
  if [[ "$is_blocked" -eq 1 ]]; then
    n_blocked=$((n_blocked + 1))
    # Même règle que la migration 003 pour `todo` : la colonne d'origine se lit dans `ready:`.
    # Daté → la DoR était passée (`ready`), sinon `idea`. Le blocage devient un drapeau.
    if [[ -n "$value" ]]; then new_status="ready"; else new_status="idea"; fi
    fm_has_key "$f" blocked || flag_line="$BLOCKED_FLAG"
    msg="status: blocked → ${new_status} + drapeau blocked:${msg:+ ; ${msg}}"
  fi

  if [[ "$APPLY" -eq 1 ]]; then
    tmp="$(mktemp)"
    rewrite_fm "$f" "$new_status" "$flag_line" > "$tmp"
    [[ -n "$note" ]] && append_note "$tmp" "$note"
    cat "$tmp" > "$f"        # préserve les droits du fichier (pas de mv)
    rm -f "$tmp"
  else
    echo "  ${rel} : ${msg}"
  fi
done < <(
  dirs=("$FEATURES"); [[ -d "$FEATURES/done" ]] && dirs+=("$FEATURES/done")
  find "${dirs[@]}" -maxdepth 1 -name '[0-9]*.md' -print0 | LC_ALL=C sort -z
)

detail="${n_dated} date(s) préservée(s) en note · ${n_empty} champ(s) vide(s) supprimé(s) · ${n_blocked} statut(s) blocked converti(s) en drapeau"
if [[ "$n_files" -eq 0 ]]; then
  echo "rien à migrer : aucune fiche ne porte de champ ready: ni de statut blocked."
elif [[ "$APPLY" -eq 1 ]]; then
  echo "migration 005 appliquée : ${n_files} fiche(s) · ${detail}."
else
  echo "DRY-RUN : ${n_files} fiche(s) à migrer · ${detail}. Relance avec --apply pour écrire."
fi

if [[ "$APPLY" -eq 1 ]]; then
  # Bumper le marqueur de layout à 5 (comme 003 le pose à 3).
  if [[ -f "$README" ]]; then
    tmp="$(mktemp)"; sed 's/^layout_version:.*/layout_version: 5/' "$README" > "$tmp" && cat "$tmp" > "$README"; rm -f "$tmp"
  fi
  # Le gabarit déployé : un nouvel `add` ne doit plus recréer le champ, et le commentaire de
  # `status:` annonce les statuts du layout 5 (sans `blocked`, devenu un drapeau ; avec merged/split).
  # Cette liste est un INSTANTANÉ du layout 5 (une migration fige son état cible) ; la source vivante
  # est src/core/fiche-schema.ts. Retour de la revue Codex (PR #267).
  tpl="$FEATURES/feature-template.md"
  if [[ -f "$tpl" ]]; then
    tmp="$(mktemp)"
    sed -E -e '/^ready:/d' \
           -e 's/^(status:[^#]*#).*$/\1 idea | ready | in-progress | shipped | superseded | merged | split/' \
           "$tpl" > "$tmp" && cat "$tmp" > "$tpl"
    rm -f "$tmp"
  fi
  echo "(layout_version: 5) → régénère les vues (regen-backlog.sh + avancement:regen …)."
fi
