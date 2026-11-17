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

- [x] La cause du cadre blanc est nommée dans la fiche.
- [x] Le document s'affiche, ou il n'est plus listé et la page Cartes renvoie vers la Carte de la méthode.

## Comment vérifier

- vue cartes : http://localhost:5281/ puis « Cartes », clic sur « La méthode mega-city en une carte »

## Notes / décisions

**Diagnostic du 2026-11-17 : pas un bug de mission control.**

- Le daemon sert bien le document : `GET /api/maps/vectorz/methode-mega-city/carte-interactive.html`
  répond 200, 91 979 octets, avec `content-security-policy: sandbox allow-scripts`.
- Le cadre blanc n'apparaît que dans le navigateur intégré à l'app Claude : la requête du cadre y est
  refusée côté client (`net::ERR_BLOCKED_BY_CLIENT`). Dans Chrome, la même page affiche la carte
  complète (« 438 liens · 0 cassé · 96 règles · 26 commandes · 115 outils »).
- Captures : [navigateur intégré, cadre blanc](../docs/pr-evidence/20261117122122699/cartes-navigateur-integre.png) ·
  [Chrome, carte affichée](../docs/pr-evidence/20261117122122699/cartes-chrome.png).
- Clôture en `superseded` par délégation du PO absent : rien à corriger dans le code. Le choix de garder
  ou retirer ce document, maintenant que la Carte de la méthode existe, reste au PO.


- Origine : [rétro du sprint 2 du 17 novembre](../docs/captures/2026-11-17-retro-sprint-2-tout-ce-qui-est-relie.md),
  proposition 4, retenue par délégation du PO absent.
- Le choix « réparer ou retirer » revient au PO.
