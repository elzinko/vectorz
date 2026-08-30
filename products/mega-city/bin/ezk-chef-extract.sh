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

# ── front-matter mécanique (même idiome que regen-recipes.sh : awk, pas un parseur YAML) ──
frontmatter() {
  awk '
    function unquote(s) { gsub(/^"|"$/, "", s); return s }
    BEGIN { infm=0 }
    /^---[[:space:]]*$/ { infm++; if (infm==2) exit; next }
    infm==1 {
      if ($0 ~ /^title:/) { sub(/^title:[[:space:]]*/, ""); title=unquote($0) }
      if ($0 ~ /^pr:/)    { sub(/^pr:[[:space:]]*/, "");    pr=unquote($0) }
    }
    END { printf "%s\x1f%s\n", title, pr }
  ' "$1"
}
SEP=$'\x1f'
fm_line="$(frontmatter "$FICHE")"
TITLE="${fm_line%%${SEP}*}"
PR="${fm_line#*${SEP}}"

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
  done | sort
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

NEW_ID="$(bash "$MINT_ID")"
TODAY="$(date -u +%Y-%m-%d)"
DEST="recipes/${SLUG}.md"
[ -e "$DEST" ] && { echo "erreur: $DEST existe déjà — pas d'écrasement silencieux" >&2; exit 1; }

PR_NOTE="TODO(jugement) — pas de PR dans le front-matter de la fiche source"
[ -n "$PR" ] && PR_NOTE="PR ${PR} (\`gh pr view ${PR#\#}\` pour le détail — best-effort, non interrogé ici)"

SOURCE_NOTE="TODO(jugement) — racine de l'implémentation non dérivable mécaniquement ; voir ${PR_NOTE}"

{
  echo '---'
  echo "id: \"${NEW_ID}\""
  echo "title: \"${TITLE//\"/\'}\""
  echo 'makes: "TODO(jugement) — ce que cette recette fabrique (une ligne)"'
  echo "source: \"${SOURCE_NOTE}\""
  echo 'composes: [] # TODO(jugement) — rules composées (idiome ADR-0012/0025)'
  echo 'profile: # TODO(jugement) — profil référencé, si pertinent'
  echo 'status: draft'
  echo 'home: central'
  echo "created: ${TODAY}"
  echo "updated: ${TODAY}"
  echo '---'
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
