---
id: "20260830194601376"
title: "SPIKE — sortir les vues purement outillage du versionnage (tuer les conflits inter-sessions)"
type: chore
priority: P2
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-30
---

## En clair

Quand deux sessions tournent en parallèle, les vues **générées ET committées** entrent en
conflit git : vécu cette session, la PR #196 est passée `CONFLICTING` sur `board.html` parce
qu'une autre session avait régénéré la même vue. On veut trancher, par un ADR, **quelles vues
restent committées** (celles **lues sur GitHub** : `BACKLOG.md`, `PLAN.md`) et lesquelles
peuvent être **dégitées** et construites à la demande (celles **purement outillage** :
`board.html`, lue par `ezk:map` en local).

## Symptôme (rétro 2026-08-30)

Session concurrente → conflit sur la vue générée `board.html` pendant un sprint (récurrent en
mémoire projet : « sessions parallèles = PR re-conflictée sur les vues générées »).

## Ce que le spike doit trancher

- Le **périmètre exact** : quelles vues sont GitHub-facing (à garder committées) vs outillage
  (candidates au dégitage).
- Le **coût** de dégiter (rendu GitHub, `ezk:map`, la gate CI de fidélité qui compare au disque).
- L'**ADR** `docs/adr/NNNN-artefacts-generes-hors-versionnage.md` : schéma source → dérivés +
  la frontière GitHub-facing / outillage.

## Critère mesurable

- [ ] 0 conflit sur une vue générée entre 2 sessions parallèles / mois (vécu 1× cette session).

## Notes

- Rétro 2026-08-30 (lentille archi). Se combine avec [`20260830194601233`](20260830194601233_ship-transactionnel-liens-vues.md)
  (F1) : pour les vues qui **restent** committées, la régénération déterministe suffit à éviter
  les conflits sémantiques ; le spike ne concerne que les vues **outillage**.
