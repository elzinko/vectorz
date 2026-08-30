---
id: recipe/plain-language-first
kind: disposition
level: SHOULD
title: « En clair » en tête de recette
enforcements:
  - type: agent-check
    agent: ezk-chef
---

Une recette ouvre par une section **« En clair »** (1 à 3 phrases, langage simple, avant le
détail) — même standard que `documentation-guidelines/human-facing-lisibility`. Une recette
sans « En clair » reste indexée, mais `ezk-chef` la signale : le lecteur qui arrive frais
doit comprendre en une lecture ce que la recette fabrique, avant le détail technique.
