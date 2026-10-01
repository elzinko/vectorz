---
id: 0117
title: "Corriger les signatures de domain.ts qui ne collent plus au code"
type: chore
priority: P3
product: mega-city
version:
labels: [dette]
status: shipped
pr: "#295"
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0106 (finding F5). `docs/domain.ts` se présente comme « source
de vérité / contrat » mais déclare `expand(profile)` et `bind(profile, …)` sans
le `catalog`/`rootDir` que prend l'implémentation réelle
(`expand(profile, catalog)`, `bind(profileId, projectDir, host, rootDir)`).
Le contrat ment sur les signatures concrètes.

## Proposition
Soit aligner les déclarations `expand`/`bind` de `domain.ts` sur l'implémentation
(dépendance catalogue explicite, pas d'I/O caché), soit clarifier en tête de
fichier que `domain.ts` ne porte que les **types** et non les signatures runtime.
Trancher et documenter (une ligne d'ADR ou un commentaire).

## En clair
Le fichier `domain.ts` annonce deux fonctions avec trop peu d'arguments. Le code en demande
plus. On a choisi la première voie : **aligner les signatures**, sans toucher au code.

## Critères d'acceptation
- [x] `domain.ts` ne contredit plus l'implémentation (signatures alignées OU rôle « types only » explicité)
      — `expandProfile(profile, catalog)` et `bind(profileId, projectDir, host, rootDir)`, comme
      `src/core/expand.ts` et `src/core/bind.ts` ; `pnpm --dir products/mega-city typecheck` vert.
- [x] décision tracée (commentaire ou note ADR) — commentaires de signature dans `domain.ts` (fiche 0117).

## Comment vérifier
`grep -n "expandProfile\|function bind" -A4 products/mega-city/docs/domain.ts` montre les deux
signatures ; elles se lisent comme celles de `src/core/expand.ts:59` et `src/core/bind.ts:19`.

## Notes
`Cap.materialize`/`bind` `void → WritePlan` est déjà tracé dans l'ADR-0003 ; ici
c'est l'argument catalogue/rootDir qui manque au contrat.
