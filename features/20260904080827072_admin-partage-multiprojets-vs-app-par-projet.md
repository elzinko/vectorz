---
id: "20260904080827072"
title: "admin ezk : partagé multi-projets vs une app par projet — ports, isolation"
type: chore
priority: P3
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-09-04
---

**En clair.** Question d'archi **ouverte**, capturée pour ne pas la perdre. Quand ezk pose des
choses par projet sous `.vectorz/`, l'**admin** (la supervision : daemon + vue web) pourrait
tourner **par projet**. Mais une app par projet = **autant de ports réseau** à ouvrir et à gérer.
L'autre voie : **un seul admin** qui sert **tous** les projets. Rien n'est tranché — ce sera
probablement une décision d'archi (ADR) plus tard. Parké par le PO le 2026-09-04.

## Contexte / Problème

Le chantier multi-client (foyer `.vectorz/mega-city/`, fiche `20260901173549334`) a fait émerger
l'idée de placer sous **`.vectorz/`** des éléments **propres au projet** — dont l'admin.

Si chaque projet démarre **sa** vue d'admin, on multiplie les **ports** (un serveur par projet),
la découverte, le cycle de vie (démarrer/arrêter). Ça devient vite lourd dès qu'on a plusieurs
projets ouverts. Le PO l'a dit : « peut-être que le design d'une app par projet n'est pas
indiqué ».

La chaîne de **supervision** existante (daemon + vue web, avec un **registre** de projets) touche
déjà ce sujet — c'est le prior art naturel.

## Proposition

Ce n'est pas une solution, c'est une **décision à instruire** (→ probablement un ADR). Peser :

- **A — Un admin partagé, multi-projets.** Un seul daemon + une seule vue web, avec un
  **registre** de projets ; un port, une vue centrale. Coût : découverte des projets + isolation
  gérée **dans** l'app.
- **B — Une app par projet.** Isolation simple par nature, un mental model par projet. Coût :
  **N ports**, orchestration démarrer/arrêter, pas de vue d'ensemble.

Trancher au grooming, à la lumière de la supervision déjà en place (registre, runs par projet).

## Critères d'acceptation

*(Idée / question d'archi — pas de critère exécutable pour l'instant. Le grooming produira une
**décision** — vraisemblablement un ADR « admin partagé vs par projet » + une reco.)*

- [ ] Décision documentée (ADR) : modèle retenu (A/B/hybride), et pourquoi.
- [ ] Impact sur la supervision existante (registre, ports, cycle de vie) explicité.

## Comment vérifier

À définir avec la décision (pas de commande rejouable à ce stade — c'est un arbitrage d'archi).

## Notes

- **Déclencheur** : chantier `.vectorz/mega-city` (fiche `20260901173549334`) — placer de
  l'admin par projet sous `.vectorz/`.
- **Prior art** : la chaîne de supervision (daemon + web + registre) gère déjà du multi-projet ;
  voir [`0029`](0029-contrat-supervisabilite-v02-differes.md) (contrat de supervisabilité, différés).
- **Parké par le PO** le 2026-09-04 (« on verra plus tard ») ; **P3 à confirmer** au grooming.
