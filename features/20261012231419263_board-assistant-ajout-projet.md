---
id: "20261012231419263"
title: "Board : l'assistant d'ajout de projet (racine, outil, défauts)"
type: feature
priority: P2
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, config, onboarding]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-10-13
---

# 20261012231419263 — Board : l'assistant d'ajout de projet

**En clair.** Depuis le sélecteur de projet, un bouton « + Ajouter un projet » ouvre un assistant : on indique la racine du projet, on choisit l'outil (IDE), et une config par défaut s'applique. Le mapping tier→modèle vient de l'outil (réglé une fois), pas redemandé à chaque projet.

**Si tu arrives frais.** Ajouter un projet au board, c'est faire une première passe de sa config, guidée.

## Contexte / Problème

Tranche de la refonte dashboard. Aujourd'hui on ne peut pas ajouter un projet depuis l'interface.

## Proposition

Périmètre :
- bouton « + Ajouter un projet » dans la modale de sélection ;
- assistant : racine du projet, outil (IDE), config de départ (défauts de la méthode, modifiables ensuite) ;
- le mapping vient de la config outil, pas redemandé.

## Critères d'acceptation

> À affiner au grooming.

- [ ] On ajoute un projet depuis l'interface, avec une config par défaut.
- [ ] L'assistant hérite du mapping de l'outil, sans le redemander.

## Comment vérifier

> À définir au grooming : comparaison écran ↔ maquette ; build cop1.

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md).
