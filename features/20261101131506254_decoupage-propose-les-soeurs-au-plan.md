---
id: "20261101131506254"
title: "Après un découpage, l'outil propose d'inscrire les fiches sœurs au plan"
type: feature
priority: P2
product: mega-city
milestone: preparation
version:
labels: [backlog, plan, decoupage]
status: idea
pr:
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

Quand une fiche est découpée en sœurs, aucune ne rejoint le plan. L'outil de tirage les déclare
alors « hors plan » et ne les retient pas, même prêtes. Cette fiche fait proposer l'inscription des
sœurs au plan dans la même passe, avec l'accord du PO.

## Contexte / Problème

Constaté le 2026-11-01 : la fiche du contrat JSON du board, regroomée et découpée en quatre sœurs
(milestone `board`), n'était pas dans `features/PLAN.md`. Une fois prête, `ezk backlog plan-lot 1`
l'a listée « hors plan (prêtes, non retenues : la séquence vient du PLAN) ». Il a fallu l'inscrire à
la main, avec ses trois sœurs.

Le plan est tenu à la main (`skills/ezk-backlog/SKILL.md`, « séquence décidée ») : l'outil doit
proposer, pas écrire en silence.

## Valeur

Pour le PO qui découpe : les fiches qu'il vient de créer entrent dans la séquence sans geste oublié.
Pour le run autonome : plus de fiche prête bloquée « hors plan ».

## Proposition

À préciser au grooming.

- Le découpage (`ezk backlog apply`, ou le groom qui produit des sœurs) imprime les lignes de plan
  à ajouter sous la milestone des sœurs, prêtes à copier, ou les écrit avec un accord explicite.
- `plan-lot` qui écarte une fiche prête « hors plan » dit la commande qui l'y inscrit.

## Critères d'acceptation

- [ ] Après un découpage, la sortie propose l'inscription de chaque sœur au plan.
- [ ] Aucune écriture du plan sans accord explicite.
- [ ] Sur les 5 prochains découpages, 0 fiche prête « hors plan » juste après.

## Comment vérifier

```bash
ezk backlog plan-lot 1
```

## Notes

- Née de la rétro légère du 2026-11-01 (P7 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
