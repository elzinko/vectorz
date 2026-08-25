# Ce que montre cette carte

**En clair.** Une comparaison, au niveau du code, entre **BMAD-METHOD** (le framework agile-agent
open-source) et **ezk** (la méthode maison). Elle répond à une question simple : *qu'est-ce que BMAD
fait mieux, et qu'est-ce qu'on devrait lui prendre ?*

La page se lit de haut en bas :

1. **Le verdict en une page** — un tableau : pour chaque dimension, qui gagne et si le mécanisme se transpose.
2. **Les 3 mécanismes à voler** — classés par valeur (next-step, elicitation, graphe compilé).
3. **Les deux méthodes en une image** — le pari de fond (le LLM interprète tout / le LLM aux bords).
4. **Le détail dimension par dimension** — 8 cartes, BMAD à gauche, ezk à droite, avec le verdict.
5. **Ce que ezk fait déjà mieux**, les **sources/limites**, et **ce que ça veut dire pour toi**.

## Comment l'ouvrir

```bash
pnpm --dir products/mega-city ezk:map benchmark-bmad-ezk
```

Le rapport **texte** complet (versionné, lisible sur GitHub) :
[`products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md`](../../products/mega-city/docs/benchmarks/2026-08-25-bmad-vs-ezk.md).

## Sources

BMAD lu en `6.0.4` (cache npx), installé `6.0.0-Beta.8` dans 3 projets, plus un run réel jetable
(`cop1-cobaye/_bmad-output`). ezk = ce dépôt. Comparaison **statique** (lecture de code), pas un run
A/B chronométré.
