---
id: "20260831075615969"
title: ezk-retro — invoquer ezk-chef suggest et proposer une fiche « créer la recette X »
type: feature
priority: P0
product: mega-city
epic:
status: todo
ready:
pr:
created: 2026-08-31
---

# 20260831075615969 — ezk-retro invoque le chef et propose une fiche-recette

## En clair

Pendant la rétrospective de fin de sprint, on veut que les agents puissent **demander à l'outil
`ezk-chef`** s'il y a des recettes à capitaliser, puis **décider** d'en faire une tâche.
Concrètement : la cérémonie invoque `ezk-chef suggest`, examine les candidats, et si c'est
pertinent **crée une fiche « créer la recette X »** pour le sprint suivant. La recette elle-même
n'est **pas** produite ici — c'est un **livrable du sprint N+1**.

## Contexte / Problème

Modèle validé (PO, 2026-08-31) : la **rétro est le seul point de décision** de la
capitalisation. `ezk-chef` est un **outil** qu'elle invoque — comme elle invoque déjà
`ezk-backlog add`. Une recette ne « sort » jamais toute seule d'un sprint : elle passe par une
**fiche de feature** que la rétro crée, développée au sprint suivant.

Aujourd'hui la cérémonie `ezk-retro` (fiche `0167`, shippée) produit action / feature / spike /
règle et range via `ezk-backlog`. Elle **ne connaît pas `ezk-chef`** et ne sait pas proposer une
recette.

Voisine :
[20260826082120069](20260826082120069_ezk-retro-propose-features-et-regles-ciblees.md)
(« ezk-retro propose des features ET des règles ciblées ») fait évoluer le **même** temps 3 de
la cérémonie, mais pour le **ciblage des règles** (agent / skill), avec une lourde dépendance au
modèle compilé. Cette fiche-ci reste **focalisée sur le volet recette**, P0, sans cette
dépendance. Les deux se composent ; on ne les fusionne pas (arbitrage PO : priorités et
dépendances distinctes).

## Proposition

Faire évoluer la skill `ezk-retro` (temps 1 « collecte des signaux » + temps 3 « sortie typée »
+ temps 5 « rangement ») :

1. **Invoquer `ezk-chef suggest` dès le temps 1** (collecte des signaux), **en amont du garde-fou
   « pas de symptôme → pas de rétro »** (`ezk-retro/SKILL.md:57-61`). Un candidat-recette détecté
   **est** un signal : sans lui au temps 1, l'early-return couperait la rétro avant même d'avoir
   regardé le sprint. Les agents reçoivent les candidats (fiche voisine
   [20260831075615809](20260831075615809_ezk-chef-suggest-recettes-du-sprint.md)).
2. **Juger la pertinence** : les agents décident au cas par cas. Ce n'est pas parce que
   `suggest` propose qu'on retient.
3. **Proposer d'abord, ne pas créer tout de suite** : chaque candidat retenu figure dans le
   **rapport de rétro** avec ta case d'acceptation (⏳ → ✅ / ❌), **jamais pré-remplie**.
4. **Créer la fiche « créer la recette X » seulement après ton ✅** : `ezk-backlog add` n'est
   appelé qu'**une fois le candidat accepté** (temps 5 « rangement sous contrôle PO »,
   `ezk-retro/SKILL.md:92-103`). Un candidat ⏳ ou ❌ ne crée **rien** au backlog. La fiche créée
   part au sprint suivant selon ton mode (auto / manuel).

## Critères d'acceptation

- [ ] `ezk-chef suggest` est invoqué **au temps 1** (collecte des signaux), **avant** le garde-fou
      « pas de symptôme » : un sprint sans symptôme verbal mais avec une galère capitalisable
      produit quand même des candidats.
- [ ] Un candidat figure d'abord au **rapport de rétro** avec ta case d'acceptation (⏳),
      **jamais pré-remplie**.
- [ ] `ezk-backlog add` n'est appelé **qu'après ton ✅** : un candidat ⏳ ou ❌ ne crée **aucune**
      fiche au backlog (garde-fou « rien rangé sans feu vert PO »).
- [ ] La fiche créée porte des **pointeurs** vers la fiche source + les galères.
- [ ] La recette n'est **pas** produite pendant la rétro (le sprint N+1 la développe).
- [ ] Gate locale verte (typecheck / lint / tests).

## Comment vérifier

- Rejouer une rétro sur un sprint qui a une galère capitalisable → `suggest` propose, la rétro
  crée une fiche « créer la recette X » au backlog.
- Sprint calme → aucun candidat, aucune fiche-recette.
- Ouvrir le rapport : la case d'acceptation de la fiche-recette est vide tant que tu n'as pas
  tranché.

## Notes / décisions

- **Origine** : conception du pont de capitalisation, session du 2026-08-31 (panel adverse
  ezk-architect / pm / reviewer / dev, 2 tours + affinages PO).
- **P0** demandée par le PO.
- **Compose** : `0167` (la cérémonie, shippée) ; fiche voisine
  [20260831075615809](20260831075615809_ezk-chef-suggest-recettes-du-sprint.md)
  (`ezk-chef suggest`) ; `ezk-backlog add` (création de fiche). **Voisine** de
  [20260826082120069](20260826082120069_ezk-retro-propose-features-et-regles-ciblees.md) (même
  temps 3, volet ciblage des règles — distincte, à composer, pas à fusionner).
- **Frontière** : ne construit pas la recette (sprint N+1, via `ezk-chef extract`) ; ne déclenche
  pas la rétro (réglage séparé — « qui lance la rétro, et quand ») ; ne touche pas au Sujet B /
  ADR-030.
- Doctrine : ADR-0013 (la recette propose, ne fabrique pas de code seule).
