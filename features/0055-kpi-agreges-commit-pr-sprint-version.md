---
id: 0055
title: KPI agrégés — rollups commit → PR → sprint → version depuis le silo
type: feature
priority: P2
product: vectorz
epic: 0051
status: idea
ready:
pr:
created: 2026-07-22
---

# 0055 — KPI agrégés (commit → PR → sprint → version)

## Contexte / Problème

Demande PO : « calculer des KPI pour les commit, PR, sprint, version ». Le **grain** du silo est
**commit / PR** ; sprint et version sont des **agrégations** de ce grain. Il faut des vues qui
**roulent** les KPI aux 4 échelles **sans** créer un 2ᵉ entrepôt (« base colonne » = une **vue à
la demande** sur le journal, pas un store séparé).

## Proposition

Des **vues SQL** (type **DuckDB** lisant le silo JSONL, ou équivalent embarqué) qui calculent :

- **commit** : dernière valeur par métrique ;
- **PR** : valeur + delta vs base ;
- **sprint** : agrégat sur la fenêtre de fiches du sprint ;
- **version** : agrégat au tag.

Zéro infra serveur ; reproductible (re-run = même résultat sur le même silo).

## Critères d'acceptation

- [ ] 4 vues (commit / PR / sprint / version) calculées **depuis le silo**
- [ ] Une **régression de KPI** est visible d'une PR à l'autre
- [ ] Reproductible (re-run déterministe sur silo figé)
- [ ] Aucun 2ᵉ entrepôt (vue à la demande sur le journal append-only)
- [ ] Gate locale verte

## Notes / décisions

- Le mapping sprint/version → fiches/tags s'appuie sur le front-matter du backlog + git (pas de
  nouvelle saisie).
- Dépend du silo de [0052](0052-socle-metrique-port-adaptateur-silo.md) /
  [0044](0044-mesureur-outcomes-script-append-mvp-a.md). Alimente
  [0056](0056-viz-qualite-mission-control.md).
