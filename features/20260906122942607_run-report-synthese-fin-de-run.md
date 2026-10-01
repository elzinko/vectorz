---
id: "20260906122942607"
title: "Run autonome transparent : ce qu'il va faire, puis ce qu'il a fait"
type: chore
priority: P1
product: mega-city
version: V0.4
epic:
depends: []
labels: [sprint]
status: idea
pr:
created: 2026-09-06
---

# 20260906122942607 — RUN-REPORT de fin de run

## En clair

À la fin d'un run auto de plusieurs sprints, on ne sait pas d'un coup d'œil ce qui a été traité :
quelles fiches mergées, lesquelles restées en PR, lesquelles bloquées. Cette fiche ajoute une
**synthèse de clôture** — une ligne par fiche — pour répondre à la question directe du PO :
« vérifier ce qui a été traité ».

## Contexte / Problème

Symptôme 2 de la rétro du 2026-09-05 : après un run auto, l'état de chaque fiche est dispersé dans
le fil. Le PO doit reconstituer à la main ce qui a été livré. C'est une demande explicite : rendre
le bilan lisible en fin de run.

## Proposition

Émettre un RUN-REPORT à la fin de tout run auto de plus d'un sprint. Contenu :

- **Une ligne par fiche** : état (`mergée` | `PR-ouverte` | `bloquée` | `sautée`), `PR#`, gate,
  revue, validation, et la raison si non-mergée.
- **HEAD vs `origin/main`** en fin de run (a-t-on divergé ?).
- **Tokens consommés vs cap**.

Réutiliser le pattern « livrable lisible » (template + extracteur scripté + rendu) plutôt que de
rédiger le rapport au jugé — voir [20260825182327490](done/20260825182327490_pattern-livrable-lisible-template-extracteur-rendu.md).

## Critères d'acceptation

- [ ] Présent à 100 % des runs auto de plus d'un sprint.
- [ ] Une ligne par fiche avec les 6 champs (état, PR#, gate, revue, validation, raison-si-non-mergée).
- [ ] Ligne HEAD vs origin/main + ligne tokens vs cap.
- [ ] Gate locale verte.

## Comment vérifier

Lancer un run auto de 2 sprints : la dernière sortie est le RUN-REPORT, avec une ligne par fiche
traitée et les lignes HEAD et tokens.

## Notes

Origine : rétrospective du 2026-09-05 (symptôme 2) — demande directe du PO. Fiche **prioritaire**
(P1). Complète la règle [development/merge-when-absent-default](../products/mega-city/rules/development/merge-when-absent-default.md) :
le RUN-REPORT est l'endroit où le « blocage journalisé par fiche » devient visible.

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend désormais le périmètre de :

- [`20260906122942555`](done/20260906122942555_preflight-contexte-de-run.md) — Préflight « Contexte de run » — bloc d'ouverture (origin/main, worktree, délégation)  
  _Pourquoi_ : Même sujet : un run autonome transparent.
- [`20260906122942662`](done/20260906122942662_echo-du-contrat-avant-run-auto.md) — Écho du contrat avant un run auto (opérateur absent)  
  _Pourquoi_ : Même sujet : un run autonome transparent.
- [`0151`](done/0151-product-builder-briefing-demarrage.md) — ezk-product-build — briefing au démarrage (comment je travaille, avec quelles règles)  
  _Pourquoi_ : Même sujet : un run autonome transparent.

Au grooming, intégrer leurs critères encore utiles ici plutôt que de les rouvrir.
