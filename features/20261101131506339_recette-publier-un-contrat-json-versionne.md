---
id: "20261101131506339"
title: "Créer la recette « publier un contrat JSON versionné »"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recette, contrat, json]
status: idea
pr:
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

La méthode a publié deux contrats JSON le même jour, avec le même patron : format décrit en zod,
schéma publié tolérant, exemples générés sur une fixture, test de contrat. La fiche de mission control
en consommera d'autres. Cette fiche capitalise ce patron en recette, pour ne pas le redécouvrir.

## Contexte / Problème

Le patron vit aujourd'hui dans deux implémentations :

- `products/mega-city/src/core/board-contract.ts` (contrat de `ezk board show --json`) ;
- `products/mega-city/src/core/fiche-detail.ts` (contrat de `ezk backlog show --json`) ;
- les fichiers communs : `products/mega-city/src/io/contract-files.ts` (fixture, rendu des schémas
  tolérants), `products/mega-city/bin/board-contract.ts` (régénération), `contracts/*/README.md`.

Leçons à porter dans la recette : zod strict pour le producteur et schéma publié tolérant
(`tolerant()`), une fixture construite une fois par fichier de test, une sortie qui ne se coupe pas
sur un tuyau (`process.exitCode`), la vérification en vrai sur le plus gros projet. L'outil de
détection des recettes (`ezk-chef suggest`) n'a pas pu tourner (rapport de sprint non daté) : le
candidat a été jugé à la main.

## Valeur

Pour qui écrit le prochain contrat : partir d'une recette relue, au lieu de relire deux
implémentations et de refaire les deux erreurs déjà payées (schéma trop strict, sortie coupée).

## Proposition

À préciser au grooming.

- Une recette dans `recipes/`, au format du contrat de recette, qui pointe vers les deux
  implémentations (`fichier:ligne`) sans recopier leur code.
- Elle passe `ezk-chef check`.

## Critères d'acceptation

- [ ] La recette existe, passe `ezk-chef check`, et figure dans le livre des recettes.
- [ ] Elle pointe vers les deux contrats existants et vers `contract-files.ts`.
- [ ] Elle nomme les deux pièges : schéma publié strict, sortie coupée à 64 Ko.

## Comment vérifier

```bash
ezk recipes
```

## Notes

- Née de la rétro légère du 2026-11-01 (P9 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
