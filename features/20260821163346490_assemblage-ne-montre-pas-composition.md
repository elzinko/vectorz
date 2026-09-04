---
id: "20260821163346490"
title: La ligne « L'ASSEMBLAGE » ne montre pas les liens de composition (retour PO)
type: feature
priority: P1
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-21
---
# La ligne « L'ASSEMBLAGE » ne montre pas ce qu'elle prétend montrer

## En clair

En haut de la carte, six blocs sont alignés côte à côte avec des flèches entre eux : PO →
LA LOI → L'ÉQUIPE → profiles/ → caps/host → bind. **Ça se lit comme une chaîne de
montage, alors que ce n'en est pas une.** Retour du PO en ouvrant la carte : on mélange
tout, et on ne voit pas les vrais liens de composition.

## Contexte / Problème

Les six blocs ne sont pas de même nature, et la flèche ne veut pas dire la même chose
entre chaque paire :

- **PO** est une personne, pas un artefact.
- **LA LOI** et **L'ÉQUIPE** sont deux *catalogues* — ils ne se succèdent pas, ils
  coexistent et alimentent tous les deux le profil.
- **profiles/** les *compose* — c'est une agrégation, pas une étape suivante.
- **caps/host** et **bind** : le bind *consomme* le moule, il ne le suit pas.
  (Corrigé le 2026-08-21 en inversant l'ordre — mais ça reste une file, donc ça continue
  de mentir sur la nature du lien.)

Le fond du problème : **une file horizontale impose une lecture séquentielle** à des
relations qui sont, selon les cas, de la coexistence, de l'agrégation ou de la
consommation. Aucune flèche ne porte son sens.

## Proposition

À groomer — trois pistes, non exclusives :

1. **Nommer chaque flèche** (« composé par », « fournit le moule à », « pilote »), au lieu
   de laisser une flèche nue qui suggère « puis ».
2. **Sortir de la file** : représenter les deux catalogues comme deux entrées *parallèles*
   qui convergent vers le profil, et l'assemblage comme un point de convergence — pas
   comme le sixième wagon.
3. **Séparer les natures** : le PO n'appartient pas à la même couche que des dossiers du
   dépôt ; peut-être ne doit-il pas être dans cette ligne du tout.

Cette fiche est le **premier retour** d'une série attendue : la carte va se corriger au
fil des lectures.

## Critères d'acceptation

- [ ] Aucune flèche nue : chacune porte un verbe qui dit la relation.
- [ ] Deux relations de natures différentes ne sont pas dessinées de la même façon.
- [ ] Un lecteur qui découvre le sujet peut dire, sans aide, **ce que le bind consomme**
      et **ce que le profil agrège**.
- [ ] La prose source (`description.md`) est mise à jour AVANT le dessin — c'est elle qui
      fait foi.

## Comment vérifier

```bash
pnpm ezk:map
```

Test du lecteur frais : montrer la ligne du haut à quelqu'un qui ne connaît pas le
projet, et lui demander de raconter ce qu'il voit. S'il décrit une suite d'étapes, c'est
raté.
