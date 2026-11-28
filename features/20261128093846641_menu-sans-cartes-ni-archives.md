---
id: "20261128093846641"
title: "Le menu de mission control n'a plus que les entrées de la maquette : ni Cartes, ni Archives"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control, menu]
status: ready
blocked:
depends: ["20261128093846629"]
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128093846641 — Le menu de mission control n'a plus que les entrées de la maquette : ni Cartes, ni Archives

**En clair.** Le menu garde trois entrées que la maquette a retirées : « Cartes », le bloc « Archives » avec
son lien « v1 / archives », et « Carte de la méthode ». On retire les deux premières. La carte de la méthode
reste accessible depuis l'Annuaire.

**Si tu arrives frais.** Mission control est l'écran de cop1. La maquette est la référence d'écran du PO.
Son menu compte deux groupes : Global (Projets, Annuaire de la méthode) et Projet (onze pages, de Vue
d'ensemble à Recettes).

## Contexte / Problème

Le 28 novembre, le PO compare l'app à la maquette et relève l'écart : « dans la maquette il n'y avait plus
l'onglet cartes, ni le bloc archives ».

- **Cartes** était restée « faute d'une autre page pour les documents de la méthode ». Cette raison ne tient
  plus : le lien « Documentation » est en pied de chaque page, comme dans la maquette.
- **Archives** n'a jamais été tranché : deux fiches l'ont laissé « hors périmètre ».
- **Carte de la méthode** vient d'un chantier demandé par le PO après la maquette (17 novembre). On ne la
  détruit pas : on la range.

## Proposition

1. Le groupe **Global** contient Projets et Annuaire de la méthode, rien d'autre.
2. Le groupe **Projet** s'arrête à Recettes : l'entrée « Cartes » disparaît.
3. Le bloc **Archives** et son lien « v1 / archives » disparaissent.
4. La **carte de la méthode** s'ouvre depuis la page Annuaire. Son fil d'Ariane ramène à l'Annuaire.
5. Le code qui n'est plus atteignable est supprimé avec ses tests : la vue Cartes, et les pages archivées
   de la v1 si plus rien n'y mène. Le carnet de tests de mission control suit.

## Critères d'acceptation

- [x] Le menu affiche exactement : Global (Projets, Annuaire de la méthode), puis Projet (Vue d'ensemble,
  Objectifs, Fiches, Sprints, Sessions, Rétros, Versions, Process, Loi, Configuration, Recettes).
- [x] Aucune entrée « Cartes », « Archives » ni « v1 / archives ».
- [x] La carte de la méthode s'ouvre depuis l'Annuaire et reste entièrement utilisable.
- [x] Le lien « Documentation » du pied de page est toujours là.
- [x] Aucun code mort : la vue Cartes et ce qui ne servait qu'à elle sont supprimés, tests compris.
- [x] Capture avant / après jointe.

## Comment vérifier

- vue Menu : http://localhost:5274 → le menu de gauche
- `pnpm --dir products/cop1/packages/web exec vitest run`
- Preuve avant / après (menu) : [avant](../docs/pr-evidence/20261128093846641/menu-before.jpg) → [après](../docs/pr-evidence/20261128093846641/menu-after.jpg)

## Notes / décisions

- 2026-11-28 — Décision du pilote, à confirmer par le PO : la carte de la méthode est rangée dans
  l'Annuaire plutôt que supprimée. Elle figure dans la liste « ce que l'app fait de plus que la maquette ».
- 2026-11-28 — Les pages Cartes et v1 restent dans l'historique git : un `git revert` du commit les rend.
- 2026-11-28 — Revue adverse (ezk-reviewer) : GO. La vue Cartes, la route `/api/maps`, son service et les pages `public/v1` sont supprimés. La documentation qui citait « Cartes » est rafraîchie.
