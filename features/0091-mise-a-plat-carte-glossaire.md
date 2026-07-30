---
id: 0091
title: Mise à plat du backlog — carte lisible + glossaire du jargon (dogfood du format)
type: chore
priority: P0
product: mega-city
epic:
depends: [0079]
labels: []
status: idea
ready:
pr:
created: 2026-07-25
---

# 0091 — La carte + le glossaire (une fois le backlog stabilisé)

## Contexte / Problème

72+ fiches actives, du jargon accumulé (« verrou », « borne anti-veto », « panel »…) : le PO ne
tient plus l'ensemble en tête. Il faut une **carte lisible** de l'état (PR + backlog + roadmap)
et un **glossaire** qui traduit chaque terme interne en mots simples — et tranche : garder,
traduire, ou supprimer.

## Valeur

Une vue d'ensemble qu'on relit en 2 minutes, et un vocabulaire assaini. C'est aussi la
**première application réelle** du format lisible (fiche `0079`) et de la sous-commande `digest`
— le dogfood qui prouve les deux.

## Proposition

Dans un **worktree dédié**, produire une **carte en clair** (coup d'œil ≤3 phrases, PR ouvertes
+ ce qu'elles attendent, chantiers/`ready`, le reste compté) et un **glossaire** (chaque terme
interne → sens simple + verdict).

## Critères d'acceptation

- [ ] Carte + glossaire commités ; les deux passent la règle de lisibilité (`0079`).
- [ ] Le glossaire couvre les termes du commentaire PR #37 et des captures récentes.

## Notes

- **Ordre** : P0 par importance, mais à faire **en dernier** — d'où `depends: [0079]` (et après
  l'intake + `digest`). Cas d'école du besoin d'ordre distinct de la priorité (cf. `0089`).
