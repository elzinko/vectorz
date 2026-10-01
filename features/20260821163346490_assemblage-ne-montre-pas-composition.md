---
id: "20260821163346490"
title: "Corriger la fausse « chaîne de montage » en haut de la carte"
type: feature
priority: P2
product: mega-city
version: V0.1
milestone: fondation
labels: [carte]
status: idea
pr:
created: 2026-08-21
---
# La ligne « L'ASSEMBLAGE » ne montre pas ce qu'elle prétend montrer

## En clair

En haut de la carte, six blocs alignés avec des flèches se lisaient comme une chaîne de
montage. Ce n'en était pas une. Cette ligne a disparu à la refonte en trois étages (PR #162),
mais rien ne l'a remplacée : on ne voit pas d'un coup d'œil qui compose quoi. Cette fiche
ajoute une vue compilée depuis le graphe : une hiérarchie, des flèches nommées, des nombres vrais.

## Contexte / Problème

Constat du 2026-10-01 : la file des six blocs n'existe plus dans la carte interactive (aucune
occurrence d'« assemblage »). Le schéma Mermaid garde un bloc « L'ASSEMBLAGE » vertical, dont
les 17 flèches sont déjà nommées. Il manque la vue d'ensemble : la composition ne se lit que
carte par carte.

Les six blocs n'étaient pas de même nature. Le PO est une personne. La loi et l'équipe sont
deux catalogues qui coexistent. Le profil les agrège. Le bind lit le profil.

## Proposition (POC)

Une vue « qui compose quoi » sous l'introduction de la carte, compilée depuis le graphe
(`src/core/assemblage.ts`) :
- Une hiérarchie : un profil compose des bundles, des juges et des commandes ; un bundle
  compose des règles. Le PO n'y figure pas : une personne n'est pas une brique du dépôt.
- Chaque flèche porte son verbe et son nombre de liens : rien n'est écrit à la main.
- Le bind est à part, en pointillé : c'est du code, aucun fichier du catalogue ne le déclare.
- Les autres relations (convoque, applique, est vérifiée par) sont listées dessous, avec leur nombre.

## Critères d'acceptation

- [x] Aucune flèche nue : chaque flèche de la vue porte un verbe et un nombre ; un test garde
      les 17 flèches du schéma Mermaid ; les flèches du cycle portent « puis » (infobulle).
- [x] Deux natures ne se dessinent pas pareil : composition en trait plein, bind en pointillé,
      autres relations en liste pointillée.
- [ ] Un lecteur frais dit sans aide ce que le bind consomme et ce que le profil agrège
      (test du lecteur frais, à jouer par le PO).
- [x] Sans objet : `description.md` décrit le schéma Mermaid, que cette fiche ne modifie pas.

## Comment vérifier

```bash
pnpm ezk:map                                              # la section « L'assemblage »
pnpm --dir products/mega-city test -- map-assemblage      # nombres = arêtes du graphe
```

Test du lecteur frais : montrer la section à quelqu'un qui ne connaît pas le projet. S'il
décrit une suite d'étapes, c'est raté.

- vue haut-de-carte : /diagrams/methode-mega-city/carte-interactive.html

**Avant / après** (règle `development/pr-before-after-media`)
| Vue | Avant | Après |
|---|---|---|
| haut-de-carte | ![haut-de-carte avant](https://github.com/elzinko/vectorz/blob/cb70da1bba9e85fb68983bad1876ff8e6e3710c1/docs/pr-evidence/20260821163346490/haut-de-carte-before.png?raw=true) | ![haut-de-carte après](https://github.com/elzinko/vectorz/blob/cb70da1bba9e85fb68983bad1876ff8e6e3710c1/docs/pr-evidence/20260821163346490/haut-de-carte-after.png?raw=true) |

## Suite (hors POC)

- Les caps de l'hôte (`caps/`) : ce que le bind écrit chez Claude Code, Desktop, Cursor.
- Un clic sur une brique de la figure ouvre la liste de ses cartes.
