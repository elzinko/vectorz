---
schema: method-review@0.1
fiche: "20261102100506119"
branch: "fix/20261102100506119-blocage-corps-invalide"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T17-58-04-719Z-1c9ce288"
---

# Review — 20261102100506119

## Résumé

Revue adverse ezk-reviewer : GO. Le corps est lu avant la recherche du blocage : un JSON cassé ne se déguise plus en 404. Le 404 par sous-chaîne not found tient : BlockageService lève Blocage not found ; les branches 404 et 500 sont testées. Remarque non bloquante : un type d'erreur dédié serait plus robuste que message.includes.

## Rendus

N.A.

## Matrice de validation

Gate locale 2313 tests verts ; 797 tests mission control ; typecheck et biome verts ; rejeu sur un vrai daemon 400 400 404

## À tester

POST /api/blocages/<id>/resolve avec en-tête JSON : sans corps 400, corps valide sur id inconnu 404

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
