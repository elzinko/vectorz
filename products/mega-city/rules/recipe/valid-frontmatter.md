---
id: recipe/valid-frontmatter
kind: disposition
level: MUST
title: Front-matter de recette valide
enforcements:
  - type: agent-check
    agent: ezk-chef
---

Le front-matter YAML d'une recette est valide (parseable) et porte au minimum les champs
`id`, `title`, `makes`, `source`, `status` (D2). `composes`, `profile`, `home`, `created`,
`updated` sont les compléments du gabarit
[`recipes/RECIPE_TEMPLATE.md`](../../../../recipes/RECIPE_TEMPLATE.md) — absents, ils ne
bloquent pas, mais un front-matter absent ou sans les 5 champs requis, si.

`ezk-chef` vérifie ce champ **présence** avant de juger le contenu — c'est la première
étape de sa gate mécanique.

Origine : D2 de la fiche
[`20260824185422122`](../../../../features/20260824185422122_recette-artefact-premier-rang-et-gardien.md).
