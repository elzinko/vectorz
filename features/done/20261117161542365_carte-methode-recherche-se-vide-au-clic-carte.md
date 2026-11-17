---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117161542365"
title: La recherche de la carte de la méthode se vide quand on choisit une brique sur la carte
type: fix
priority: P3
product: cop1
milestone: board
version:
labels: [carte, theme:mission-control]
status: shipped
pr: "local (2820c310)"
evidence: none # le champ se vide : prouvé par un test d'écran, aucune mise en page changée
created: 2026-11-17
---

# 20261117161542365 — La recherche de la carte de la méthode se vide quand on choisit une brique sur la carte

**En clair.** On tape un nom dans la recherche, puis on clique une brique directement sur la carte. La
brique est choisie, mais les propositions de la recherche restent affichées et ne correspondent plus à
rien. On vide le champ dès que la brique choisie change, quel que soit le geste.

**Si tu arrives frais.** La carte de la méthode (`GraphMap.tsx`) a un champ « chercher une brique » en
tête du panneau de droite. Choisir une proposition vide déjà le champ. Un clic sur une brique de la
carte choisit aussi une brique.

## Contexte / Problème

Réserve P3 de la revue adverse de la fiche
[On cherche une brique par son nom sur la carte de la méthode](20261117153250174_carte-methode-chercher-une-brique.md).

## Proposition

Le champ de recherche se vide à chaque changement de la brique choisie.

## Critères d'acceptation

- [x] Après une saisie, un clic sur une brique de la carte vide le champ et retire les propositions.
- [x] Un clic dans le vide, qui retire la sélection, vide aussi le champ.

## Comment vérifier

```bash
cd products/cop1/packages/web && pnpm exec vitest run src/board/GraphMap.test.tsx
```

## Notes / décisions

- Créée et tirée au sprint 15 du 17 novembre, par délégation du PO absent.

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 2 critères prouvés par des tests
d'écran. Sa réserve P3 est gardée telle quelle. Le vidage dans le choix de la recherche reste utile
quand on rechoisit la brique déjà choisie, et la revue le confirme.
