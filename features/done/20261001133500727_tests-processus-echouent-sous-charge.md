---
id: "20261001133500727"
title: Des tests à processus échouent sous la charge, puis passent relancés seuls
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [dette]
status: shipped
pr: "#317"
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
- Grooming 2026-10-01 (run ezk-product-build, mode auto/lean). DoR concourue par **ezk-pm** :
  CONCOURS — problème clair, valeur claire, critères mesurables (3 passages verts d'affilée,
  durée +20 % max), commande de vérif rejouable. → tamponnée `ready`.
  - **Approche tranchée : (1)+(2)** — isoler les 3 fichiers à processus dans un projet vitest
    lancé en série, avec un délai calé sur leur durée réelle sous charge. La piste (3) (baisser
    le parallélisme global) reste en repli si (1)+(2) ne stabilise pas.
  - **Garde-fou de périmètre** : ne toucher QUE la config d'exécution des 3 fichiers nommés
    (isolation + timeout), jamais leur logique ni les délais des autres tests. Un test vraiment
    bloqué doit toujours échouer **vite**, avec un message clair — pas de rallonge à l'aveugle.
- **Build 2026-10-01 (même run).** Mesure faite au build : l'approche (1) — isoler les 3 fichiers
  dans un projet vitest série — stabilise bien, MAIS le découpage en projets TAXE le reste de la
  suite de ~30 % (projet `unit` seul = 42 s contre 32,8 s en pool unique) → viole le critère
  « durée +20 % max ». **(1) écartée.** Livré : **(2) seul**, le délai ciblé. Cause confirmée =
  le délai vitest par défaut de 5 s (message « Test timed out in 5000ms »), pas un enfant tué.
  Fix : `vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 })` en tête des 3 fichiers, la
  config vitest restant inchangée. Vérifié : suite complète verte 3× (32,77 / 32,79 / 32,95 s,
  soit +0 % vs baseline flaky ~32,8 s), typecheck, test:scripts (33 suites), check-links. Revue
  adverse `ezk-reviewer` = GO.
  - **Nuance critère 2, assumée** : pour ces 3 fichiers, un test réellement bloqué échoue
    désormais en ≤ 60 s au lieu de 5 s — borné, avec un message clair, et le reste de la suite
    garde 5 s. Le 5 s initial était incident, pas un garde-fou de perf voulu ; ces tests
    vérifient un comportement, pas une latence.
