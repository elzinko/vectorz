---
id: 0000
title: <titre court et parlant>
type: feature # feature | bug | refactor | chore
priority: P2 # P0 | P1 | P2 | P3
product: # obligatoire dans ce monorepo — vectorz | mega-city | …
milestone: # optionnel — jalon d'ordre : fondation | rationalisation | env-test | contrat | ux | articles | parked
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posée par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr: # ex. "#123" quand une PR existe
evidence: # before-after | auto | none — preuve d'écran avant/après en PR (règle development/pr-before-after-media) ; vide = auto
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

<Ce qui doit être VRAI pour accepter — le RÉSULTAT observable, **pas** la commande qui le prouve
(ça, c'est « Comment vérifier »). Une case cochée = **prouvé**, idéalement par un panel/reviewer
qui a rejoué « Comment vérifier » — jamais auto-déclaré.>

- [ ] <état observable et vérifiable>
- [ ] <…>

## Comment vérifier

<La PROCÉDURE qui prouve les critères ci-dessus — **pas une recopie** des critères. Des commandes
littérales rejouables depuis un clone frais, OU des preuves agent (screenshots / before-after)
pointant vers des scripts npm / BDD **existants**. C'est ce qu'un tiers (ou un panel adverse)
**rejoue pour cocher** les critères. Rendu **tel quel** en corps de PR (ADR-0029) — ne pas le
réécrire côté PR. Ne recopier ni le Gherkin ni les critères : orienter et lier.>

```bash
# ex. pnpm --dir <pkg> test -- <chemin pertinent>
```

## Notes / décisions

<Hypothèses, risques, liens (ADR, PR, issues). Mettre à jour à mesure.>
