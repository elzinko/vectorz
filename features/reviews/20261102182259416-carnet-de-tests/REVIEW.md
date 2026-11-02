---
schema: method-review@0.1
fiche: "20261102182259416"
branch: "feat/20261102182259416-carnet-de-tests"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "5efde85c"
status: ready-for-review
created: "2026-11-02"
run_id: "2026-11-02T19-56-45-703Z-158567af"
---

# Review — 20261102182259416

## Résumé

Revue adverse ezk-reviewer : GO. Les 6 critères sont prouvés par rejeu des tests et par des cas hostiles (traversée de chemin, option git déguisée en SHA, journal corrompu, dépôt sans HEAD). Aucun défaut bloquant.

## Rendus

N.A.

## Matrice de validation

vitest carto + manifeste 34/34 · vitest complet 2383/2383 · test-ezk-carto.sh 14/14 · test-archive-commit.sh rouge sur main depuis 9e60c6cc (étranger à la story)

## À tester

bash products/mega-city/bin/test-ezk-carto.sh ; npx vitest run src/core/__tests__/carto.test.ts

## Qualité

5 constats mineurs. Corrigés après revue : SHA validé à la lecture du journal, valeur fautive affichée pour app, limite stricte des 14 jours fixée par un test. Restent connus : chemin de preuve commençant par -- (écrire ./--nom), ajout concurrent fragile sur disque réseau.

## Provisioning / preview

Aucun : le carnet vit dans le dossier git commun, rien à installer

## Trouvailles

N.A.
