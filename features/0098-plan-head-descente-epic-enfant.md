---
id: 0098
title: plan:head — descendre vers l'enfant prêt d'un épic placé dans le plan
type: feature
priority: P2
product: mega-city
epic:
depends: []
labels: [enabler, follow-up]
status: idea
ready:
pr:
created: 2026-07-26
---

# 0098 — Épic dans le plan → sa sous-carte prête (pas un saut)

## Contexte / Problème

`plan:head` (0097, #53) calcule la tête du plan à travers les deux listes. Un épic
(`type: epic`) est **exclu** de l'éligibilité (un épic n'est jamais tirable — ADR-0017).
Mais le contrat `next --ready-only` va plus loin : un épic doit faire **descendre vers son
prochain enfant `ready`** (champ `epic:`), pas être sauté.

Aujourd'hui `plan:head` **saute** un épic placé dans le plan. Écart signalé en revue (Codex
#53, P1). **Ne mord pas le plan actuel** : les épics n'y figurent qu'en section « plus tard »
(déjà exclus, sans marqueur). D'où le report en follow-up assumé.

## Valeur

Fidélité complète au contrat épic/enfants : si un jour le plan met un épic comme étape,
`plan:head` pointe une de ses sous-cartes prêtes au lieu de filer vers une feature sans rapport.

## Proposition

- `collect()` retient aussi la relation `epic:` de chaque carte.
- `crossBacklogHead` : en rencontrant un épic dans l'ordre du plan, chercher ses enfants
  (`epic: <id de l'épic>`) tirables (`todo` + `ready`) et retenir le premier comme candidat
  tête ; sinon poursuivre (comme le fait déjà `next --ready-only`).

## Critères d'acceptation

- [ ] Un épic `todo`+`ready` dans le plan n'est pas élu ; à sa place, son 1er enfant `ready`
      (deux backlogs confondus) est proposé comme tête.
- [ ] Aucun enfant prêt → l'épic est sauté (comportement actuel), sans régression.
- [ ] Couvert par des tests (épic avec/ sans enfant prêt).

## Notes

- Follow-up direct de 0097 (#53). Réutilise `plan:head`, ne le réécrit pas.
