---
id: 2012
product: mega-city
title: aligner les signatures de domain.ts sur l'implémentation (expand/bind)
type: chore
priority: P3
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Revue de la fiche 0001 (finding F5). `docs/domain.ts` se présente comme « source
de vérité / contrat » mais déclare `expand(profile)` et `bind(profile, …)` sans
le `catalog`/`rootDir` que prend l'implémentation réelle
(`expand(profile, catalog)`, `bind(profileId, projectDir, host, rootDir)`).
Le contrat ment sur les signatures concrètes.

## Proposition
Soit aligner les déclarations `expand`/`bind` de `domain.ts` sur l'implémentation
(dépendance catalogue explicite, pas d'I/O caché), soit clarifier en tête de
fichier que `domain.ts` ne porte que les **types** et non les signatures runtime.
Trancher et documenter (une ligne d'ADR ou un commentaire).

## Critères d'acceptation
- [ ] `domain.ts` ne contredit plus l'implémentation (signatures alignées OU rôle « types only » explicité)
- [ ] décision tracée (commentaire ou note ADR)

## Notes
`Cap.materialize`/`bind` `void → WritePlan` est déjà tracé dans l'ADR-0003 ; ici
c'est l'argument catalogue/rootDir qui manque au contrat.
