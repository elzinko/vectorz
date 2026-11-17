---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117152357523"
title: La vue d'ensemble de la carte de la méthode a un test de rendu avec sélection
type: chore
priority: P3
product: cop1
milestone: board
version:
labels: [carte, tests]
status: shipped
pr: "local (971c44f6)"
evidence: none # test seulement
created: 2026-11-17
---

# 20261117152357523 — La vue d'ensemble de la carte de la méthode a un test de rendu avec sélection

**En clair.** Quand une brique est choisie, la vue d'ensemble de la carte de la méthode affiche, dans
chaque famille, son nombre de voisins, estompe les familles sans voisin et nomme la brique choisie. Ce
calcul est testé, mais pas son affichage. Deux revues l'ont relevé. On ajoute un test de rendu.

**Si tu arrives frais.** La carte de la méthode (`GraphMap.tsx`) a trois niveaux de zoom ; le niveau 1
montre les familles. Les tests tournent dans jsdom, qui ne mesure aucun zoom : le niveau de départ se
règle par une option réservée aux tests (`initialLevel`).

## Contexte / Problème

Relevé par les revues adverses des sprints 3 et 6 du 17 novembre (fiches 20261117122122557 et
20261117140305053), non bloquant : seule la projection pure couvrait le niveau 1 avec sélection.

## Proposition

Une option de test `initialSelection`, sœur d'`initialLevel`, et un test de rendu au niveau 1 avec une
brique choisie.

## Critères d'acceptation

- [x] Au niveau 1, avec une brique choisie, le rendu montre « brique choisie : <nom> » dans sa famille.
- [x] Au même niveau, une famille avec des voisins affiche leur nombre, et une famille sans voisin porte
      la classe d'estompage.

## Comment vérifier

```bash
cd products/cop1/packages/web && pnpm exec vitest run src/board/GraphMap.test.tsx
```

## Notes / décisions

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 2 critères prouvés ; le test vérifie le texte exact « 1 voisin · applique », nombre compris. `initialSelection` n'a aucun effet en production : le seul appelant ne le passe pas.


- Tirée au sprint 10 du 17 novembre, par délégation du PO absent.
