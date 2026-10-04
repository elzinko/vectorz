---
date: 2026-10-04
session: " / ready-todo-status-distinction-d96e52"
type: friction
---

# une ligne de PLAN.md qui cite l'id d'une autre fiche bloque son ship

Le 2026-10-04, `ezk backlog ship` de la fiche 20261004192802964 a refusé : la ligne de PLAN.md de la
fiche 20261002205205417 citait l'id 20261004192802964 dans sa parenthèse (« après la page config,
20261004192802964 »). Le script y voit une ligne qui mêle une fiche livrée et une fiche à faire, et
demande de barrer à la main. Corrigé en retirant l'id de la parenthèse.

Piste : dans PLAN.md, ne citer une autre fiche que par son titre ; ou que `ship` ne regarde que l'id
en tête de ligne.
