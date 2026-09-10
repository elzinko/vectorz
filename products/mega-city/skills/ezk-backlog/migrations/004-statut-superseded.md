# Migration 004 — statut terminal `superseded` (layout v3 → v4)

**Cible :** `layout_version: 4`
**Type :** ADDITIVE — aucune fiche existante à migrer.
**Décision :** session de grooming du 2026-09-10 (clôture de 4 fiches pré-pivot alors qu'aucun
statut « annulé » n'existait).

## En clair

On ajoute un statut de clôture : `superseded`. Il sert à **sortir une fiche du backlog quand
elle est devenue caduque** — obsolète après un pivot, ou déjà couverte par du travail livré
ailleurs — **sans la faire passer pour livrée**. Avant, la chaîne s'arrêtait à
`idea → ready → shipped` : aucune case pour « on ne fera pas / plus ». Marquer ces fiches
`shipped` aurait gonflé la vélocité à tort.

## Ce que ça change

- `superseded` rejoint l'enum `STATUTS` (source unique, `products/mega-city/src/core/avancement-data.ts`).
  Le validateur l'accepte ; `regen` l'affiche `🗑️ superseded`.
- Une fiche `superseded` part dans `features/done/` — elle sort du stock actif comme une livrée —
  mais **ne compte pas** dans les métriques de sprint : `sprint-metrics` ne compte que `shipped`
  (garde-fou dans `sprint-metrics/adapters/repoSource.ts`).
- C'est le premier d'une **famille de statuts terminaux non-`shipped`**. Les regroupements
  `merged` / `split` (commande `aggregate`) la compléteront côté fiche `20260823121712652`.

## Migration

**Rien à migrer** : aucune fiche existante n'est `superseded`. La seule action mécanique est de
bumper `features/README.md` → `layout_version: 4`.

Les clôtures elles-mêmes se font **à la main**, fiche par fiche (déplacer dans `features/done/`,
poser `status: superseded`, ajouter une section « Clôture » qui dit *pourquoi*) — jamais par un
script de masse. C'est un jugement, pas une transformation de format.

Filet : les fiches sont versionnées. `git diff` montre chaque changement, `git checkout` annule.
