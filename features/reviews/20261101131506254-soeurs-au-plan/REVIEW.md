---
schema: method-review@0.1
fiche: "20261101131506254"
branch: "feat/20261101131506254-soeurs-au-plan"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T00-12-05-042Z-3ef43c62"
---

# Review — 20261101131506254

## Résumé

Revue adverse ezk-reviewer : GO. Le format des lignes colle au vrai plan et se relit par parsePlanOrder ; rien n'écrit le plan. Retouches appliquées : un plan illisible fait échouer la commande au lieu de proposer toutes les sœurs ; « au plan » compte une entrée barrée, documenté.

## Rendus

N.A.

## Matrice de validation

Gate locale 2288 tests verts ; plan-proposal 4 tests ; apply split --dry-run sur dépôt jetable ; plan-lot 21 tests

## À tester

ezk backlog apply split <source> --into <a>,<b> --dry-run ; ezk backlog plan-lot 1

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
