#!/usr/bin/env bash
# archive-commit.sh — la clôture committe ET intègre l'archive de session (fiche 20261005100026946, ADR-0063).
#
# EN CLAIR. `ezk-archive run` écrit l'archive dans `docs/sessions/<date>-<slug>.md`, puis appelle ce
# script : il range le commit, à la place de « proposer le commit » sans le faire. Sans lui, l'archive
# restait hors de git dans le worktree de session, et partait avec lui si l'app le supprimait.
#
# Appelant MINCE (ADR-0068) : la mécanique sensible (worktree jetable issu de `main`, gardes anti-perte,
# mode local/PR, composition de `ship-merge.sh --local`) vit désormais dans le helper partagé
# `bin/commit-doc-via-worktree.sh`, dont `ezk-archive` et `ezk-sprint` dépendent tous deux. Ici, on
# garde l'API propre à l'archive (slug/date → chemin `docs/sessions/` + branche `docs/archive-session-`)
# et on délègue. NE POUSSE JAMAIS (le push reste un geste du PO).
#
# Usage :
#   archive-commit.sh --repo <principal> --file <archive-absolue> --date <YYYY-MM-DD> --slug <slug> \
#                     --subject "<message de commit>" [--base main]
#
# Frontière ADR-0001 : ce script RANGE (déterministe) ; le SKILL (LLM) a JUGÉ quoi écrire dans l'archive.

set -uo pipefail

repo="" file="" date="" slug="" subject="" base="main"
usage() { sed -n '2,20p' "$0"; }
while (( $# )); do
  case "$1" in
    --repo)    repo="${2:-}"; shift 2 ;;
    --file)    file="${2:-}"; shift 2 ;;
    --date)    date="${2:-}"; shift 2 ;;
    --slug)    slug="${2:-}"; shift 2 ;;
    --subject) subject="${2:-}"; shift 2 ;;
    --base)    base="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) echo "archive-commit.sh : option inconnue « $1 »" >&2; exit 2 ;;
  esac
done
for req in repo file date slug subject; do
  [[ -n "${!req}" ]] || { echo "archive-commit.sh : --$req requis" >&2; exit 2; }
done
[[ -f "$file" ]] || { echo "archive-commit.sh : archive introuvable : $file" >&2; exit 2; }
# Valide slug et date EN AMONT : un slug avec « / » casserait le nom de branche et le chemin (c'est la
# racine du risque de perte de données) ; une date non conforme casserait `docs/archive-session-<date>`.
case "$slug" in */*|*..*|*' '*|"") echo "archive-commit.sh : --slug invalide (ni « / », ni « .. », ni espace, non vide) : « $slug »" >&2; exit 2 ;; esac
[[ "$date" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] || { echo "archive-commit.sh : --date attendu AAAA-MM-JJ : « $date »" >&2; exit 2; }

# Le helper partagé : relatif à ce script (skills/ezk-archive/scripts → bin). ship-merge surchargeable
# en test par EZK_ARCHIVE_SHIP_MERGE (contrat historique du DoD d'archive), relayé au helper.
# INSTALL LIEN / SOURCE : `../../../bin` tombe sur le vrai `products/mega-city/bin`.
HELPER="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../../bin" 2>/dev/null && pwd)/commit-doc-via-worktree.sh"
# INSTALL COPIE (défaut du bind global) : `../../../bin` = ~/.claude/bin, que la copie ne crée pas
# (seuls les fichiers du skill sont copiés, pas les helpers partagés). On résout alors le helper à
# côté du `ezk` sur le PATH : c'est un lien vers le vrai `products/mega-city/bin/` du catalogue, où
# vit `commit-doc-via-worktree.sh`. node est garanti présent (ezk tourne dessus). Fiche 20261013131625101.
if [[ ! -f "$HELPER" ]]; then
  ezk_bin="$(command -v ezk || true)"
  if [[ -n "$ezk_bin" ]]; then
    ezk_real="$(node -e 'process.stdout.write(require("fs").realpathSync(process.argv[1]))' "$ezk_bin" 2>/dev/null || true)"
    [[ -n "$ezk_real" && -f "$(dirname "$ezk_real")/commit-doc-via-worktree.sh" ]] && \
      HELPER="$(dirname "$ezk_real")/commit-doc-via-worktree.sh"
  fi
fi
[[ -f "$HELPER" ]] || { echo "archive-commit.sh : helper introuvable : $HELPER" >&2; exit 2; }

args=(
  --repo "$repo" --file "$file" --dest-rel "$(ezk --root "$repo" paths sprints)/$date-$slug.md"
  --branch-base "docs/archive-session-$date" --subject "$subject" --base "$base"
  --kind-tag ARCHIVE --kind-noun archive
)
[[ -n "${EZK_ARCHIVE_SHIP_MERGE:-}" ]] && args+=(--ship-merge "$EZK_ARCHIVE_SHIP_MERGE")

exec bash "$HELPER" "${args[@]}"
