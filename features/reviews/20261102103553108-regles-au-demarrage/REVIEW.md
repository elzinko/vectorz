---
schema: method-review@0.1
fiche: "20261102103553108"
branch: "feat/20261102103553108-regles-au-demarrage"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T00-12-05-042Z-3ef43c62"
---

# Review — 20261102103553108

## Résumé

Revue adverse ezk-reviewer : GO. Seule la ligne d'ouverture change dans les 11 textes (+2 −0 chacun) ; le test de garde calcule les déclarants et couvre les 11. La carte compte 17 règles lues au démarrage, 0 citée sans être lue. Repli muet corrigé après revue : bundle: ou profile: est refusé au lieu d'afficher toute la carte. Remarque gardée : schema_version reste 1, sûr car le seul consommateur strict, mission control, change dans le même commit.

## Rendus

N.A.

## Matrice de validation

Gate locale 2274 tests verts ; suite cop1 app 359 et web 151 verts ; law-show.test.ts 29 tests ; garde sensible prouvée en retirant la ligne d'ezk-retro

## À tester

ezk law show skill:ezk-sprint ; ezk law show --json | jq .comptes ; vue Loi de mission control, compteur « lues au démarrage »

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
