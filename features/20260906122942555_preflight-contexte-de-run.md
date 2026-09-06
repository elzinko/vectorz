---
id: "20260906122942555"
title: Préflight « Contexte de run » — bloc d'ouverture (origin/main, worktree, délégation)
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

# 20260906122942555 — Préflight « Contexte de run »

## En clair

Un run long démarre parfois à l'aveugle : on ne sait pas si la base est fraîche, si on est dans
un worktree, ni comment les écritures sont déléguées. Cette fiche demande un **bloc d'ouverture**
émis automatiquement au début de chaque run, qui pose ce contexte une fois pour toutes.

## Contexte / Problème

Deux symptômes de la rétro du 2026-09-05 partagent la même racine : le run ne s'annonce pas.

- Symptôme 1 : le run a comparé au `main` local (périmé) au lieu d'`origin/main`.
- Symptôme 5 : un sous-agent en worktree secondaire a écrit dans son worktree, pas chez le pilote.

Sans état de départ affiché, ces pièges passent inaperçus jusqu'à ce qu'ils cassent le run.

## Proposition

Faire émettre par `ezk-product-build` (étape 1) et le check de départ `ezk-sprint` un bloc
« Contexte de run » qui résout et affiche :

- `origin/main` après `git fetch` + le retard `HEAD..origin/main` (relié à la règle
  [development/run-freshness-origin-main](../products/mega-city/rules/development/run-freshness-origin-main.md)) ;
- worktree oui/non (et lequel) ;
- le mode de délégation d'écriture (inline vs sous-agent, relié à
  [development/worktree-secondary-inline-harvest](../products/mega-city/rules/development/worktree-secondary-inline-harvest.md)).

## Critères d'acceptation

- [ ] 100 % des runs longs ouvrent par ce bloc.
- [ ] Le bloc affiche le verdict de fraîcheur (retard N + décision).
- [ ] Le bloc affiche worktree oui/non et le mode de délégation.
- [ ] Gate locale verte (typecheck/lint/tests).

## Comment vérifier

Lancer `ezk-product-build` et `ezk-sprint` : le premier écran doit être le bloc « Contexte de run »,
avec origin/main résolu, worktree, et mode de délégation.

## Notes

Origine : rétrospective du 2026-09-05 (symptômes 1 + 5). Action de préflight qui rend visibles les
deux gardes-fous portés par les règles R1 et R5.
