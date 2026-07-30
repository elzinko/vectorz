---
id: 0056
title: Visualisation — onglet « qualité par PR » dans mission-control
type: feature
priority: P2
product: vectorz
epic: 0051
status: idea
ready:
pr:
created: 2026-07-22
---

# 0056 — Onglet « qualité par PR » (mission-control)

## Contexte / Problème

Demande PO : « visualiser ces KPI dans une interface ». mission-control
([0022](0022-observabilite-mission-control-donnees-deja-collectees.md)) affiche déjà les runs —
**foyer naturel** d'un onglet qualité. Attention : 0022 pose « **aucune nouvelle collecte** » →
cet onglet **compose sa coquille web** mais est une feature **séparée** (il lit des données que
0052/0055 ont produites).

## Proposition

Un **onglet « qualité »** qui lit les **vues KPI** ([0055](0055-kpi-agreges-commit-pr-sprint-version.md))
et affiche **courbes par PR** + **tendance** (couverture, sécu, complexité selon les adaptateurs
branchés). Lecture seule : aucune collecte côté UI.

## Critères d'acceptation

- [ ] Un onglet affiche **≥1 KPI en courbe par PR**
- [ ] Il **lit** le silo / les vues — **aucune nouvelle collecte** côté UI
- [ ] Aucun onglet mort / API 404 (leçon 0022)
- [ ] Gate locale verte, puis E2E (UI)

## Notes / décisions

- Compose la **coquille web** de 0022, ne la modifie pas dans ses invariants.
- Dépend de [0055](0055-kpi-agreges-commit-pr-sprint-version.md).
