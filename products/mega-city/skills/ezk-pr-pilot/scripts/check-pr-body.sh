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

# 2. Provenance = le PREMIER chemin concret du corps = la LIGNE DE PROVENANCE en tête du rendu
#    (template : `> 🗎 Rendu de la fiche <path>`), AVANT la prose. `features/…md` (fiche) ou
#    `docs/adr/…md` (PR de méthode). La classe [A-Za-z0-9._/-] REJETTE le placeholder
#    `features/<id>_<slug>.md` (< > *) ; le placeholder est re-rejeté en 5 (Codex #152 P2).
#    On CLASSE fiche-vs-ADR d'après CETTE ligne — pas d'après un lien de fiche cité plus bas dans
#    la prose (Codex #152 P1 « classify from provenance » : un ADR peut lier des features/done/*.md).
prov=$(grep -oE '(features|docs/adr)/[A-Za-z0-9._/-]+\.md' <<<"$body" | head -1)
if [[ -z "$prov" ]]; then
  missing+=('provenance : chemin CONCRET de fiche (features/<id>_<slug>.md) — pas le placeholder')
fi

# 3. « Comment vérifier » (accepte le legacy « Comment tester »).
if ! grep -qF '## Comment vérifier' <<<"$body" && ! grep -qF '## Comment tester' <<<"$body"; then
  missing+=('## Comment vérifier (ou legacy ## Comment tester)')
fi

# 4. Schéma du RENDU (Codex #152 P1 « validate the complete rendered-body schema ») : le sentinel de
#    template (5) attrape le squelette NON MODIFIÉ, mais PAS un corps TRONQUÉ dont on aurait SUPPRIMÉ
#    des sections. On exige donc EXPLICITEMENT la matrice « Validation » (seul bloc propre à la PR,
#    ADR-0029 pt 4 — présente dans TOUT rendu, fiche comme ADR) ; et, SI la provenance est une FICHE
#    (pas un ADR), ses sections narratives. La classification vient de $prov (la ligne de provenance),
#    jamais d'un lien de fiche dans la prose (Codex #152 P1 « classify from provenance field »).
grep -qE '^## Validation' <<<"$body" || missing+=('## Validation (matrice de statut — ADR-0029 pt 4)')
if [[ "$prov" == features/* ]]; then
  for h in '## Contexte' '## Proposition' '## Critères'; do
    grep -qF "$h" <<<"$body" || missing+=("section de fiche manquante : « ${h}… » (rendu tronqué)")
  done
fi

# 5. Template NON rendu (Codex P1 rounds 2-4 + P2 provenance) : présence des sections ≠ contenu réel.
#    Un template dont on n'a remplacé QUE le chemin (ou tout SAUF le En clair) garde des placeholders
#    de CONTENU. On les couvre TOUS : ouverture (`<…ouverture de la fiche, recopiée…>`), sections
#    (`<recopié de la fiche>`), H1 (`# <id> — <titre>`, `<titre>`), la provenance placeholder
#    `<id>_<slug>` (Codex #152 P2) ET les placeholders d'onboarding du template de fiche (fiche 0191)
#    — l'ouverture « Si tu arrives frais » et la section conditionnelle « ## Glossaire » — laissés
#    non remplis. Un vrai rendu les a remplacés (ou a retiré la section « ## Glossaire » si sans objet).
if grep -qE '<recopié de la fiche|<titre>|ouverture de la fiche, recopié|<id>_<slug>|vocabulaire projet minimal pour lire|obligatoire si la fiche emploie du jargon interne' <<<"$body" \
   || grep -qE '^# <id>' <<<"$body"; then
  missing+=('corps = squelette de template non rendu (placeholders présents, dont onboarding « Si tu arrives frais » / « ## Glossaire ») — recopier la fiche, remplir ou retirer')
fi

if ((${#missing[@]})); then
  echo "PR body incomplet (ADR-0029 — le corps rend la fiche) — manque :" >&2
  printf '  - %s\n' "${missing[@]}" >&2
  exit 1
fi

echo "OK — En clair + provenance + sections du rendu + Comment vérifier + Validation présents"
