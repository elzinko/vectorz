---
id: development/merge-when-absent-default
kind: disposition
level: SHOULD
title: En mode auto, une fiche verte se merge — le merge n'est pas un STOP
enforcements:
  - type: agent-check
    agent: ezk-pm
---

> Règle **à éprouver** (SHOULD) : validée en rétro, à confirmer par l'usage avant un éventuel
> passage en MUST.

- **En `--mode auto` + livraison `per-feature` (le défaut), une fiche à gate verte + revue GO se
  merge (squash).** Le défaut du mode autonome est de livrer au fil de l'eau, une PR par fiche,
  comme le fait le merge per-feature.
- **« Revue GO » = le verdict de la revue adverse**, pas la simple absence d'erreur CI. Cette règle
  s'appuie entièrement sur [development/adversarial-review-before-merge](./adversarial-review-before-merge.md) :
  gate verte **sans** verdict adverse consigné ne suffit **jamais** à merger. « Gate verte + revue GO »
  se lit toujours dans cet ordre — la revue reste un préalable, jamais un STOP contourné.
- **Merger une PR verte n'est PAS un des 4 STOP.** C'est réversible (revert). Les 4 décisions
  humaines restent : irréversible/sortant, augmentation de budget, idée produit, exigences
  contradictoires. Le merge d'une fiche verte n'en fait pas partie.
- **PR-sans-merge = exception, par fiche bloquée**, avec le blocage journalisé pour CETTE fiche.
  Un run auto ne doit pas finir avec des fiches mergeables laissées en PR ouvertes sans raison.
- **La livraison coordonnée est HORS champ — ne jamais ship au fil de l'eau un lot `per-epic`.**
  En `--delivery per-epic` (lots coordonnés/empilés, cf.
  [20260906122942715](../../../../features/20260906122942715_grain-de-livraison-lot-empile.md)),
  le contrat garde **volontairement** les PR du lot ouvertes jusqu'au lot complet, livré en cascade
  par `ezk-pr` (`ezk-product-build/SKILL.md`). Une PR verte de lot laissée ouverte n'est **pas** une
  violation, et un **lot partiel** laissé ouvert à `--max-sprints` (journalisé dans `SPRINT.md`) non
  plus. Merger tout de suite une fiche de lot shipperait un lot coordonné à moitié — proscrit.
- **Ne jamais couvrir** deploy, `--force`, suppression, secret : ces actions restent hors du merge
  automatique, toujours.
- **Mesurable :** 0 fiche mergeable **en livraison `per-feature`** (hors validation manuelle requise,
  cf. [testing/manual-validation-camera-gesture](../testing/manual-validation-camera-gesture.md), et
  hors lot `per-epic` en cours) laissée non-mergée sans blocage journalisé la concernant.
- Origine : rétrospective du 2026-09-05 (symptôme 4). Un run auto avait produit 0 merge alors que
  le contrat per-feature merge au fil de l'eau. Enforcement niveau 1 : l'agent `ezk-pm` (décideur
  du merge en mode auto) lit cette règle. À passer au juge `ezk-steward` face aux 4 STOP.
