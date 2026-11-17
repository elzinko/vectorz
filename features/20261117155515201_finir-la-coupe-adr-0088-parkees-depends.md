---
id: "20261117155515201"
title: "Finir la coupe de version : parkées et différées par objectif, avertissements depends:, une seule borne"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [release, contrat]
status: idea
blocked:
pr:
evidence: none # un verbe et un contrat, aucun écran modifié
created: 2026-11-17
---

# 20261117155515201 — Finir la coupe de version : parkées et différées par objectif, avertissements depends:, une seule borne

**En clair.** Le verbe `ezk backlog version tag` est livré depuis le 17 novembre, mais il laisse trois
trous de l'ADR-0088 §2.2. Il ne dit pas combien de fiches d'un objectif sont parkées ou différées. Son
essai à blanc ne rejoue pas les avertissements de dépendance. Et `board show` ne borne pas la coupe
comme lui. On comble les trois : la page Versions de mission control dira la même chose que le verbe.

**Si tu arrives frais.** Une *coupe* pose l'étiquette de version sur ce qui a été livré depuis la
précédente. Le cœur du calcul vit dans `products/mega-city/src/core/coupe.ts` ; `board show --json`
publie la prochaine coupe dans `versions.prochaineCoupe`.

## Contexte / Problème

- Relevé par la revue adverse du verbe, le 17 novembre :
  - objectifs « complet » ou « partiel k/n » sans « p parkées, d différées » (ADR-0088 §2.2) ;
  - le dry-run ne rejoue pas les avertissements `depends:` (ADR-0081) ;
  - `board show` prend la dernière étiquette parmi toutes, le verbe parmi les atteignables depuis HEAD.
- Le compte des parkées attend que `park` garde l'objectif d'origine (ADR-0088 §6), porté par
  [« parked » n'est plus un pseudo-objectif](20261114131614612_parked-n-est-plus-un-pseudo-objectif.md).

## Proposition

1. `board show` et le verbe prennent la même borne : la dernière étiquette stricte atteignable.
2. Le dry-run rejoue les avertissements `depends:` sans bloquer.
3. Quand l'objectif d'origine des parkées est connu, chaque objectif dit « p parkées, d différées ».

## Critères d'acceptation

- [ ] Sur un dépôt avec une étiquette non atteignable depuis HEAD, `board show` et le dry-run donnent le même nombre.
- [ ] Le dry-run imprime les avertissements `depends:` des fiches coupées, et sort comme avant.
- [ ] Un objectif qui a des fiches parkées ou différées le dit dans la coupe.

## Comment vérifier

```bash
pnpm --dir products/mega-city test -- src/core/__tests__/coupe.test.ts src/__tests__/backlog-version-tag-bin.test.ts
```

## Notes / décisions

- Origine : [rétro de fin de run du 17 novembre](../docs/captures/2026-11-17-retro-fin-de-run-coupe-de-version.md), proposition P2.
- Priorité P2 tranchée par ezk-pm le 17 novembre, par délégation du PO.
- Dépend de [« parked » n'est plus un pseudo-objectif](20261114131614612_parked-n-est-plus-un-pseudo-objectif.md) pour le critère 3.
