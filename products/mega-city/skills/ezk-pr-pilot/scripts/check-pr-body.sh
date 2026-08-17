#!/usr/bin/env bash
# check-pr-body.sh — le corps de PR est le RENDU de la fiche (ADR-0029), pas un résumé.
# Vérifie : ouverture « En clair », provenance de la fiche, sections du rendu, « Comment
# vérifier », matrice « Validation ».
#
# Les commentaires-guides HTML (`<!-- … -->`) sont STRIPPÉS avant toute analyse : leur texte
# (ex. « RENDU DE LA FICHE — En clair + sections ») ne doit jamais satisfaire un contrôle à la
# place du contenu VISIBLE (Codex #152 P1 « exclude guide comments »). Ils peuvent légitimement
# rester dans un corps rendu — on les ignore, ils ne prouvent ni ne cassent rien.
# Usage:
#   bash check-pr-body.sh                 # lit stdin
#   bash check-pr-body.sh path/to/body.md
#   gh pr view N --json body -q .body | bash check-pr-body.sh
set -euo pipefail

if [[ $# -ge 1 && -f "$1" ]]; then
  raw=$(cat "$1")
else
  raw=$(cat)
fi

# Corps VISIBLE = corps sans les commentaires-guides HTML. TOUS les contrôles portent sur lui.
body=$(perl -0pe 's/<!--.*?-->//gs' <<<"$raw")

missing=()

# 1. Ouverture « En clair » VISIBLE (Codex #152 P1 : ne pas la satisfaire via un commentaire-guide).
grep -qiF 'En clair' <<<"$body" || missing+=('ouverture « En clair » (visible, pas dans un commentaire)')

# 2. Provenance : un chemin CONCRET vers la fiche source (`features/…md`) — ou l'ADR source
#    (`docs/adr/…md`) pour un PR de méthode. La classe [A-Za-z0-9._/-] REJETTE le placeholder
#    `features/<id>_<slug>.md` (< > *) ; le placeholder lui-même est re-rejeté en 5 (Codex #152 P2 :
#    un chemin de fiche LIÉ cité ailleurs ne doit pas couvrir une provenance restée en placeholder).
if ! grep -qE '(features|docs/adr)/[A-Za-z0-9._/-]+\.md' <<<"$body"; then
  missing+=('provenance : chemin CONCRET de fiche (features/<id>_<slug>.md) — pas le placeholder')
fi

# 3. « Comment vérifier » (accepte le legacy « Comment tester »).
if ! grep -qF '## Comment vérifier' <<<"$body" && ! grep -qF '## Comment tester' <<<"$body"; then
  missing+=('## Comment vérifier (ou legacy ## Comment tester)')
fi

# 4. Schéma du RENDU (Codex #152 P1 « validate the complete rendered-body schema ») : le sentinel de
#    template (5) attrape le squelette NON MODIFIÉ, mais PAS un corps TRONQUÉ dont on aurait SUPPRIMÉ
#    des sections. On exige donc EXPLICITEMENT la matrice « Validation » (seul bloc propre à la PR,
#    ADR-0029 pt 4 — présente dans TOUT rendu, fiche comme ADR) et, pour un rendu de FICHE, ses
#    sections narratives. Un rendu d'ADR (provenance docs/adr, pas de features/…) n'exige que Validation.
grep -qE '^## Validation' <<<"$body" || missing+=('## Validation (matrice de statut — ADR-0029 pt 4)')
if grep -qE 'features/[A-Za-z0-9._/-]+\.md' <<<"$body"; then
  for h in '## Contexte' '## Proposition' '## Critères'; do
    grep -qF "$h" <<<"$body" || missing+=("section de fiche manquante : « ${h}… » (rendu tronqué)")
  done
fi

# 5. Template NON rendu (Codex P1 rounds 2-4 + P2 provenance) : présence des sections ≠ contenu réel.
#    Un template dont on n'a remplacé QUE le chemin (ou tout SAUF le En clair) garde des placeholders
#    de CONTENU. On les couvre TOUS : ouverture (`<…ouverture de la fiche, recopiée…>`), sections
#    (`<recopié de la fiche>`), H1 (`# <id> — <titre>`, `<titre>`) et la provenance placeholder
#    `<id>_<slug>` (Codex #152 P2). Un vrai rendu les a remplacés.
if grep -qE '<recopié de la fiche|<titre>|ouverture de la fiche, recopié|<id>_<slug>' <<<"$body" \
   || grep -qE '^# <id>' <<<"$body"; then
  missing+=('corps = squelette de template non rendu (placeholders de contenu présents) — recopier la fiche')
fi

if ((${#missing[@]})); then
  echo "PR body incomplet (ADR-0029 — le corps rend la fiche) — manque :" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "OK — En clair + provenance + sections du rendu + Comment vérifier + Validation présents"
