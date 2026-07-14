---
id: 0030
title: Renommer l'agent ezk-tdd → ezk-dev (TDD = capacité du dev, pas un rôle)
type: refactor       # feature | bug | refactor | chore
priority: P2         # P0 | P1 | P2 | P3
status: idea         # idea | todo | in-progress | blocked | shipped
pr:
created: 2026-07-12
---

## Contexte / Problème

Dans l'organigramme (cf. 0028), « **dev** » est le **rôle** ; le **TDD** est une
**capacité / méthode** que ce rôle emploie (aligné avec le domaine mega-city : les rules
et autres capacités sont mobilisées par des rôles, elles ne *sont* pas des rôles). Nommer
l'agent par sa méthode (`ezk-tdd`) brouille la carte des rôles.

## Proposition

- Renommer l'agent `ezk-tdd` → `ezk-dev`, description « dev qui travaille en **TDD** »
  (le rôle nommé, la capacité mentionnée).
- Mettre à jour les **références** : `ezk-sprint` (qui l'orchestre à l'étape TDD POC),
  `ezk-product-builder`, docs/README, diagramme 0028.

Découle de l'ADR 0028 qui **fige le vocabulaire** — donc à faire **après** 0028.

## Critères d'acceptation
- [ ] Agent renommé `ezk-dev` (dossier + frontmatter + déploiement symlink).
- [ ] Toutes les références à `ezk-tdd` mises à jour (au moins `ezk-sprint`).
- [ ] Description clarifie **rôle** (dev) vs **capacité** (TDD).
- [ ] Aucun agent/skill orphelin après le rename.

## Notes

Dépend de 0028. Issu du grooming session 2026-07-12.
