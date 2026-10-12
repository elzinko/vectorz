---
id: "20261012231419198"
title: "Board : les deux pipelines — vue Cadrage et vue Développement"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, cadrage, developpement]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-10-13
---

# 20261012231419198 — Board : vue Cadrage et vue Développement

**En clair.** Deux onglets qui montrent les deux jauges d'une version, séparées. Le **Cadrage** range les versions par étape de grooming (à cadrer / en cours / cadré). Le **Développement** les range par étape de dev (à développer / en cours / développé) et offre un bouton « Lancer » sur chaque lot prêt.

**Si tu arrives frais.** Une version passe d'abord par le *cadrage* (amener ses fiches à « prête »), puis par le *développement* (les livrer). Ce sont deux jauges indépendantes, pas une seule progression.

## Contexte / Problème

Tranche de la refonte dashboard. Les deux jauges sont le cœur du pilotage par lot.

## Proposition

Périmètre :
- vue Cadrage : trois colonnes par étape de grooming ; jauge de cadrage ; la jauge de dev n'apparaît que pour un lot en cours de dev ;
- vue Développement : trois colonnes (à développer / en cours / développé) ; bouton « Lancer » sur un lot groomé et figé ;
- le lancement ouvre le configurateur (grooming / taille de sprint / rétro).

Hors périmètre : les tables d'activité par run (tranche dédiée).

## Critères d'acceptation

> À affiner au grooming.

- [ ] Les colonnes rangent les versions par étape, fidèles à la maquette.
- [ ] Le bouton « Lancer » n'apparaît que sur un lot prêt sans run en cours.
- [ ] Les jauges cadrage et dev restent distinctes.

## Comment vérifier

> À définir au grooming : comparaison écran ↔ maquette ; build cop1.

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-039](../docs/adr/ADR-039-board-unifie-run-moments-fiches-deux-portees-config.md).
