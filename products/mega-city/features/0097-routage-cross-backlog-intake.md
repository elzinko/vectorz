---
id: 0097
title: Routage cross-backlog de l'intake — suivre le PLAN.md maître à travers les deux listes (produit + méthode)
type: feature
priority: P0
epic:
depends: []
labels: [enabler]
status: idea
ready:
pr:
created: 2026-07-26
---

# 0097 — Que « c'est quoi la suite ? » regarde les DEUX listes

## Contexte / Problème (en clair)

Le dépôt a **deux listes de tâches** : une pour le **produit** (racine, `features/` — cartes
`0062`, `0063`…) et une pour la **méthode** (mega-city, `products/mega-city/features/` — cartes
notées `mc-XXXX`).

Le **plan maître** `features/PLAN.md` est une seule séquence ordonnée qui **mélange les deux**.
Sa tête aujourd'hui = `mc-0094`, une carte de la liste **méthode**.

Mais l'étape « c'est quoi la suite ? » (`next --ready-only`, le point d'entrée du builder) ne
regarde **qu'une seule liste** : celle la plus proche de là où on se tient (règle « backlog le
plus proche du cwd », ADR-0017 A13). Lancé à la racine, elle lit la liste **produit**, ne voit
donc pas `mc-0094` (sur l'autre liste), et propose une carte plus basse.

**Livré juste avant (mc-0089, #52)** : `next` suit maintenant l'ordre du plan… mais seulement
**à l'intérieur d'une liste**. Le pas qui manque = **traverser les deux listes**.

## Valeur

Le builder lancé « nu » pointe enfin la **vraie** tête du plan (`mc-0094`), quelle que soit la
liste qui la porte. Fini le décalage silencieux entre « ce que dit mon plan » et « ce que fait
l'outil ».

## Proposition (simple)

1. **Savoir sur quelle liste est une carte** — règle de nommage déjà en place :
   `mc-XXXX` → liste méthode (`products/mega-city/features/XXXX-*.md`) ;
   nombre seul `XXXX` → liste produit (`features/XXXX-*.md`).
2. **Un petit outil déterministe** (dans la lignée de `plan:order`) qui, à partir du plan maître,
   rend la **tête réelle** : la 1re carte du plan encore active, **avec sa liste** et si elle est
   prête. Testé, pas « à l'œil ».
3. **L'intake du builder** appelle cet outil : il annonce la tête (et sa liste), puis va groomer/
   tirer sur la bonne liste — ou signale « tête bloquée » si elle n'est pas prête.

## Critères d'acceptation (comment on saura que c'est fait)

- [ ] À partir de `features/PLAN.md`, l'outil rend la **tête réelle** = 1re carte non-livrée du
      plan, **avec la liste** qui la porte (produit ou méthode) et son état `ready`.
- [ ] Lancé à la racine, le builder **annonce `mc-0094`** comme suite (ou « en tête, pas prête »),
      **pas** une carte inférieure d'une autre liste.
- [ ] Une carte `mc-XXXX` est résolue vers `products/mega-city/features/`, un nombre seul vers
      `features/` ; un id du plan introuvable dans les deux listes est **signalé**, pas ignoré en
      silence.
- [ ] Couvert par des tests (résolution id→liste + tête réelle). Aucune régression sur `plan:order`.

## Hors scope

- La priorisation/le contenu du plan (ça reste au PO, via `plan set`).
- Fusionner les deux listes en une seule (ce n'est pas le but — deux domaines distincts).

## Notes

- Suite directe de **mc-0089** (#52) qui a branché l'ordre du plan *intra-liste*. Ici on ajoute
  la **traversée des deux listes**.
- Réutilise le helper `plan:order` et le patron « logique pure testée + coquille I/O ».
