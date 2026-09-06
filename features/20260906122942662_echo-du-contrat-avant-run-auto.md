---
id: "20260906122942662"
title: Écho du contrat avant un run auto (opérateur absent)
type: chore
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [methode, retro-2026-09-05, run-intake]
status: idea
ready:
pr:
created: 2026-09-06
---

# 20260906122942662 — Écho du contrat avant run auto

## En clair

Avant de lancer un run en `--mode auto` alors que personne n'est aux commandes, la machine doit
dire ce qu'elle va faire toute seule. Trois lignes suffisent : je merge les fiches vertes, je
m'arrête sur les 4 STOP, mon cap de tokens est X.

## Contexte / Problème

Symptôme 3 de la rétro du 2026-09-05 : un run auto démarre sans rappeler son contrat. L'opérateur
absent ne peut pas vérifier, avant de partir, que le comportement attendu (merge auto, STOP,
budget) est bien celui qu'il croit.

## Proposition

Avant tout `--mode auto` lancé avec opérateur absent, émettre un écho du contrat en 3 lignes :

1. « En auto, je MERGE les fiches vertes » (cf. règle
   [development/merge-when-absent-default](../products/mega-city/rules/development/merge-when-absent-default.md)).
2. « Je m'arrête sur les 4 STOP » (irréversible/sortant, budget, idée produit, exigences
   contradictoires).
3. « Cap tokens = X ».

## Critères d'acceptation

- [ ] L'écho des 3 lignes précède tout run `--mode auto` avec opérateur absent.
- [ ] Les 3 lignes reflètent l'état réel (mode, liste des STOP, cap effectif).
- [ ] Gate locale verte.

## Comment vérifier

Lancer `ezk-product-build --mode auto` sans checkpoint interactif : les 3 lignes de contrat
s'affichent avant le premier sprint.

## Notes

Origine : rétrospective du 2026-09-05 (symptôme 3). Petit garde-fou de transparence, complémentaire
du RUN-REPORT [20260906122942607](20260906122942607_run-report-synthese-fin-de-run.md) : l'un annonce
le contrat, l'autre rend compte de son respect.
