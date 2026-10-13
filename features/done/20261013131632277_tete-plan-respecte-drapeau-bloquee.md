---
id: "20261013131632277"
title: "La tête du plan respecte le drapeau bloquée, comme le lot"
type: bug
priority: P2
product: mega-city
milestone:
version: v0.13.0
labels: [backlog]
status: shipped
blocked:
pr: "local (a1ace256)"
evidence: none # commandes, pas d'écran
split_from: "20261002133125418"
created: 2026-10-13
---

# 20261013131632277 — La tête du plan respecte le drapeau bloquée, comme le lot

**En clair.** La commande qui montre la prochaine fiche du plan (`plan:head`) peut afficher
« tirable » une fiche prête mais marquée bloquée. Le lot d'un sprint (`plan:lot`), lui, l'écarte
déjà. On aligne `plan:head` sur `plan:lot` : une fiche bloquée est sautée et signalée avec sa raison.

**Si tu arrives frais.** `plan:head` affiche la tête du plan (la prochaine fiche à construire).
`plan:lot` choisit les N prochaines fiches d'un sprint. Le drapeau `blocked:` marque une fiche prête
qui attend une dépendance. La boussole `ezk now` dit quoi faire maintenant.

## Contexte / Problème

Constaté le 2026-10-02 par l'agent de sprint de la V0.5 (PR #324). `plan:lot` n'accepte qu'une fiche
prête, active, hors épic et **sans** drapeau `blocked:`. `plan:head` ne regarde pas ce drapeau : une
fiche prête et bloquée y apparaît « ✓ TIRABLE ». Les deux commandes doivent appliquer la même règle,
sinon on tire une fiche qui attend autre chose.

Cause pointée : `crossBacklogHead` (`src/backlog/plan-head.ts`) teste `status` mais pas `blocked:`, et
`PlanCard` ne porte pas le champ ; `plan-lot` (`src/backlog/plan-lot.ts`) l'exclut déjà. La boussole
`ezk now` (`bin/ezk-now.ts`) contourne aujourd'hui en filtrant `blocked:` elle-même.

## Proposition

`plan:head` reprend la règle d'éligibilité de `plan:lot` : `crossBacklogHead` porte le champ `blocked:`
dans `PlanCard` et saute une fiche bloquée, en la signalant avec sa raison. Une fois la règle portée là,
la boussole `ezk now` **retire son filtre local** et s'appuie sur `crossBacklogHead`.

## Critères d'acceptation

- [ ] Une fiche prête marquée `blocked:` n'est jamais affichée « tirable » par `plan:head`.
- [ ] `plan:head` la signale, avec la raison du drapeau.
- [ ] `plan:head` et `plan:lot` donnent la même première fiche sur un même backlog.
- [ ] La boussole `ezk now` retire son filtre `blocked:` local, la règle étant portée par
      `crossBacklogHead` (test unitaire `crossBacklogHead` avec une fiche `ready`+`blocked`).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city plan:head   # ne liste pas une fiche ready+blocked en tête
pnpm --dir products/mega-city plan:lot 1
```

## Notes / décisions

- Découpée de la fiche `20261002133125418` le 2026-10-13 (côté **bug `plan:head`**, symptôme du
  2026-10-02). Les **raisons typées** du drapeau `blocked:` sont la fiche sœur
  [Raisons typées pour le drapeau bloquée](20261013131632484_raisons-typees-pour-blocked.md). Même
  version v0.13.0.
- Repéré pendant la construction du lot, PR #324. La fiche d'origine a aussi absorbé le doublon
  « Rétro v0.10 : plan-head ignore le drapeau blocked: » (20261011114725137) — même bug.
