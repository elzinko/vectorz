---
schema: method-review@0.1
fiche: "20261103161632129"
branch: "feat/20261103161632129-messages-mission-control"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T00-12-05-042Z-3ef43c62"
---

# Review — 20261103161632129

## Résumé

Revue adverse ezk-reviewer : GO. Les neuf messages nomment mission control ; le message d'abandon ne cite que ce qui existe (run_finished status abandoned, route du daemon avec runDir). Retouche appliquée : le message dit l'en-tête Content-Type JSON exigé par la garde, et que le geste peut être éteint ; le test attend run_finished seul.

## Rendus

N.A.

## Matrice de validation

Gate locale 2289 tests verts ; supervision 235 ; app cop1 359 ; web 151 ; grep des trois mots sans message affiché

## À tester

Survoler « v1 / archives » dans mission control ; lancer un run bloquant pour lire le message d'abandon

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
