---
id: 0005
title: remote + licence (backup + base OSS)
type: chore
priority: P2
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Pas de backup aujourd'hui (repo local). Pré-requis pour l'OSS plus tard.

## Proposition
Pousser `mega-city` sur un remote privé + ajouter une licence (MIT au moment de l'OSS).

## Critères d'acceptation
- [x] remote configuré, historique poussé — **fait 2026-07-04** : `github.com/elzinko/mega-city` (privé), `origin/main`, auto-delete-branch-on-merge activé.
- [ ] licence décidée (privé d'abord → LICENSE en attente ; MIT au moment de l'OSS)

## Notes
Moitié « remote » livrée ; reste la licence. Le remote débloque le **versioning/tags** attendu par
le modèle de synchro cop1 ↔ mega-city (cf. cop1 ADR-021 § Synchronisation).
