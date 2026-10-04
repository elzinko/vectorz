---
id: "20261004175528673"
title: Corriger les 20 dépendances vulnérables de vectorz (vitest 4 partout, cinq paquets indirects)
type: chore
priority: P1
product: mega-city
milestone:
version:
labels: [dependances]
status: idea
pr:
evidence: none # dépendances et lockfile, pas d'écran
created: 2026-10-04
---

# 20261004175528673 — Corriger les dépendances vulnérables de vectorz

**En clair.** GitHub signale 20 failles connues dans les dépendances de vectorz, dont une haute.
Elles viennent de sept paquets. La correction tient en deux gestes : passer vitest de la version 3
à la 4 dans les deux paquets qui y sont restés, et remonter cinq dépendances indirectes. La PR
automatique de Dependabot (#326) visait à côté et a été fermée.

**Si tu arrives frais.** *Dependabot* est le robot de GitHub qui repère les failles connues dans les
dépendances et propose des PR de mise à jour. *vitest* est le lanceur de tests du dépôt.

## Contexte / Problème

Constat du 2026-10-04, relevé au push sur `main` puis lu dans les alertes Dependabot ouvertes :

| Paquet | Alertes | Version corrigée | Où |
|---|---|---|---|
| undici | 1 haute, 2 moyennes, 3 basses | 7.29.1 | lockfile racine |
| ip-address | 4 moyennes | 10.7.1 | lockfiles racine et mega-city |
| vitest | 3 moyennes | 4.1.11 | `package.json` racine, `products/cop1/packages/web` |
| @vitest/mocker | 1 moyenne | 4.1.11 | lockfile racine |
| hono | 2 moyennes | 4.13.7 | lockfiles racine et mega-city |
| fast-uri | 2 moyennes | 3.1.8 | lockfiles racine et mega-city |
| brace-expansion | 2 moyennes | 2.1.7 et 5.0.12 | lockfile racine |

- `products/mega-city` est déjà en vitest `^4.1.11`. La racine et `products/cop1/packages/web` sont
  restés en `^3.2.6`.
- La PR Dependabot #326 montait `@vitest/mocker` en 5.0.3, incompatible avec vitest 3 : ses tests
  échouaient. La #220, même montée en 5.0.0, avait été fermée le 2026-10-01. Dependabot reproposera
  cette montée tant que vitest 3 restera en place.

## Proposition

1. Passer `vitest` à `^4.1.11` dans `package.json` (racine) et dans
   `products/cop1/packages/web/package.json`, comme mega-city. Corriger ce que la version 4 casse
   dans les tests de ces deux paquets.
2. Remonter les dépendances indirectes vulnérables aux versions corrigées de la table, par une mise
   à jour du lockfile, ou par un `pnpm.overrides` si une dépendance directe les épingle.
3. Ne pas monter `@vitest/mocker` à la main : il suit vitest.

## Critères d'acceptation

- [ ] La racine, `products/cop1/packages/web` et `products/mega-city` déclarent vitest `^4.1.11`.
- [ ] Les lockfiles ne contiennent plus aucune des versions vulnérables de la table.
- [ ] La gate locale est verte : `pnpm build`, `pnpm test` (racine), `pnpm --dir products/mega-city test`,
      `pnpm --dir products/mega-city test:scripts`, `pnpm lint`.

**Mesure de suivi** — après le push, la page Dependabot du dépôt ne montre plus ces 20 alertes.

## Comment vérifier

```bash
pnpm why undici ip-address hono fast-uri brace-expansion   # plus aucune version vulnérable
pnpm build && pnpm test && pnpm lint
pnpm --dir products/mega-city test && pnpm --dir products/mega-city test:scripts
gh api 'repos/elzinko/vectorz/dependabot/alerts?state=open' --jq length   # après le push
```

## Notes / décisions

- Priorité P1 fixée par le PO le 2026-10-04. Version non fixée.
- Voisine, sans doublon : [Vérifier les dépendances en local plutôt qu'avec Dependabot](20260816194833618_deps-sante-audit-local-par-profil.md),
  qui porte l'outillage d'audit, pas la correction d'aujourd'hui.
