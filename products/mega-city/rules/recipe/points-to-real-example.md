---
id: recipe/points-to-real-example
kind: disposition
level: MUST
title: Une recette pointe un exemple réel
enforcements:
  - type: agent-check
    agent: ezk-chef
---

Une recette (`recipes/*.md`) porte une section **« Fichiers de référence (entonnoir —
pointer, jamais copier) »** avec **au moins un pointeur `fichier:ligne`** vers
l'implémentation prouvée, et le front-matter `source:` pointe une racine qui **existe**
(un chemin réel — `~/git/…` ou un chemin relatif au repo).

Une recette sans exemple pointé n'est pas une recette : c'est une intention. Le gardien
`ezk-chef` juge cette rule pour chaque recette lue — jugement, pas de script mécanique
(seule `recipe/indexed`, ci-dessous, est vérifiée par script).

Origine : D2 de la fiche
[`20260824185422122`](../../../../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md)
— tableau « Le bundle de rules ».
