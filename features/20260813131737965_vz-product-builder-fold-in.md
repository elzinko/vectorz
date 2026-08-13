---
id: "20260813131737965"
title: Trancher vz-product-builder — fold-in dans ezk-product-builder (cran d'autonomie) vs overlay séparé
type: feature
priority: P2
product: mega-city
version:
epic: "20260813131737959"
status: idea
ready:
pr:
created: 2026-08-13
---

# vz-product-builder — doublon perçu à trancher

## En clair

`vz-product-builder` charge `ezk-product-builder` en entier puis applique 3 réglages. Un humain
voit **deux fois le même orchestrateur** au catalogue. Or `ezk-product-builder` a **déjà** un mode
autonome (`--checkpoints auto`). Décision produit : replier `vz-` en **cran d'autonomie** de son
frère, ou garder un overlay séparé — mais pas les deux sans couture visible.

## Contexte / Problème (findings audit 2026-08-13 — lentilles archi + PM)

- 🔴 `products/mega-city/skills/vz-product-builder/SKILL.md:20-24` — charge `ezk-product-builder`
  intégralement + 3 overrides ; `vz-` est un préfixe orphelin (1 seul membre).
- 🟡 `ezk-product-builder/SKILL.md:125-161` — a **déjà** `--checkpoints auto` (délègue à `ezk-pm`)
  et `--tokens`. Les seuls vrais différentiels `vz` : checkpoints → convocation de **corpus**,
  supervision **obligatoire** (vs best-effort), échelle des reviewers.
- 🟡 `vz-product-builder/SKILL.md:33-51` — le cran « corpus » **réimplémente inline** le panel de
  challenge = la primitive [0161](0161-ezk-challenge-panel.md) (`ezk-challenge`), non encore extraite.
- 🟡 `vz-product-builder/SKILL.md:8-12` — restitution **« En clair » manquante** (émet pourtant des
  décisions de checkpoint, dans le scope de `human-facing-lisibility`).

## Proposition (à trancher — décision produit, pas archi)

- **Option fold-in (recommandée archi)** : replier `vz` en **mode** d'`ezk-product-builder`
  (ex. `--autonomy corpus` + supervision dure), et faire **composer** [`ezk-challenge` (0161)](0161-ezk-challenge-panel.md)
  au lieu de le dupliquer. Un seul orchestrateur, l'autonomie devient un réglage.
- **Option overlay** : garder `vz` distinct **si** le PO tient à ce que « l'autonomie se choisisse
  par un nom » — alors renommer `ezk-*`, documenter la frontière vs `--checkpoints auto`, ajouter « En clair ».

## Critères d'acceptation (brouillon — DoR au grooming)

- [ ] Décision PO tranchée (fold-in vs overlay) et journalisée.
- [ ] Le panel de challenge n'est plus dupliqué : `vz` **compose** 0161.
- [ ] Plus aucune ambiguïté catalogue « deux product-builders ».

## Notes

- **Dépend de [0161](0161-ezk-challenge-panel.md)** (extraire le panel avant de le composer).
- Lié à la fille A (nommage `vz-`).
