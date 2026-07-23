---
id: 0057
title: Agent d'analyse de la méthode — lit les KPI et propose des améliorations (gate PO) [nord/parking]
type: feature
priority: P3
epic: 0051
status: idea
ready:
pr:
created: 2026-07-22
---

# 0057 — Agent d'analyse de la méthode (nord / parking gated)

## Contexte / Problème

Demande PO : « analyser ces KPI par un agent spécialisé qui permet d'analyser la méthode et de
l'améliorer peut-être ». C'est l'**étoile polaire** de l'épic — et **exactement** la boucle du
**contrat d'améliorabilité** (ADR-030) : mesure **tierce**, propositions **jamais
auto-appliquées** (deny-all v0.1), **gate PO**. À **ne pas construire d'avance** (YAGNI, doctrine
[0046](0046-differes-contrat-ameliorabilite-parking.md)) : sans historique de KPI réels, l'agent
n'a rien à analyser.

## Proposition

Un **agent spécialisé** qui lit les **vues KPI** (0055) + le silo dans le temps et produit des
**propositions** `type: amelioration` (seuils, règles, outils à ajouter/retirer), **routées** au
PO via **ezk-retro** + le contrat d'améliorabilité — **jamais** auto-appliquées. Le **verdict**
(l'amélioration a-t-elle payé ?) est rendu par le **mesureur tiers** ([0044](0044-mesureur-outcomes-script-append-mvp-a.md)),
pas par l'agent.

## Critères d'acceptation

- [ ] *(à groomer)* L'agent produit **≥1 proposition traçable adossée à un KPI**
- [ ] **Aucune auto-application** (deny-all ; gate PO)
- [ ] Le **verdict** est rendu par le **mesureur tiers**, jamais par l'agent (pas d'auto-évaluation)

## Notes / décisions

- **Gate d'ouverture** : ≥N cycles de KPI réels historisés + décision PO (parking, comme 0046).
- Compose **ADR-030** (contrat d'améliorabilité) + **ezk-retro** (route les règles/config validées
  sous gate PO). Ne réimplémente ni l'un ni l'autre.
- Rejoint les items parking de [0046](0046-differes-contrat-ameliorabilite-parking.md).
