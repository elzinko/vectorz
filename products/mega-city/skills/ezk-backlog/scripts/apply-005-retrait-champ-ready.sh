#!/usr/bin/env bash
# Skema migration 005 — retrait du champ date `ready:` (layout v4 → v5).
#
# En clair : `ready` est une COLONNE (`status: ready`), plus un champ date. Le champ `ready: AAAA-MM-JJ`
# est retiré du front-matter de toutes les fiches (actives et `done/`). Sa date n'est PAS perdue :
# pour chaque fiche qui portait une vraie date, une ligne de note datée est ajoutée AU BAS de la fiche,
# AVANT la suppression de la ligne. Elle n'est jamais dérivée de git (le squash-merge ment : une fiche
# livrée le 22 peut avoir été `ready` le 21).
#
# Décisions : fiche 20260823121712652 (groom + concurrence ezk-pm du 2026-09-30) · ADR-0016, amendement 2026-09-30.
#
# Ce que fait le script, et rien d'autre :
#   - fiches `features/[0-9]*.md` et `features/done/[0-9]*.md` : supprime la/les ligne(s) `ready:` du
#     FRONT-MATTER seulement (un `ready:` dans le corps, p. ex. un bloc de code, n'est jamais touché) ;
#   - valeur datée (non vide) → ajoute une note « Historique » au bas de la fiche ; le commentaire
#     d'origine n'est recopié que s'il porte une info (le texte-type du gabarit est écarté) ;
#   - valeur vide → suppression seule, aucune note ;
#   - `--apply` uniquement : `features/README.md` → `layout_version: 5` ; le gabarit déployé
#     `features/feature-template.md` perd sa ligne `ready:` (un nouvel `add` ne la recrée pas).
# Idempotent : une fois les lignes parties, il n'y a plus rien à faire ni à noter.
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

# Écrit sur stdout la fiche SANS les lignes `ready:` du front-matter.
strip_ready() {
  awk '
    /^---[[:space:]]*$/ { fm++ }
    fm == 1 && /^ready:/ { next }
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
n_dated=0; n_empty=0
while IFS= read -r -d '' f; do
  raw="$(ready_raw "$f")" || continue          # pas de champ ready: → rien à faire
  vc="$(printf '%s' "$raw" | split_value_comment)"
  value="${vc%%"$SEP"*}"
  comment="${vc#*"$SEP"}"
  # Valeur quotée (`ready: "2026-08-21"`) : on garde le contenu de la date, pas les guillemets.
  value="${value#[\"\']}"; value="${value%[\"\']}"
  rel="${f#"$ROOT"/}"

  note=""
  if [[ -n "$value" ]]; then
    n_dated=$((n_dated + 1))
    note="> **Historique** — DoR (\`ready\`) passée le ${value} · ancien champ front-matter \`ready:\`, retiré en migration 005."
    # Le texte-type du gabarit (« YYYY-MM-DD — posé(e) par le gate … ») n'apporte rien : écarté.
    if [[ -n "$comment" && "$comment" != YYYY-MM-DD* ]]; then
      note="${note%.} · note d'origine : ${comment%.}."
    fi
  else
    n_empty=$((n_empty + 1))
  fi

  if [[ "$APPLY" -eq 1 ]]; then
    tmp="$(mktemp)"
    strip_ready "$f" > "$tmp"
    [[ -n "$note" ]] && append_note "$tmp" "$note"
    cat "$tmp" > "$f"        # préserve les droits du fichier (pas de mv)
    rm -f "$tmp"
  elif [[ -n "$value" ]]; then
    echo "  ${rel} : ready: ${value} → note datée + ligne supprimée"
  else
    echo "  ${rel} : ready: (vide) → ligne supprimée"
  fi
done < <(
  dirs=("$FEATURES"); [[ -d "$FEATURES/done" ]] && dirs+=("$FEATURES/done")
  find "${dirs[@]}" -maxdepth 1 -name '[0-9]*.md' -print0 | LC_ALL=C sort -z
)

total=$((n_dated + n_empty))
if [[ "$total" -eq 0 ]]; then
  echo "rien à migrer : aucune fiche ne porte de champ ready:."
elif [[ "$APPLY" -eq 1 ]]; then
  echo "migration 005 appliquée : ${total} fiche(s) · ${n_dated} date(s) préservée(s) en note · ${n_empty} champ(s) vide(s) supprimé(s)."
else
  echo "DRY-RUN : ${total} fiche(s) à migrer · ${n_dated} date(s) préservée(s) en note · ${n_empty} champ(s) vide(s) supprimé(s). Relance avec --apply pour écrire."
fi

if [[ "$APPLY" -eq 1 ]]; then
  # Bumper le marqueur de layout à 5 (comme 003 le pose à 3).
  if [[ -f "$README" ]]; then
    tmp="$(mktemp)"; sed 's/^layout_version:.*/layout_version: 5/' "$README" > "$tmp" && cat "$tmp" > "$README"; rm -f "$tmp"
  fi
  # Le gabarit déployé : un nouvel `add` ne doit plus recréer le champ.
  tpl="$FEATURES/feature-template.md"
  if [[ -f "$tpl" ]]; then
    tmp="$(mktemp)"; sed '/^ready:/d' "$tpl" > "$tmp" && cat "$tmp" > "$tpl"; rm -f "$tmp"
  fi
  echo "(layout_version: 5) → régénère les vues (regen-backlog.sh + avancement:regen …)."
fi
