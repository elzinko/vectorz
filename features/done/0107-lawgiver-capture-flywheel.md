---
id: 0107
title: lawgiver capture — flywheel
type: feature
priority: P1
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-06-26
---

## Contexte / Problème
Capitaliser en cours de projet sans casser la fiabilité (leçon lifefindsaway).

## Proposition
`capture <cible> <kind>` (kind = rule|skill|agent|interaction) :
bords LLM = `author()`/`judge()` ; cœur script = append liste + 1 ligne `journal/` + `git commit`.

## Critères d'acceptation
- [ ] le LLM ne RANGE jamais (append/commit = script seul)
- [ ] `capture --interaction` écrit `kind: interaction` (ADR-0002)
- [ ] `journal/learnings.md` append-only mis à jour + commit
