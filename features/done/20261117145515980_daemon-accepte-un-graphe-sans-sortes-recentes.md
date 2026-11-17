---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117145515980"
title: Le daemon accepte un graphe qui n'a pas encore les sortes récentes
type: bug
priority: P3
product: cop1
milestone: board
version:
labels: [carte, contrat]
status: shipped
pr: "local (ca19fb36)"
evidence: none # pas de changement visible avec une méthode à jour
created: 2026-11-17
---

# 20261117145515980 — Le daemon accepte un graphe qui n'a pas encore les sortes récentes

**En clair.** Le graphe de la méthode a gagné deux sortes de briques le 17 novembre : les commandes et
les recettes. Le daemon de mission control exige maintenant leur compte dans chaque graphe. Un projet
hôte dont la méthode n'est pas encore à jour lui enverrait un graphe sans ces comptes, et la Carte de la
méthode resterait vide. Une sorte absente doit valoir zéro, pas un refus.

**Si tu arrives frais.** Le daemon est le serveur local de mission control ; il lance `ezk graph check
--json` et vérifie la réponse (`ezkGraphSource.ts`). `nodeCount` donne le nombre de briques par sorte.

## Contexte / Problème

Relevé par la revue adverse du sprint 6 du 17 novembre (fiche 20261117140305053), non bloquant : dans
vectorz, la méthode et mission control avancent ensemble, rien ne casse.

## Proposition

Dans `products/cop1/packages/app/src/features/board/ezkGraphSource.ts`, une sorte connue absente de
`nodeCount` vaut 0. Une sorte inconnue reste refusée.

## Critères d'acceptation

- [x] Un graphe sans `nodeCount.recipe` ni `nodeCount.command` est accepté, ces comptes valant 0.
- [x] Une sorte inconnue dans `nodes` reste refusée, avec un message clair.

## Comment vérifier

```bash
pnpm exec vitest run products/cop1/packages/app/src/features/board/ezkGraphSource.test.ts
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 2 critères prouvés. Toute sorte connue absente vaut 0 ; c'est sans risque, car la carte recompte ses familles depuis `nodes`.


- Origine : [rétro du sprint 6 du 17 novembre](../../docs/captures/2026-11-17-retro-sprint-6-recettes-dans-le-graphe.md),
  proposition 1, retenue par délégation du PO absent.
