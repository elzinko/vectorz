---
id: "20261011091553794"
title: Le run autonome filtre l'éligibilité avant de délibérer et s'arrête à la borne de version
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [backlog]
status: idea
pr:
evidence: none # pas d'écran
created: 2026-10-11
---

# 20261011091553794 — Le run autonome filtre l'éligibilité avant de délibérer

**En clair.** Pendant le run autonome, le robot a longuement hésité « je construis ou pas ? » sur des
fiches qu'il n'aurait jamais dû toucher : trop grosses, risquées, ambiguës, ou que tu avais différées.
Cette délibération coûte des jetons pour rien. On veut qu'il écarte ces fiches **tout de suite**, sans
délibérer, et qu'il s'arrête par défaut à la fin de la version en cours.

**Si tu arrives frais.** Le « run autonome », c'est `ezk-product-build run --mode auto` : il enchaîne les
sprints seul. « Délibérer », c'est peser le pour et le contre d'une fiche avec des sous-agents, ce qui
consomme du contexte. La « borne de version », c'est la version en cours : la suivante ne se construit
qu'une fois la version taguée.

## Contexte / Problème

Constaté le 2026-10-11 sur le run v0.7. Au-delà de v0.7, le run est tombé sur des fiches inconstruisables
en autonomie. Pour chacune, il a délibéré avant de conclure « j'escalade au PO ». Cette hésitation a un
coût. Le garde-fou de tirage (ADR-0070, livré ce run) borne déjà le *tirage* à la version en cours ; il
manque la borne côté *run* et le tri d'éligibilité en amont de toute délibération.

## Proposition

Avant de délibérer sur une fiche, le run teste son éligibilité : taille, risque structurel, drapeau
bloqué, fiche différée par le PO. Une fiche inéligible est **escaladée immédiatement**, sans délibération.
Le run s'arrête par défaut à la borne de version : la suivante attend le tag. Ce tri s'appuie sur le
marqueur de blocage typé (fiche sœur [[20261002133125418]]) pour être déterministe.

## Critères d'acceptation

- [ ] Une fiche inéligible (grosse / risquée / bloquée / PO-différée) est escaladée sans délibération d'agents.
- [ ] Le run s'arrête par défaut à la fin de la version en cours ; la soupape `--all-versions` lève la borne.
- [ ] La raison de l'escalade est journalisée (`SPRINT.md`) et remonte dans le bilan de run.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# sur un backlog avec une fiche inéligible en tête : le run l'escalade sans délibérer, journalisé.
```

## Notes / décisions

- Sort de la rétro du run autonome v0.7 (capture `docs/captures/2026-10-11-retro-run-v07-autonome.md`, S5).
- Complète le garde-fou de tirage version-scope (ADR-0070) : l'un cadre le tirage, l'autre l'arrêt du run.
- Dépend du marqueur de blocage typé : [[20261002133125418]].
