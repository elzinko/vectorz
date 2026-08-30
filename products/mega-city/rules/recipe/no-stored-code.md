---
id: recipe/no-stored-code
kind: disposition
level: MUST
title: Aucun code recopié dans une recette
enforcements:
  - type: agent-check
    agent: ezk-chef
---

Une recette ne stocke pas de code qui **duplique** la source (doctrine entonnoir,
[ADR-0013](../../docs/adr/0013-ezk-recipy-entonnoir-de-sourcing-jamais-fabrique.md)) : elle
**pointe** (`fichier:ligne`), elle ne recopie pas d'implémentation. Un court extrait
**illustratif** (≤ quelques lignes, ex. un exemple d'appel) reste toléré si la source
complète reste pointée à côté ; un fichier entier ou une logique substantielle recopiée
ne l'est pas.

**Non-bloquant, jugement `ezk-chef` uniquement** (arbitrage PO, fiche
[`20260824185422122`](../../../../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md)
§« Frontière anti-doublon » / plan étape 6) : cette rule n'a **aucun script CI** qui la fait
rougir — `regen-recipes.sh` et `check-links.sh` ne l'inspectent pas. Elle est **relevée** par
`ezk-chef` quand il lit une recette, pas **bloquée** mécaniquement. Des recettes existantes
normalisées avant cette gate (ex. `recipes/vercel-kv-database.md`) portent du code inline
hérité : signalé en `## Statut de cette recette`, pas réécrit d'office.
