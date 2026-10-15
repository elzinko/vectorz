---
id: "20261012231419237"
title: "Board : la chronologie condensée (une ligne par évènement, filtres)"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, chronologie]
status: ready
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

- [ ] Chaque évènement tient sur une ligne, temps compact à gauche.
- [ ] Les filtres par type et par lot marchent.
- [ ] Cliquer une ligne ouvre le bon détail (run, version, rétro…).

## Comment vérifier

1. `pnpm --dir products/cop1/packages/web build` passe.
2. Chaque évènement tient sur une ligne : temps compact à gauche, type, titre, pastilles (version, coût).
3. Les filtres par type (sprint / lancement / version / rétro / jalon) et par lot marchent ;
   « afficher plus » charge par lots ; cliquer une ligne ouvre son détail.

Preuve : capture avant (ancienne frise verbeuse) / après (condensée, une ligne par évènement).

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md).
- **Garde-fou multi-sessions (ADR-079)** : construire cette chronologie **sans supposer « un run =
  une session »** ni « un seul fil par projet ». La refonte v0.23
  ([ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md)) ajoute une **dimension
  session** : libellé de session par ligne, filtre par session, navigation à 3 niveaux. Prévoir
  qu'une ligne puisse porter un libellé de session, pour **étendre** au lieu de réécrire. Tranche
  v0.23 qui la généralise :
  [chronologie 3 niveaux + accueil](20261015082118382_board-chronologie-3-niveaux-accueil-projets.md).
