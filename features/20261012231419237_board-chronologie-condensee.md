---
id: "20261012231419237"
title: "Board : la chronologie condensée (une ligne par évènement, filtres)"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, chronologie]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-10-13
---

# 20261012231419237 — Board : la chronologie condensée

**En clair.** Un onglet qui déroule tout l'historique d'un projet, **une ligne par évènement** : le temps compact à gauche, le type, le titre, puis des pastilles (version, coût). On filtre par type d'évènement et par lot. Cliquer un évènement ouvre le détail concerné.

**Si tu arrives frais.** Un *évènement* est un jalon daté : un run lancé, un lot figé, une version taguée, une rétro, un sprint.

## Contexte / Problème

Tranche de la refonte dashboard. L'ancienne frise était verbeuse (deux lignes, du texte redondant). On la condense.

## Proposition

Périmètre :
- une ligne par évènement : temps compact à gauche, type, titre, pastilles (version, coût), flèche ;
- filtres par type (sprint / lancement / version / rétro / jalon) et par lot ;
- « afficher plus » par lots ; chaque ligne cliquable vers son détail.

## Critères d'acceptation

> À affiner au grooming.

- [ ] Chaque évènement tient sur une ligne, temps compact à gauche.
- [ ] Les filtres par type et par lot marchent.
- [ ] Cliquer une ligne ouvre le bon détail (run, version, rétro…).

## Comment vérifier

> À définir au grooming : comparaison écran ↔ maquette ; build cop1.

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-039](../docs/adr/ADR-039-board-unifie-run-moments-fiches-deux-portees-config.md).
