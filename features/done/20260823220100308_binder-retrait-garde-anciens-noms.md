---
id: "20260823220100308"
title: Le binder retire proprement un ancien nom (retrait gardé) — le débloqueur des renames
type: feature
priority: P1
product: mega-city
version:
epic:
status: shipped
ready: 2026-08-23
pr: "#162"
created: 2026-08-23
---

## En clair

Après un renommage du catalogue, le re-bind laissait l'ANCIEN nom installé à côté du
nouveau (résidu réel constaté le 2026-08-20). Livré : un registre `renames.yml` que
`applyGlobalPlan` consomme pour retirer l'ancien nom — retrait GARDÉ, jamais un
`rm -rf` aveugle. C'était LE prérequis de tout rename (verdict du panel adverse).

Extraite du volet binder de la fiche `20260813131737962` (lot 3.1 du plan
« trois étages », approuvé le 2026-08-23).

## Ce qui est livré

- `products/mega-city/renames.yml` — le registre des renommages exécutés.
- `applyGlobalPlan` (src/io/apply.ts) : retrait gardé par le même invariant
  d'appartenance que les gardes existantes — symlink = à nous ; dossier réel = retiré
  ssi ses entrées ⊆ celles du skill renommé au catalogue ; fichier agent réel = jamais
  retiré. Jamais de purge hors-registre (un skill omis d'un profil est préservé).
  Bilan `retires`/`residus` affiché par `lawgiver bind-global`.
- 6 tests (`apply-global-renames.test.ts`) : nettoyage, homonyme utilisateur préservé,
  agent réel préservé / symlink retiré, pas de purge hors-registre, refus sans preuve.

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/apply-global-renames.test.ts
pnpm lawgiver bind-global global --link   # affiche « 🧹 renommage nettoyé : … »
```
