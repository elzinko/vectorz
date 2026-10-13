---
id: "20261012231419224"
title: "Board : la vue Fiches (kanban/liste + filtre par catégorie de version)"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, fiches]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-10-13
---

# 20261012231419224 — Board : la vue Fiches

**En clair.** Un onglet pour voir les fiches d'un projet, en kanban (par statut) ou en liste. Un filtre les range par **catégorie de version** : à venir / en cours / réalisées. Par défaut on montre « à venir » et « en cours », pas l'archive. Le sélecteur de lot repère la version en cours.

**Si tu arrives frais.** Une *fiche* est l'unité de travail. Une *version* (ou lot) regroupe des fiches.

## Contexte / Problème

Tranche de la refonte dashboard. Il faut retrouver vite les fiches qui comptent maintenant, sans noyer sous l'archive livrée.

## Proposition

Périmètre :
- kanban (idée / prête / en cours / livrée) ou liste, au choix ;
- filtre par catégorie de version (à venir / en cours / réalisées), multi-choix, défaut = à venir + en cours ;
- repère « en cours » dans le sélecteur de lot ;
- tri (priorité / statut / version / titre).

## Critères d'acceptation

> À affiner au grooming.

- [ ] Le filtre par catégorie cache les fiches des versions réalisées par défaut.
- [ ] Le sélecteur de lot marque la version en cours.
- [ ] Kanban et liste montrent les mêmes fiches filtrées.

## Comment vérifier

> À définir au grooming : comparaison écran ↔ maquette ; build cop1.

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md).
