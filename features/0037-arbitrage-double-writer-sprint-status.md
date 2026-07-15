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
n'est portée par **aucune fiche** (vérifié : `ls features | grep -E 'double|sprint-status|writer'`
= rien avant cette fiche). C'est un angle mort structurant : `sprint-status.yaml` est déclaré source-of-truth
(ADR-009) mais deux chemins l'écrivent, et le **mode moniteur nominal** (ADR-028) change
qui devrait le posséder. Bloque l'archivage propre du brownfield-snapshot (§10.5).

**RESCOPÉE 2026-07-15 (ADR-029, relecture PO)** : la direction est tranchée —
`sprint-status.yaml` est un artefact BMAD (ADR-009) qui **meurt en E4** ; la source de
vérité native du statut est le **front-matter des fiches** (convention ezk-backlog). Les
lecteurs runtime basculent en E3. Cette fiche ne porte plus l'arbitrage de destination,
mais la **fenêtre transitoire**.

## Proposition

1. Documenter les deux écrivains concurrents de `sprint-status.yaml`
   (`YamlSprintStatusAdapter` + le second à identifier, fichier:ligne) et les deux
   lecteurs (`YamlSprintStatusAdapter.ts:18`, `OrchestratorService.ts:89`).
2. Documenter la fenêtre transitoire jusqu'à E4 : les writers BMAD restent vivants —
   **gel des runs pilote** sur la fenêtre (le pilote n'est pas utilisé aujourd'hui,
   coût nul) ; mettre à jour l'invariant `sprint-status-coupling-invariant.test.ts` au
   fil de la bascule E3.
3. Lister ce que E3 devra reprendre : mapping statuts BMAD → front-matter, écriture en
   retour (`persistStatus`, 5 sites), sémantique épic/ordre, checksum.

## Critères d'acceptation

- [ ] Writers et lecteurs nommés (fichier:ligne)
- [ ] Fenêtre transitoire documentée (gel des runs pilote acté jusqu'à E4)
- [ ] La liste de reprise E3 est complète (statuts, écriture, épic, checksum)
- [ ] Décidé **avant** l'archivage du brownfield-snapshot (dépendance de L3 dans 0034)

## Notes / décisions

D7 tranchée en direction par ADR-029 + relecture PO (2026-07-15) : ni `.cop1/` ni
`.supervision/` — le fichier disparaît avec BMAD, le front-matter des fiches est la
source de vérité native. Cette fiche documente le transitoire ; le lot code vit dans E3.
