---
id: 0070
title: ezk-diagram — publier une explication compréhensible à côté du diagramme (README)
type: feature
priority: P1
status: todo
pr:
created: 2026-07-15
---

# 0070 — ezk-diagram : une explication compréhensible dans le markdown publié

## Contexte / Problème

La PR #9 a ajouté les « Règles de lisibilité » à la skill : le diagramme doit se
comprendre sans le texte autour, et la règle 7 stipule que **« l'explication vit dans la
prose »**. Mais la vue publiée (`README.md` généré par `publish.sh`) ne contient que le
bloc mermaid : un lecteur qui ouvre `diagrams/<slug>/` sur GitHub voit le schéma **sans
son mode d'emploi**. Retour utilisateur (session 2026-07-15) : en plus d'un schéma
autoportant, il faut une **explication compréhensible du diagramme dans le markdown**.

## Proposition

Étendre la skill et `publish.sh` pour que chaque diagramme publié embarque son
explication :

- une section **« Ce que montre ce diagramme »** dans le `README.md` généré — en langage
  courant, dérivée de `description.md` (la prose, source de vérité), adaptée au lecteur
  (pas un dump de la prose brute si elle est longue) ;
- l'explication est **(re)générée à chaque `publish`** — jamais éditée à la main dans le
  README (sinon elle dérive de la prose) ;
- à trancher au grooming : l'explication est-elle la prose telle quelle, ou un résumé
  lecteur rédigé par le LLM et versionné (nouveau fichier du triplet, ou section de
  `description.md`) ? La frontière ADR-0001 reste : le LLM rédige, le script assemble.

## Critères d'acceptation

- [ ] Le `README.md` publié contient le bloc mermaid ET une explication en langage
      courant (pas seulement le titre du diagramme).
- [ ] L'explication est maintenue par `publish` (régénérée, pas d'édition manuelle) et
      reste cohérente avec `description.md`.
- [ ] Compatible avec les Règles de lisibilité (PR #9) : l'explication complète un schéma
      déjà autoportant, elle n'excuse pas un schéma illisible.
- [ ] Rétro-applicable aux diagrammes existants via `publish <slug>`.

## Notes / décisions

- Suite de la PR #9 (règles de lisibilité) ; la skill elle-même est la fiche 0032
  (shipped, PR #3), les vues partageables datent de la PR #6.
