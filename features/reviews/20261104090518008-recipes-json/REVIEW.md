---
schema: method-review@0.1
fiche: "20261104090518008"
branch: "feat/20261104090518008-recipes-json"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "e94236ec"
status: approved
created: "2026-11-04"
run_id: "2026-11-04T09-07-25-962Z-0e3680b2"
---

# Review — 20261104090518008

## Résumé

Revue adverse ezk-reviewer : GO. --json publie la même découverte que le texte, en données, sous un contrat versionné contracts/recipes/v1 ; un brouillon nomme ses champs manquants ; la sortie texte ne change pas. Non bloquant : le premier commit portait une erreur de typecheck dans un test, corrigée au commit suivant ; une recette sans id reste omise, conforme à la règle du livre.

## Rendus

N.A.

## Matrice de validation

Gate locale : 2327 tests et 48 suites de scripts, dont test-ezk-recipes.sh J1-J4 (parité 16 == 16 en JSON) ; typecheck vert

## À tester

ezk recipes --json : 16 recettes au catalogue, chacune avec source et dir ; --root sur un projet avec RECIPE.md liste sa recette et son dossier

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
