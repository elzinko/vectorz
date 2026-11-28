---
id: "20261128120000209"
title: "Le compte rendu de sprint compte les intégrations locales au lieu d'écrire « 0 PR mergée »"
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [theme:outillage-methode, origine:retro-2026-11-28]
status: idea
blocked:
depends: []
pr:
evidence: none
created: 2026-11-28
---

# 20261128120000209 — Le compte rendu de sprint compte les intégrations locales au lieu d'écrire « 0 PR mergée »

**En clair.** Les sept comptes rendus du run du 26 novembre écrivent « 0 PR mergée », alors que quatorze intégrations locales ont eu lieu. Le projet travaille sans GitHub, et le compteur ne connaît que les PR. Cette fiche fait compter les intégrations locales.

## Contexte / Problème

Le compte rendu lit les livraisons comme des PR GitHub. En flux local (`github: false`), la livraison s'écrit `local (<sha>)`. Le même compte rendu affiche aussi « total 0 jeton » quand les jetons ne sont pas mesurés : c'est une décision en attente depuis la rétro du 24 novembre, à traiter dans la même zone de code.

## Proposition

Le compte rendu compte les livraisons `local (<sha>)` comme des intégrations. En flux local, la ligne dit « N intégrations locales ». Une livraison sans référence lisible est comptée « indéterminée », jamais 0.

## Critères d'acceptation

- [ ] Un sprint de deux livraisons locales affiche « 2 intégrations locales ».
- [ ] Un sprint avec PR GitHub garde son affichage actuel.
- [ ] Une livraison sans référence lisible est comptée « indéterminée ».

## Comment vérifier

- Régénérer le compte rendu du sprint 23 (26 novembre) : il affiche 2 intégrations locales.

## Hors périmètre

- Le faux zéro des jetons, porté par la décision du 24 novembre.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
