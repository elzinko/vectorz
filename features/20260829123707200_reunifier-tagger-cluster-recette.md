---
id: "20260829123707200"
title: Réunifier (merge/split) et tagger le cluster de fiches « recette / chef / extraction » — sprint de mise en ordre
type: chore
priority: P1
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-29
---

## En clair

Plusieurs fiches tournent autour du **même sujet** (recettes, extraction, chef). Avant de
construire quoi que ce soit, il faut les **mettre en ordre** : lesquelles **fusionner**,
lesquelles **séparer**, et écrire la **frontière** de chacune. Un sprint de rangement, pas
une feature produit.

## Les fiches qui gravitent

- [`20260824122629794`](done/20260824122629794_ezk-extract-capitaliser-feature-en-recette.md) —
  feature codée → recette (**l'extraction**), P0.
- [`0147`](0147-ezk-recipy-mvp.md) — `ezk-recipy` : scanner des repos froids → proposer des
  idées de skills (sourcing).
- [`20260824141336516`](20260824141336516_recette-mise-en-place-ci-type-muti.md) — recette
  « mise en place CI, façon muti ».
- `20260821172716540` — recette « site produit à règles activables ».
- [`20260829123707100`](20260829123707100_labo-de-cuisine-journal-difficultes.md) — **labo
  de cuisine** (journal des difficultés) — nouvelle.
- ADR-0013 — doctrine « entonnoir, jamais de fabrique ».

## À trancher (grooming)

- **epic vs merge vs liens** : les regrouper sous un **epic** (le champ `epic:` existe mais
  sert peu), les **fusionner**, ou les garder **séparées avec des liens croisés** ? Avis PO
  du jour : « **on note juste** » maintenant, on réunifie dans un **prochain sprint**.
- **Tags** : en profiter pour **taguer** les fiches (les retrouver plus vite). **⚠️ À
  challenger d'abord** : un tag apporte-t-il vraiment plus que le front-matter (`type`,
  `priority`, `product`) + une recherche plein-texte ? Risque = une **taxonomie qui diverge**
  et qu'on ne maintient pas. Décider **avant** d'ajouter le champ.

## Notes

Origine : session samplerz du 2026-08-29. `idea` — **à groomer** (prochain sprint).
