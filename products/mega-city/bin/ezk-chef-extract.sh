#!/usr/bin/env bash
# ezk-chef-extract.sh — partie MÉCANIQUE de `ezk-chef extract` (source b : fiche shippée
# → brouillon de recette). Fiche 20260824122629794. Déterministe (ADR-0001 §2 — le script
# range, le LLM juge) : localise la fiche, mint un id, instancie RECIPE_TEMPLATE.md avec ce
# qui est dérivable mécaniquement (front-matter, section « En clair », amorce de playbook)
# et laisse les TODO(jugement) explicites pour l'agent ezk-chef / l'humain.
#
# Usage : ezk-chef-extract.sh <id-fiche-shippée> [racine-vectorz]
#   défaut racine : grand-parent du bin/ (racine vectorz), même résolution que
#   regen-recipes.sh — recipes/ et features/ sont des dossiers frères de products/.
#
# Sortie : recipes/<slug>.md (status: draft) — chemin imprimé sur stdout en dernière ligne.
# Erreurs franches : fiche introuvable, PLUSIEURS fiches pour le même id, destination déjà
# existante (jamais d'écrasement silencieux).
set -euo pipefail

_SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
MINT_ID="$_SCRIPT_DIR/../skills/ezk-backlog/scripts/mint-id.sh"
TEMPLATE_REL="RECIPE_TEMPLATE.md"

usage() { echo "Usage: $(basename "$0") <id-fiche-shippée> [racine-vectorz]" >&2; }

FICHE_ID="${1:-}"
if [[ -z "$FICHE_ID" ]]; then usage; exit 1; fi
if [[ ! "$FICHE_ID" =~ ^[0-9]+$ ]]; then
  echo "erreur: id de fiche invalide « ${FICHE_ID} » (attendu : chiffres uniquement)" >&2
  exit 1
fi

if [[ -n "${2:-}" ]]; then
  ROOT="$2"
else
  ROOT="$(cd "$_SCRIPT_DIR/../../.." && pwd)"
fi
cd "$ROOT"

[ -d recipes ] || { echo "erreur: pas de dossier recipes/ dans ${ROOT}" >&2; exit 1; }
[ -f "recipes/$TEMPLATE_REL" ] || { echo "erreur: recipes/$TEMPLATE_REL introuvable" >&2; exit 1; }

shopt -s nullglob
# Séparateur `_` (ids horodatés récents) ET `-` (fiches legacy type 0147-…).
matches=(features/done/"${FICHE_ID}"_*.md features/done/"${FICHE_ID}"-*.md)
shopt -u nullglob
if [ ${#matches[@]} -eq 0 ]; then
  echo "erreur: aucune fiche shippée features/done/${FICHE_ID}_*.md" >&2
  exit 1
fi
if [ ${#matches[@]} -gt 1 ]; then
  echo "erreur: plusieurs fiches pour l'id ${FICHE_ID} : ${matches[*]}" >&2
  exit 1
fi
FICHE="${matches[0]}"
FICHE_BASENAME="$(basename "$FICHE")"
SLUG="${FICHE_BASENAME#"${FICHE_ID}"}"   # retire l'id en tête
SLUG="${SLUG#[-_]}"                        # retire le séparateur (_ récent ou - legacy)
SLUG="${SLUG%.md}"

# ── front-matter de la fiche source : LU par le loader testé (règle development/fiche-read-via-loader),
# puis celui de la recette ÉMIS par la lib YAML (règle development/yaml-emission-via-lib) — plus d'awk
# ni d'echo pour le front-matter. Les deux passent par un CLI tsx de mega-city.
MC="$(cd "$_SCRIPT_DIR/.." && pwd)"
TSX="$MC/node_modules/.bin/tsx"
[ -x "$TSX" ] || { echo "erreur: tsx introuvable (${TSX}) — lancer « pnpm install »" >&2; exit 1; }
SEP=$'\x1f'
# Une ligne : id, title, type, priority, status, pr, created, … (séparés par \x1f).
fiche_row="$("$TSX" "$MC/bin/fiche-rows.ts" "$FICHE")"
IFS="$SEP" read -r _ TITLE _ _ _ PR _ <<< "$fiche_row"

# ── section extraction : corps entre `## <nom>` et le prochain `## ` (ou EOF) ─────────────
section() { # $1=fichier $2=nom-de-section
  awk -v name="$2" '
    BEGIN { insec=0 }
    /^## / {
      if (insec) exit
      line=$0; sub(/^## /, "", line)
      if (line == name) { insec=1; next }
      next
    }
    insec { print }
  ' "$1" | awk 'NF { started=1 } started { buf[++n]=$0 } END { last=n; while (last>0 && buf[last]=="") last--; for (i=1;i<=last;i++) print buf[i] }'
}

EN_CLAIR="$(section "$FICHE" "En clair")"
PROPOSITION="$(section "$FICHE" "Proposition")"
COMMENT_VERIFIER="$(section "$FICHE" "Comment vérifier")"

[ -n "$EN_CLAIR" ] || EN_CLAIR="TODO(jugement) — la fiche source n'a pas de section « En clair » exploitable."

playbook_amorce() {
  local src="$1" label="$2"
  if [ -n "$src" ]; then
    printf '%s\n' "$src" | grep -E '^([0-9]+\.|-|\*)' | sed 's/^/TODO(jugement, depuis « '"$label"' ») /'
  fi
}
PLAYBOOK="$(playbook_amorce "$PROPOSITION" "Proposition")"
PLAYBOOK_VERIF="$(playbook_amorce "$COMMENT_VERIFIER" "Comment vérifier")"
if [ -z "$PLAYBOOK" ] && [ -z "$PLAYBOOK_VERIF" ]; then
  PLAYBOOK="1. TODO(jugement) — aucune liste détectée dans Proposition/Comment vérifier ; rédiger le playbook à la main."
fi

# ── labo (#195) : récits docs/sessions/*.md dont l'entête `fiches:` référence FICHE_ID ────
# Verse la section « Galères & gestes (labo) » dans les Préliminaires, avec un pointeur vers
# le récit source (entonnoir ADR-0013 — jamais de code recopié). Tri déterministe (glob trié).
labo_sessions() {
  local id="$1" f header
  [ -d docs/sessions ] || return 0
  for f in docs/sessions/*.md; do
    [ -e "$f" ] || continue
    header="$(awk '/^fiches:/ { print; exit }' "$f")"
    printf '%s' "$header" | grep -Eq "(^|[^0-9])${id}([^0-9]|\$)" && printf '%s\n' "$f"
  done | LC_ALL=C sort
}

PRELIM_LABO=""
while IFS= read -r sess; do
  [ -n "$sess" ] || continue
  labo_body="$(section "$sess" "Galères & gestes (labo)")"
  [ -n "$labo_body" ] || continue
  PRELIM_LABO="${PRELIM_LABO}Source : \`${sess}\` (\`fiches:\` référence ${FICHE_ID}).

${labo_body}

"
done <<< "$(labo_sessions "$FICHE_ID")"
PRELIM_LABO="${PRELIM_LABO%$'\n\n'}"

# ── journal des difficultés (fiche 20260904091853974) : docs/journal/<date>-<slug>.md ──────────
# Capture INDÉPENDANTE du labo, écrite pendant le dev par journal-add.sh : ici on la LIT seulement.
# On ne lit que les fichiers préfixés d'une date (README.md et autres docs du dossier restent
# ignorés) et que les entrées dont le titre est `## [FICHE_ID] …` (borne : id exact, pas préfixe).
journal_files() {
  local id="$1" f
  [ -d docs/journal ] || return 0
  for f in docs/journal/[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]-*.md; do
    [ -e "$f" ] || continue
    grep -q "^## \[${id}\] " "$f" && printf '%s\n' "$f"
  done | LC_ALL=C sort
}
# Entrées de l'id, titres rétrogradés en `###` pour ne pas casser les `##` de la recette.
journal_body() { # $1=fichier $2=id
  awk -v id="$2" '
    /^## / { keep = (index($0, "## [" id "] ") == 1); if (keep) sub(/^## /, "### ") }
    keep { print }
  ' "$1" | awk 'NF { started=1 } started { buf[++n]=$0 } END { last=n; while (last>0 && buf[last]=="") last--; for (i=1;i<=last;i++) print buf[i] }'
}

PRELIM_JOURNAL=""
while IFS= read -r jf; do
  [ -n "$jf" ] || continue
  PRELIM_JOURNAL="${PRELIM_JOURNAL}Source : \`${jf}\` (journal des difficultés, entrées taguées ${FICHE_ID}).

$(journal_body "$jf" "$FICHE_ID")

"
done <<< "$(journal_files "$FICHE_ID")"
PRELIM_JOURNAL="${PRELIM_JOURNAL%$'\n\n'}"
if [ -n "$PRELIM_JOURNAL" ]; then
  PRELIM_LABO="${PRELIM_LABO:+${PRELIM_LABO}$'\n\n'}${PRELIM_JOURNAL}"
fi

NEW_ID="$(bash "$MINT_ID")"
TODAY="$(date -u +%Y-%m-%d)"
DEST="recipes/${SLUG}.md"
[ -e "$DEST" ] && { echo "erreur: $DEST existe déjà — pas d'écrasement silencieux" >&2; exit 1; }

PR_NOTE="TODO(jugement) — pas de PR dans le front-matter de la fiche source"
[ -n "$PR" ] && PR_NOTE="PR ${PR} (\`gh pr view ${PR#\#}\` pour le détail — best-effort, non interrogé ici)"

SOURCE_NOTE="TODO(jugement) — racine de l'implémentation non dérivable mécaniquement ; voir ${PR_NOTE}"

# Front-matter émis AVANT d'ouvrir DEST : un échec de l'émetteur ne laisse pas de fichier tronqué.
FRONT_MATTER="$("$TSX" "$MC/bin/recipe-frontmatter.ts" --id "$NEW_ID" --title "$TITLE" --source "$SOURCE_NOTE" --today "$TODAY")"

{
  printf '%s\n' "$FRONT_MATTER"
  echo
  echo '## En clair'
  echo
  echo "$EN_CLAIR"
  echo
  echo '## Ingrédients (prérequis)'
  echo
  echo 'TODO(jugement) — comptes, secrets, variables d’environnement requis.'
  echo
  echo '## Ustensiles (outils — CLI d’abord)'
  echo
  echo 'TODO(jugement) — CLI qui font le travail.'
  echo
  echo '## Préliminaires (gestes manuels ⚙️)'
  echo
  if [ -n "$PRELIM_LABO" ]; then
    printf '%s\n' "$PRELIM_LABO"
  else
    echo 'TODO(jugement) — ce qui ne s’automatise pas.'
  fi
  echo
  echo '## Le concept (mécanisme + schéma)'
  echo
  echo 'TODO(jugement) — schéma texte du mécanisme.'
  echo
  echo '## Exemples pour goûter (référence)'
  echo
  echo "Fiche source : \`features/done/${FICHE_BASENAME}\` (id \`${FICHE_ID}\`)."
  echo "${PR_NOTE}."
  echo
  echo '## Les étapes (playbook)'
  echo
  if [ -n "$PLAYBOOK" ]; then printf '%s\n' "$PLAYBOOK"; fi
  if [ -n "$PLAYBOOK_VERIF" ]; then printf '%s\n' "$PLAYBOOK_VERIF"; fi
  echo
  echo '## Checklist « rien d’oublié »'
  echo
  echo '- [ ] TODO(jugement)'
  echo
  echo '## Fichiers de référence (entonnoir — pointer, jamais copier)'
  echo
  echo "Racine : **${SOURCE_NOTE}**"
  echo
  echo '- TODO(jugement) `fichier:ligne` — ce que ça montre'
  echo
  echo '## Statut de cette recette'
  echo
  echo "Brouillon généré automatiquement le ${TODAY} par \`ezk-chef extract\` depuis la fiche" \
    "shippée \`${FICHE_ID}\` (\`features/done/${FICHE_BASENAME}\`). À compléter par jugement" \
    "(agent \`ezk-chef\` ou humain) avant de passer \`status: ready\`."
} > "$DEST"

echo "$DEST"
