---
id: "20261001133500727"
title: Des tests à processus échouent sous la charge, puis passent relancés seuls
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [dette]
status: idea
pr:
evidence: none # pas d'écran
created: 2026-10-01
---

# 20261001133500727 — Des tests à processus échouent sous la charge, puis passent relancés seuls

**En clair.** La suite de tests de mega-city rougit presque à chaque passage complet. Les fautifs
sont toujours les mêmes tests, ceux qui lancent de vrais processus. Relancés seuls, ils passent. On
veut une suite complète verte du premier coup, pour qu'un échec signale enfin un vrai problème.

**Si tu arrives frais.** Un « test à processus » lance un vrai programme (git, tsx, un script) au
lieu d'appeler une fonction. Il est lent, et il ralentit encore quand d'autres tests tournent en
même temps.

## Contexte / Problème

Constaté le 2026-10-01 pendant le train de merge de V0.4. Sur une dizaine de passages complets de
la suite, presque tous ont eu de 1 à 9 échecs. Ce sont toujours les mêmes fichiers :

- `src/__tests__/aggregate-apply-bin.test.ts`
- `src/__tests__/backlog-version-bin.test.ts`
- `src/__tests__/verdicts-merge.test.ts`

Chaque échec arrive après 7 à 19 s, quand la machine est chargée. Relancés seuls, les trois
fichiers passent : 25 tests verts. La cause exacte reste à confirmer : délai du test dépassé, ou
processus enfant arrêté par sa propre limite.

L'effet : on relance à la main à chaque fois. Pire, un vrai échec peut se cacher parmi les faux.

## Proposition

POC : empêcher les tests à processus de se disputer la machine. Pistes, à trancher au grooming :

- les regrouper dans un projet vitest à part, lancé en série ;
- leur donner un délai adapté à leur durée réelle sous charge ;
- réduire le parallélisme de la suite.

Ne pas monter tous les délais à l'aveugle : un test bloqué doit encore échouer vite.

## Critères d'acceptation

- [ ] La suite complète de mega-city passe 3 fois de suite sur la machine de dev, sans relance.
- [ ] Un test à processus vraiment cassé échoue toujours, avec un message clair.
- [ ] La durée totale de la suite n'augmente pas de plus de 20 %.

## Comment vérifier

Lancer la suite trois fois de suite. Les trois passages doivent être verts.

```bash
pnpm --dir products/mega-city test
```

## Notes / décisions

- Défaut repéré pendant le run V0.1 → V0.4, PR #275 à #314.
