---
id: 0024
title: résorber la périphérie pré-pivot (ceremony-engine, quality-intelligence) + acter ADR-021/022
type: refactor
priority: P2
status: todo
pr:
created: 2026-07-06
---

# 0024 — résorber la périphérie pré-pivot

## Contexte / Problème
ADR-022 définit le cœur comme control plane aveugle au métier (« jamais de code
méthode-spécifique dans le cœur »). Or deux packages datent des sprints 0-5 pré-pivot
(audit 2026-07-06) : `ceremony-engine` (9 features de cérémonies scrum, zéro import depuis
app/web) et `quality-intelligence` (référencé seulement par le chemin legacy déprécié).
C'est de la méthode et de la qualité — territoire des ports (3) Method/Task et (4) Rules.
Par ailleurs ADR-021 (frontière mega-city) vit dans une branche non mergée
(docs/adr-021-megacity-boundary) et ADR-022 est un brouillon WIP : les fondations de
l'intégration mega-city (fiche mega-city 0016, double-gated) attendent ces merges.

## Proposition
1. Merger ADR-021 ; statuer ADR-022 (WIP → accepté, avec la décision EscalationPort
   « différé » — cf. mega-city ADR-0011 §4).
2. ceremony-engine : sortir du cœur — supprimer, ou geler derrière le Method port si une
   méthode future en a besoin ; décision à l'ADR.
3. quality-intelligence : idem derrière le Rules port/DoDCheck (le seam ADR-020 couvre déjà
   le besoin vivant).

## Critères d'acceptation
- [ ] ADR-021 mergé, ADR-022 statué
- [ ] plus aucun package du graphe de prod n'importe ceremony-engine ni quality-intelligence
- [ ] build/tests verts après résorption (~850 tests)
- [ ] la fiche mega-city 0016 (cap cop1) n'est plus bloquée côté cop1

## Notes / décisions
Le README et le brownfield-snapshot (avril) sont en retard sur le code (« 2 stubs
restants » périmé) — les rafraîchir dans la même passe.
