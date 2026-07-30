---
id: 0113
title: chief-judge — juge de cohérence (avis, non bloquant)
type: feature
priority: P3
product: mega-city
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Donner un avis « ce bundle/profil est-il cohérent ? doublons ? contradictions ? » — bord LLM, jamais bloquant.

## Proposition
Agent `chief-judge` invoqué à la demande sur un bundle/profil ; rend un verdict consultatif.

## Critères d'acceptation
- [ ] avis structuré (ok/notes), ne modifie rien
- [ ] reste aux BORDS (hors cœur déterministe)
