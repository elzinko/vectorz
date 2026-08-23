---
id: "20260823220100443"
title: Split cérémonie/rôle — le skill devient ezk-product-build, le rôle PO reste l'agent ezk-pm
type: refactor
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

Le PO a relevé que « ezk-product-builder » n'est pas une cérémonie mais un rôle. Livré :
le SKILL est renommé **`ezk-product-build`** (l'ACTION — la boucle d'itération produit) ;
le RÔLE décideur reste l'agent existant **`ezk-pm`**, que le skill convoque (`roles:`).
Convention de nommage qui en découle : le skill nomme l'action, l'agent nomme l'acteur.

Lot 3.2 du plan « trois étages » — exécuté APRÈS le débloqueur binder
(fiche `20260823220100308`) : premier rename couvert par le filet `renames.yml`.

## Ce qui est livré

- `git mv skills/ezk-product-builder → skills/ezk-product-build` + 64 fichiers /
  147 occurrences balayés (surfaces ACTIVES ; l'historique daté — done/, captures,
  sessions, audits — reste figé sous l'ancien nom, c'est l'archive).
- `renames.yml` : entrée `ezk-product-builder → ezk-product-build` — le prochain
  `bind-global` retire l'ancien nom du poste, proprement.
- Graphe et carte recompilés : 187 liens · 0 cassé ; taxonomie et cérémonies valides.

## Décision de nommage (assumée, réversible)

Le PO demandait « peut-être un agent ezk-product-builder ? ». Jugé : NON pour l'instant —
réutiliser immédiatement l'ancien nom pour un objet DIFFÉRENT (un agent) rendrait fausse
chaque mention historique du skill (le piège de corruption documenté des renames).
L'ancien nom part en tombstone. Si le PO veut ensuite renommer l'agent `ezk-pm` en
`ezk-product-builder`, c'est désormais un rename SÛR (filet en place) — décision séparée.

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:check
pnpm --dir products/mega-city test
grep -r 'ezk-product-builder' products/mega-city/skills products/mega-city/profiles  # → rien
```
