---
id: 0141
title: agent ezk-pm — le décideur product-owner (jour ET nuit)
type: feature
priority: P1
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-07-06
---

## Contexte / Problème
Les checkpoints d'ezk-product-builder/ezk-sprint interrompent l'humain sur ~12 types
d'arrêts par cycle alors que 8 arrêts sur 12 sont auto-recommandables ou délégables
(analyse 2026-07-06).
Côté cop1, le Supervisor tier 2 fait déjà ce travail la nuit, mais son cerveau est un prompt
interne non gouverné par le catalogue. ADR-0011 : le décideur doit être UN agent du
catalogue, consommé par les deux runtimes.

## Proposition
Créer `agents/ezk-pm.md` :
- frontmatter : `name`, `description` routable (« décisions produit, arbitrages de
  checkpoint, priorisation backlog, déblocage »), `model: opus`, `effort: high`, `color` ;
- rôle : product-owner qui tranche les checkpoints classés (a) auto-recommandables et (b)
  délégables, en s'appuyant sur la fiche backlog, les critères d'acceptation et LA LOI ;
  **journalise chaque décision** (SPRINT.md section « Notes / décisions ») ;
- garde-fous : REFUSE et escalade à l'humain les 4 décisions humaines (ADR-0011 §3) :
  irréversible/sortant + secrets, augmentation de budget, idée produit sur backlog vide,
  exigences contradictoires ;
- `competences: [ezk-backlog]`, composition de product-brainstorming pour le cadrage.

## Critères d'acceptation
- [ ] `agents/ezk-pm.md` routable (name + description), model/effort dans le frontmatter
- [ ] sur un checkpoint réel d'ezk-product-builder, ezk-pm prend la 1re option de la table et la journalise
- [ ] sur chacun des 4 cas humains, ezk-pm refuse explicitement et rend la main
- [ ] ajouté à `profiles/global.yml` (et au futur `cop1-target.yml`, fiche 0146)

## Notes
ADR-0011 §2. Consommé par : fiche 0145 (mode auto du builder) et fiche cop1 0021 (déblocage
nocturne). Nom `ezk-pm` choisi par l'opérateur (2026-07-06).
