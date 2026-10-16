---
id: "20261012231419224"
title: "Board : la vue Fiches (kanban/liste + filtre par catégorie de version)"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, fiches]
status: shipped
blocked:
pr: "local (b493d3d9)"
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

- [ ] Le filtre par catégorie cache les fiches des versions réalisées par défaut.
- [ ] Le sélecteur de lot marque la version en cours.
- [ ] Kanban et liste montrent les mêmes fiches filtrées.

## Comment vérifier

1. `pnpm --dir products/cop1/packages/web build` passe.
2. Le filtre par catégorie de version (à venir / en cours / réalisées) masque les versions réalisées
   par défaut ; cocher « réalisées » les fait apparaître.
3. Kanban et liste montrent le même ensemble filtré ; le sélecteur de lot marque la version en cours ;
   le tri (priorité / statut / version / titre) fonctionne.

Preuve : capture avant (défaut sans l'archive) / après (avec « réalisées »).

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](../20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-074](../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md).
- **Limite connue (pour le read-model)** : une fiche sans catégorie de version (sans
  version, ou version hors des listes du projet) n'est gouvernée par aucun toggle de
  catégorie ; elle reste montrée en mode « toutes versions » et joignable par le lot
  « sans version ». Quand le vrai backlog injectera des fiches sans version en nombre,
  prévoir un toggle dédié « sans version ».
