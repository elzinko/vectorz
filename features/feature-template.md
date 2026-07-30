---
id: 0000
title: <titre court et parlant>
type: feature # feature | bug | refactor | chore | epic
priority: P2 # P0 | P1 | P2 | P3
product: # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic) ; une épic n'en référence jamais une autre
status: todo # idea | todo | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posée par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr: # ex. "#123" quand une PR existe
created: <YYYY-MM-DD>
---

# <id> — <titre>

## Contexte / Problème

<Ce qui ne va pas ou ce qu'on veut, et pourquoi ça compte. Pour un bug : symptôme
observé + reproduction. Lier le code en `chemin/fichier:ligne` si pertinent.>

## Proposition

<L'approche envisagée. Plusieurs options possibles → lister + recommander.
POC d'abord, polish ensuite.>

## Critères d'acceptation

- [ ] <comportement observable et vérifiable>
- [ ] <…>
- [ ] Gate locale verte (typecheck/lint/tests) puis E2E si UI.

## Notes / décisions

<Hypothèses, risques, liens (ADR, PR, issues). Mettre à jour à mesure.>
