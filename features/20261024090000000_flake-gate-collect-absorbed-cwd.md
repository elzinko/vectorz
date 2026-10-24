---
id: "20261024090000000"
title: "La gate ne flake plus : délai élargi pour le test git collect-absorbed (+ cwd injecté)"
type: bug
priority: P2
product: mega-city
milestone: qualite
version:
labels: [qualite, gate, test-infra, flake]
depends:
status: ready
pr:
evidence: none # correctif de test-infra, pas d'écran ; preuve = suite complète verte en série
created: 2026-10-24
---

# 20261024090000000 — La gate ne flake plus (test git `collect-absorbed`)

## En clair

La gate rougissait **par intermittence** sur un seul test, sans que le code sous test soit en cause.
Ce test lance de **vrais `git`** (init, commits, `merge-tree`). En suite parallèle (plusieurs workers
vitest), ces sous-processus **ralentissent sous la charge** et dépassent le **délai par défaut de 5 s** :
le test rougit en « timeout ». Lancé seul, il passe (git est rapide). On lui donne un **délai plus long**,
exactement comme l'autre test lourd en git du dépôt. Au passage, on le rend **hermétique** : il injecte
son dépôt par un paramètre `cwd` au lieu de `process.chdir` (global au process).

## Si tu arrives frais

`collectAbsorbedBranches(branches, base)` dit quelles branches sont déjà absorbées par `main`. Le test
monte un dépôt git jetable et l'appelle. « Flake » = un test qui passe ou échoue sans que rien n'ait
changé — ici, selon la charge parallèle au moment où il tourne.

## Contexte / Problème

- **Symptôme vécu (2026-10-23/24).** Au fil du build de la milestone `preparation`, la suite complète
  `vitest run` a rougi **à presque chaque fiche** sur `src/io/__tests__/collect-absorbed-branches.test.ts`,
  avec des durées de test de **5,8 s et 7,7 s** — au-delà du délai vitest par défaut (5 s). En isolation :
  « 3 passed » en < 2 s. Classique timeout sous charge, pas une régression.
- **Cause.** Le test fait de vrais `git` par sous-processus ; `git merge-tree --write-tree` sur plusieurs
  workers en parallèle devient lent. Le fichier n'élargissait pas le délai (contrairement à
  `backlog-version-bin.test.ts`, qui documente déjà ce cas et met 60 s).
- **Fragilité secondaire.** Le test pointait son dépôt par `process.chdir`, global au process : une
  lecture d'ambiance évitable (ADR-0003).

## Proposition

- **Élargir le délai** du fichier : `vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 })` — même
  parade, même justification que `backlog-version-bin.test.ts`.
- **Injecter le `cwd`** : `collectAbsorbedBranches(branches, base, cwd = process.cwd())` (défaut
  rétro-compatible, l'unique appelant `collectProcessIo` inchangé) ; le test passe `cwd` au lieu de
  `process.chdir`, et sa plomberie `beforeEach/afterEach` de restauration disparaît.

Pas de nouveau mécanisme : un délai de test + une entrée injectée au lieu d'une ambiance lue.

## Critères d'acceptation

- [ ] Le fichier `collect-absorbed-branches.test.ts` porte un délai élargi (≥ 30 s).
- [ ] `collectAbsorbedBranches` accepte un `cwd` et ne lit plus le cwd ambiant pour git ; le test
      n'appelle plus `process.chdir`.
- [ ] La **suite complète** (`vitest run`) passe **plusieurs fois de suite** sans échec intermittent
      sur ce fichier.
- [ ] Aucun changement de comportement pour l'appelant `collectProcessIo` (cwd par défaut).

## Comment vérifier

```bash
cd products/mega-city
rg -n "process\.chdir\(" src/io/__tests__/collect-absorbed-branches.test.ts   # attendu : vide
npx vitest run && npx vitest run && npx vitest run                            # 3 fois : toujours vert
```

## Notes / décisions

- **Origine** : rétro du run autonome de la milestone `preparation` (capture
  `docs/captures/2026-10-24-retro-run-preparation-light.md`). Symptôme récurrent (≈ 6 fiches d'affilée),
  pas un cas isolé : il érodait la confiance dans une gate verte.
- La doctrine best-effort (git absent → liste vide) est **inchangée**.
