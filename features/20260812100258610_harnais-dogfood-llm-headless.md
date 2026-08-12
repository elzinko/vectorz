---
id: "20260812100258610"
title: "testbed dogfood LLM headless — rejouer la chaîne méthode→journal→Moniteur sans humain (nightly)"
type: feature
priority: P3
product: mega-city
epic:
depends: []
labels: [method, testbed, supervision]
status: idea
ready:
pr:
created: 2026-08-11
---

# 20260812100258610 — testbed dogfood LLM headless (harnais nightly)

## Contexte / Problème

Aujourd'hui [`docs/DOGFOOD.md`](../docs/DOGFOOD.md) décrit une vérification **manuelle** de la
chaîne d'émission : un humain lance `dogfood-guided.sh`, pilote Claude Code, appuie **Entrée**
à chaque 👉, ouvre `/supervision-demo`, puis **confirme visuellement** les captures du Moniteur.
Ça prouve la chaîne (méthode → journal → Moniteur), mais exige une **présence humaine de
15–30 min** — donc ce n'est **pas rejouable en CI / nightly**. Entre deux dogfoods manuels,
l'émission peut **régresser en silence** (c'est exactement le foyer des bugs 0105/0168 :
un runtime testé, un produit pourtant muet).

La « Suite produit (acteur LLM headless, nightly) » mentionnée en bas de `DOGFOOD.md` était
une **v2 jamais fichée** — elle vivait sous une référence fantôme `2103-…` (renumérotation
transitoire d'une branche abandonnée `590bd4f`, jamais mergée). Cette fiche la matérialise.

## Proposition

Un **harnais** qui rejoue la chaîne dogfood avec un **acteur LLM headless** à la place de
l'humain : il déclenche le run (équivalent `/supervision-demo`), franchit les gates, et laisse
la chaîne écrire son `events.jsonl` — **sans interaction humaine**, exécutable en **nightly**,
avec un verdict **OK/KO déterministe** sur l'émission réelle.

- **Compose, ne réimplémente pas** : la brique de démarrage d'env [0102](0102-ezk-testbed-brique-boot-env-test.md)
  (démarrer/arrêter proprement) et le kit d'analyse [0104](done/0104-kit-analyse-session-supervision.md)
  (`supervision:analyze`, journal ↔ transcript) pour rendre le verdict.
- **POC d'abord** : un seul scénario nominal headless **vert** (un run produit un journal non
  vide, `analyze` = `healthy`), avant tout élargissement.

## Critères d'acceptation

- [ ] Un run **headless** (zéro interaction humaine) produit un `.supervision/runs/<id>/events.jsonl` non vide.
- [ ] `supervision:analyze` (0104) rend un verdict `healthy` sur ce run.
- [ ] Lançable en **une commande / un job nightly**, sortie **OK/KO** déterministe (pas de faux vert : Moniteur down ⇒ **SKIP explicite**, pas OK).
- [ ] Gate locale verte (typecheck/lint/tests).

## Notes / décisions

- **Origine** : `docs/DOGFOOD.md` §« Suite produit » (ex-réf fantôme `2103`, jamais créée).
- **Voisines** : [0102](0102-ezk-testbed-brique-boot-env-test.md) (brique boot env — **composée**),
  [0104](done/0104-kit-analyse-session-supervision.md) (kit analyse session — d'où vient `DOGFOOD.md`),
  [0169](0169-explorateur-llm-par-pr.md) (explorateur LLM par PR — angle complémentaire sur les trous fonctionnels).
- **Priorité P3 / `idea`** : pas requis pour le dogfood humain d'aujourd'hui — c'est la v2.
  À **groomer** au moment de la tirer.
- **Dédoublonnage** : proche de 0102/0104/0169 mais distinct (couche *acteur LLM headless*,
  ni boot d'env, ni analyse) — à confirmer par le PO en `review`.
- **Id horodaté** (schéma fiche 0180, `mint-id.sh`) — 1ʳᵉ fiche du dépôt à l'adopter :
  créée d'abord en `0186`, renumérotée à la clôture pour sortir de la collision
  multi-branches (0186 était déjà pris sur `main` + PRs #123/#120).
