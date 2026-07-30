---
id: 0128
title: ezk-product-builder — couche product-owner autonome (idée → backlog → ezk-sprint → ship)
type: feature
priority: P2
product: mega-city
status: shipped
pr: local (squash-merge)
created: 2026-06-28
---

## Contexte / Problème
Le déroulé produit complet — idéer → cadrer une fiche → construire → shipper, **en boucle** —
est aujourd'hui piloté **à la main** (cette session l'a fait pour bind/capture/ezk-ezk). On veut
le **productiser** en un skill autonome. `ezk-sprint` fait déjà le build d'**une** feature
(équipe scrum, BDD/TDD/CI/PR/squash) ; il manque la **couche product-owner au-dessus** : décider
quoi construire (idéation) et enchaîner les sprints.

## Proposition
`ezk-product-builder` = couche product-owner **mince** qui **compose** (sans recloner) :
`ezk-backlog` (le quoi) + `/product-brainstorming` (idéer si flou — réutilise 0022) + `ezk-sprint`
(le build). Boucle hybride : lit le backlog → fiche claire ? **build via ezk-sprint** : sinon
**idée** pour cadrer → build → checkpoint inter-sprint → boucle. Autonomie max ; s'arrête à
3 (+1) moments en **suggestions-à-choix + problématique**.

## Critères d'acceptation
- [ ] **compose** ezk-sprint + ezk-backlog + /product-brainstorming (ne réimplémente rien)
- [ ] boucle **hybride** : construit les fiches claires ; **idée** (brainstorm) si backlog vide / fiche vague
- [ ] checkpoints en **suggestions-à-choix** : inter-sprint, blocage, dérive tokens (+ idéation)
- [ ] **mode tokens configurable** : `lean` (défaut) | `plafond-dur` | `pleine-puissance`
- [ ] **autonome** entre les checkpoints ; peut consulter un sous-agent pour avis mais **décide seul**
- [ ] hérite la discipline ezk-sprint : POC d'abord/polish ensuite, tests locaux avant CI (act), 1 PR/feature, squash + conventional

## Notes
- Décision : **ADR-0008**. Vit dans `mega-city/skills/` (ADR-0006). Famille : **au-dessus** d'ezk-sprint.
- Utilise **0022** (`add --brainstorm`) pour l'étape idéation.
- Méta : **cette session = un ezk-product-builder joué à la main**.
