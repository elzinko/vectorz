---
id: "20260821163346496"
title: Définir ce qu'on valide et dans quel ordre (l'unité de revue de la carte)
type: feature
priority: P2
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---
# Qu'est-ce qu'on valide, exactement ?

## En clair

Le PO veut valider la carte **par morceaux**, pas en bloc. Encore faut-il décider **ce
qu'est un morceau** : un lien ? une commande ? une bande entière ? Sans cette décision, la
revue ne finit jamais et on ne sait jamais où on en est.

## Contexte / Problème

Question posée le 2026-08-21 : *« comment valider par partie ? doit-on valider les
relations, les cartes… ? »*

La carte contient des objets de granularités très différentes : ~30 nœuds, ~40 liens,
4 bandes, une colonne d'assemblage, des descriptions. Valider « la carte » n'a pas de
sens ; valider « chaque lien » est peut-être trop fin pour être tenu.

## Proposition

À groomer. Pistes à arbitrer :

- **Par relation** — le plus fin, le plus sûr, mais ~40 décisions.
- **Par nœud** — on valide une commande et *tous* ses liens d'un coup. Plus rapide,
  granularité probablement la bonne.
- **Par bande** — le plus grossier ; utile en dernier passage, pas en premier.
- **Par nature de lien** — valider d'abord toutes les compositions, puis tous les rôles.
  Avantage : chaque passe a un seul critère en tête, donc on se trompe moins.

Ce qui doit sortir de la fiche : **une** unité retenue, un **ordre de passage**, et une
idée du **coût** (combien de décisions pour couvrir la carte).

## Critères d'acceptation

- [ ] Une unité de revue est **choisie et écrite**, avec la raison du choix.
- [ ] L'ordre de passage est défini, et il commence par le plus risqué.
- [ ] On sait dire, à tout moment, **quel pourcentage** de la carte est revu.
- [ ] La revue d'une unité tient en une passe courte — sinon l'unité est trop grosse.

## Comment vérifier

Faire une passe réelle sur trois unités et chronométrer. Si une unité demande de tout
relire pour être tranchée, la découpe est mauvaise.

> **MAJ 2026-08-24** : les « bandes » citées ci-dessus n'existent plus comme axe
> principal — la carte est désormais organisée par ÉTAGES (ADR-0039) et sections
> compilées (cérémonies, modules, librairie, LOI, profils). L'unité de revue candidate
> naturelle = LA SECTION compilée (chacune a sa source de données et son invariant).
