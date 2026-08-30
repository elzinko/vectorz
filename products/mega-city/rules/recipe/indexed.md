---
id: recipe/indexed
kind: disposition
level: MUST
title: Une recette est indexée dans le livre
enforcements:
  - type: agent-check
    agent: ezk-chef
---

Toute recette markdown de `recipes/*.md` avec un front-matter valide apparaît dans
[`recipes/RECIPES.md`](../../../../recipes/RECIPES.md), régénéré par
`products/mega-city/bin/regen-recipes.sh`. **Le script range, le LLM ne range jamais**
(ADR-0001 §2) : c'est la **seule** rule du bundle vérifiée **mécaniquement** — `ezk-chef`
lance `regen-recipes.sh` et compare, il ne juge pas « à l'œil » si une recette manque.

Une recette absente du livre après régénération est une recette invisible : la gate
d'`ezk-chef` échoue net (pas de jugement gradué possible ici).
