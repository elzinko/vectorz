---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117122122699"
title: L'ancienne carte interactive de la page Cartes s'ouvre vide
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [mission-control]
status: ready
pr:
evidence: before-after
created: 2026-11-17
---

# 20261117122122699 — L'ancienne carte interactive de la page Cartes s'ouvre vide

**En clair.** Dans mission control, la page Cartes liste le document « La méthode mega-city en une
carte ». Un clic l'ouvre dans un cadre, mais le cadre reste blanc. Soit on répare l'affichage, soit on
retire ce document, puisque la nouvelle Carte de la méthode montre les mêmes liens à partir des vraies
données.

**Si tu arrives frais.** La page Cartes de mission control ouvre des documents de la méthode, listés par
`ezk board maps`, dans un cadre isolé.

## Contexte / Problème

Constaté le 2026-11-17 sur main (port 5280) : clic sur « La méthode mega-city en une carte (colonne
vertébrale + carte dynamique) » → cadre blanc après plusieurs secondes. Les autres documents n'ont pas
été essayés.

## Proposition

1. Trouver pourquoi le cadre reste blanc (script bloqué par l'isolation, données `carte-interactive.data.js`
   introuvables…).
2. Puis trancher, au grooming : réparer, ou retirer le document au profit de la Carte de la méthode.

## Critères d'acceptation

- [ ] La cause du cadre blanc est nommée dans la fiche.
- [ ] Le document s'affiche, ou il n'est plus listé et la page Cartes renvoie vers la Carte de la méthode.

## Comment vérifier

- vue cartes : http://localhost:5281/ puis « Cartes », clic sur « La méthode mega-city en une carte »

## Notes / décisions

- Origine : [rétro du sprint 2 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-2-tout-ce-qui-est-relie.md),
  proposition 4, retenue par délégation du PO absent.
- Le choix « réparer ou retirer » revient au PO.
