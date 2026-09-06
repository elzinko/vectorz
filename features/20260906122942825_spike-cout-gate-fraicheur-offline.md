---
id: "20260906122942825"
title: SPIKE — coût du gate de fraîcheur offline / sans remote
type: chore
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [methode, retro-2026-09-05, spike, run-intake]
status: idea
ready:
pr:
created: 2026-09-06
---

# 20260906122942825 — SPIKE coût du gate de fraîcheur offline

## En clair

La règle « pars d'un origin/main frais » suppose un remote joignable. Que se passe-t-il hors ligne,
ou sur un repo sans remote ? Ce spike mesure le coût de la gate dans ces cas pour ne pas casser ces
runs.

## Contexte / Problème

Symptôme 1 de la rétro du 2026-09-05, versant bord : la gate de fraîcheur (R1,
[development/run-freshness-origin-main](../products/mega-city/rules/development/run-freshness-origin-main.md))
est saine quand `origin` répond. Sans remote (offline, repo local pur), un `git fetch` échoue ou
traîne — la gate ne doit pas bloquer ces runs légitimes.

## Proposition

Mesurer et trancher :

- coût d'un `git fetch` qui échoue (timeout, pas de remote) ;
- comportement voulu : avertissement non bloquant, seuil de tolérance, ou skip explicite.

## Critères d'acceptation

- [ ] Reco go/no-go sur une gate qui dégrade proprement hors ligne.
- [ ] Seuil défini (timeout du fetch, ou détection « pas de remote » → warning).
- [ ] La reco garantit qu'un run offline légitime n'est jamais bloqué.

## Comment vérifier

Simuler un run sans remote et un run avec remote injoignable : la gate avertit sans bloquer, selon
le seuil recommandé.

## Notes

Origine : rétrospective du 2026-09-05 (symptôme 1, bord offline). Alimente directement le paragraphe
« bord offline » de la règle R1.
