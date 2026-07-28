---
id: 2020
product: mega-city
title: explorer le domaine « stack → toolchain » (cousin de Cap sur l'axe techno)
type: feature
priority: P2
status: idea
pr:
created: 2026-06-27
---

## Contexte / Problème
Émergé du brainstorm design-system. Un **besoin** (design system, tests, lint…) × une **stack**
(react+vite, fastapi+vanilla, expo…) → des **outils** à installer/configurer. C'est plus général
que le design system, et c'est un **trou du domaine** : mega-city modélise l'axe **hôte-LLM**
(`Cap`) mais pas l'axe **stack-techno**. Un skill ne doit PAS hardcoder cette matrice (responsabilité unique).

## Proposition (exploration — volontairement ouverte)
Explorer la forme : un `Profile` gagne-t-il une dimension `stack` ? un catalogue `toolchains/`
(besoin × stack → outils) ? un **résolveur « cousin de `Cap` »** sur l'axe techno ? Produire un
**petit ADR** si la forme se fige. **Ne pas implémenter** tant que ce n'est pas cadré.

## Critères d'acceptation (spike)
- [ ] 1-2 cas réels esquissés (outils design-system pour react vs fastapi)
- [ ] décision esquissée : `Profile.stack` ? catalogue séparé ? résolveur ?
- [ ] ADR court si la forme se fige ; sinon rapport « pas encore mûr » + ce qui manque

## Notes
Déclenché par **0019** (le skill délègue ici le choix d'outils). Touche potentiellement
le modèle (`docs/domain.ts`). À garder ouvert : l'utilisateur a dit « ça reste à affiner ».

**2026-07-17 (review)** : rétrogradée `todo → idea`. C'est un **spike exploratoire**
explicitement « ne pas implémenter tant que pas cadré » — sa place est dans les idées
(hors flux P0→P3), pas dans l'actionnable. À promouvoir quand la forme se fige (ADR court).
