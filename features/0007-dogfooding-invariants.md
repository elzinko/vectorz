---
id: 0007
title: dogfooding — 2 invariants d'évolutivité en règles iamthelaw
type: feature
priority: P2
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
ADR-0002 pose 2 invariants qui protègent l'évolutivité ; le projet devrait s'auto-gouverner.

## Proposition
Écrire 2 règles `iamthelaw` : (1) référencer par `id`, jamais en embarquant ; (2) discrimination `kind` centralisée en un seul resolver.

## Critères d'acceptation
- [ ] 2 règles rédigées + enforcement (agent-check `ezk-reviewer` ?)
- [ ] appliquées au repo lui-même
