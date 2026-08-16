#!/usr/bin/env bash
# check-pr-body.sh — le corps de PR est le RENDU de la fiche (ADR-0029), pas un résumé.
# Vérifie : ouverture « En clair », provenance de la fiche, section « Comment vérifier ».
# Usage:
#   bash check-pr-body.sh                 # lit stdin
#   bash check-pr-body.sh path/to/body.md
#   gh pr view N --json body -q .body | bash check-pr-body.sh
set -euo pipefail

if [[ $# -ge 1 && -f "$1" ]]; then
  body=$(cat "$1")
else
  body=$(cat)
fi

missing=()

# 1. Ouverture « En clair » (le rendu de la fiche en hérite — règle human-facing-lisibility).
grep -qiF 'En clair' <<<"$body" || missing+=('ouverture « En clair »')

# 2. Provenance : un chemin de fiche `features/<id>…md` OU le titre legacy « ## Lien fiche ».
if ! grep -qE 'features/[^[:space:]]+\.md' <<<"$body" && ! grep -qF '## Lien fiche' <<<"$body"; then
  missing+=('provenance fiche (chemin features/<id>_*.md ou ## Lien fiche)')
fi

# 3. « Comment vérifier » (nouveau) — accepte le legacy « Comment tester ».
if ! grep -qF '## Comment vérifier' <<<"$body" && ! grep -qF '## Comment tester' <<<"$body"; then
  missing+=('## Comment vérifier (ou legacy ## Comment tester)')
fi

if ((${#missing[@]})); then
  echo "PR body incomplet (ADR-0029 — le corps rend la fiche) — manque :" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "OK — En clair + provenance fiche + Comment vérifier présents"
