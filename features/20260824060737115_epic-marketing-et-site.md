---
id: "20260824060737115"
title: Épic — Marketing & site (orchestrateur, landing, recette site)
type: epic
priority: P1
product: mega-city
version:
epic:
status: todo
ready:
pr:
created: 2026-08-24
---

## En clair

Quatre fiches marketing/site vivaient sans arbitre (constat de l'inventaire du
2026-08-23, grappe 4). Cet épic les fédère : `0156` (ezk-marketing, l'orchestrateur —
la tête) · `0157` (ezk-landing, les pages) · `20260821172716540` (la recette « site
produit » à règles activables). La fiche « agent marketing analyste »
(`20260812104022234`) est FERMÉE et absorbée comme capacités de 0156 (paquet 2,
décision PO 2026-08-24).

## Ce que l'épic tient ensemble

- **0156** décide et orchestre (copy par produit FR/EN, jugement du rendu, benchmark
  concurrents, stratégies orientées dev) — les 4 capacités de l'ex-…234 y vivent.
- **0157** produit les landing pages pro.
- **…540** est la recette outillée « site produit » (options activables, screenshots
  réels de l'app) — validée par panel adverse le 2026-08-21 (v2).

## Comment vérifier

`pnpm ezk:map` puis BACKLOG.md : les trois filles portent `epic: "20260824060737115"` ;
l'index les regroupe sous cet épic.

## Notes

Créé au paquet 2 du nettoyage backlog (plan « trois étages »). Registre des fermetures
associées : `docs/captures/2026-08-24-fermetures-backlog-paquet2.md`.
