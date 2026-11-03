---
id: "20261101131506339"
title: "Créer la recette « publier un contrat JSON versionné »"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recette, contrat, json]
status: ready
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

Précisée au grooming du 2026-11-03 (run autonome). Depuis la fiche, la méthode a publié cinq autres
contrats sur le même patron (`contracts/` : board-show, backlog-show, board-process, board-maps,
config-show, law-show, law-object). La recette part de ces sept preuves.

1. **Une recette** `recipes/publier-un-contrat-json-versionne.md`, au format du gabarit
   (`recipes/RECIPE_TEMPLATE.md`), `home: central`. Elle pointe vers les implémentations par
   `fichier:ligne` et ne recopie aucun code.
2. **Le patron en étapes** : le format décrit une fois en zod strict côté producteur ; le schéma publié
   rendu tolérant (`tolerant()` de `src/io/contract-files.ts`) ; un exemple généré sur une fixture ;
   une commande `…:contract [--write]` qui régénère ou vérifie ; un test de contrat qui échoue si les
   fichiers ne sont plus à jour ; un consommateur qui lit `schema_version` d'abord.
3. **Les pièges payés**, chacun avec sa date : le schéma publié trop strict ; la sortie coupée à 64 Ko
   par un `process.exit` dans un tuyau (on pose `process.exitCode`) ; une valeur d'énumération ajoutée
   qu'un consommateur strict refuse (loi du 2026-11-03 : le consommateur change dans le même commit).

## Critères d'acceptation

- [x] La recette existe, passe `ezk-chef check`, et figure dans le livre des recettes.
- [x] Elle pointe vers au moins deux contrats existants et vers `contract-files.ts`, par `fichier:ligne`.
- [x] Elle nomme les trois pièges : schéma publié strict, sortie coupée à 64 Ko, énumération élargie.

## Comment vérifier

```bash
ezk recipes
```

## Notes

- Née de la rétro légère du 2026-11-01 (P9 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
- Groomée le 2026-11-03 (run autonome) : sept contrats existent désormais ; un troisième piège (énumération
  élargie, sprint 13 du 2026-11-03) rejoint les deux d'origine.
- Prête le 2026-11-03 : porte « prête » passée en run autonome (ezk-pm GO). Conditions : `fichier:ligne`
  relus le jour du build, sans code recopié ; chaque piège porte sa date et sa source.
- **Preuves du build (2026-11-03).** `ezk-chef` : GO (gate mécanique verte, livre régénéré, 73 liens,
  13 pointeurs relus). Revue adverse : GO (chaque `fichier:ligne` ouvert, pièges datés et vérifiés,
  `law:contract` vert). Retouches : les vraies lignes de `process.exitCode`, un accord dans « En clair ».
