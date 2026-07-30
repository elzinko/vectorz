---
id: 0119
title: capture — charger un vrai corpus pour judge (détection de doublon)
type: feature
priority: P2
product: mega-city
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0107 (ADR-0004 §d). Au POC, l'orchestrateur `capture` appelle
`ports.judge(authored, [])` : le corpus est **toujours vide**, donc le juge ne peut
pas détecter un doublon ni une incohérence avec le catalogue existant. L'avis reste
consultatif (non bloquant) mais aveugle.

## Proposition
Charger le catalogue courant (via `loadCatalog`) et passer les `Rule[]` pertinentes
à `judge`, pour que son avis (notes du journal) soit fondé sur l'existant. Le juge
reste **non bloquant** (un `ok:false` est tracé, jamais exécutoire).

## Critères d'acceptation
- [ ] `judge` reçoit le corpus réel (rules du catalogue), plus `[]`
- [ ] un doublon évident est signalé dans les notes (avis), sans bloquer la capture
- [ ] aucun appel LLM réel en test (ports mockés)

## Notes
Le chargement vit au bord (orchestrateur), pas dans `planCapture` (qui reste pur).
