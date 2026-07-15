---
id: 0037
title: Arbitrage double-writer sprint-status.yaml (porter la décision D7)
type: chore
priority: P1
status: todo
pr:
created: 2026-07-15
---

# 0037 — Arbitrage double-writer sprint-status.yaml

## Contexte / Problème

Amont validé par panel adverse (2026-07-15). La décision **D7** de la fiche
[0034](0034-mise-a-plat-post-pivot.md) (« double-writer `sprint-status.yaml`, jamais
tranché entre avril et juillet — re-porter en fiche avant archivage du snapshot, L3 »)
n'est portée par **aucune fiche** (vérifié : `ls features | grep double|sprint-status|writer`
= rien). C'est un angle mort structurant : `sprint-status.yaml` est déclaré source-of-truth
(ADR-009) mais deux chemins l'écrivent, et le **mode moniteur nominal** (ADR-028) change
qui devrait le posséder. Bloque l'archivage propre du brownfield-snapshot (§10.5).

## Proposition

1. Documenter les deux écrivains concurrents de `sprint-status.yaml` (chemin
   `YamlSprintStatusAdapter.ts:18` + l'autre écrivain à identifier).
2. Trancher — ou **re-différer explicitement avec motif** — lequel possède l'écriture en
   mode moniteur nominal (le moniteur observe un journal ; qui écrit le statut ?).
3. Lister l'impact runtime du choix (qui casse si on retire un writer).

## Critères d'acceptation

- [ ] La fiche identifie nommément les deux writers (fichier:ligne)
- [ ] Un writer nominal unique est tranché **ou** le double-writer est re-différé avec motif écrit
- [ ] Décidé **avant** l'archivage du brownfield-snapshot (dépendance de L3 dans 0034)
- [ ] Le double-écriture n'est plus un angle mort du backlog

## Notes / décisions

Purement une décision d'ownership/archi de données — aucune orientation produit
irréversible. Si le choix nominal implique de retirer un writer, ça devient un lot code
séparé (pas dans cette fiche, qui porte l'arbitrage).
