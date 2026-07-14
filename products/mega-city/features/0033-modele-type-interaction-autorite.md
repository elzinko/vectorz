---
id: 0033
title: Modèle typé interaction/autorité → run / draw / document (substrat génératif)
type: feature
priority: P3
status: idea
pr:
created: 2026-07-12
---

## Contexte / Problème
La suite ezk-* forme un organigramme + des boucles d'interaction (dev↔reviewer, escalade…) qui
vivent **implicitement** dans la prose des skills/agents. 0028 en donne une carte **descriptive**
(Mermaid maintenu à la main). Question : et si cette structure était une **donnée typée, source de
vérité unique**, dont on tire PLUSIEURS projections ?

## Proposition
Un **modèle typé** (nœuds = rôles/sièges avec attributs ; arêtes = interactions avec sémantique) qui
produit **3 projections depuis une source unique** :
- **RUN** : les agents l'exécutent (boucles, autorité, garde-fous).
- **DRAW** : diagramme → image (via [[0032]]).
- **DOCUMENT** : la doc (catalogue de rôles, org-chart) — **générée**, pas écrite à la main.

Facettes portées par ce modèle :
- **Double-siège d'autorité** : l'« autorité » est un **siège** (un port), occupé par **l'humain**
  (mode interactif) ou par **le superviseur cop1** (mode autonome). Les workers sont agnostiques au
  mode. cop1 l'implémente déjà (SupervisorService intercepte la question ; sa fiche 0021 rend
  l'escalade non-terminale = blocage résoluble).
- **Boucle bornée à politiques sélectionnables** : nœud-boucle avec `arbiter`
  (dev|reviewer|humain|superviseur), `maxRounds`, `speed` — de la **donnée** qu'on flippe, pas du code.
- **Échelle de coût de décision** (hybride) : chaque décision déclare son résolveur — `fonction`
  déterministe → `llm` → `escalade` → humain. Pousse chaque décision aussi bas que possible.

## Critères d'acceptation
- [ ] schéma typé (nœuds/arêtes/attributs) = la donnée que les agents LISENT (pas des labels Mermaid à re-parser).
- [ ] au moins 2 projections démontrées depuis la même source (draw + document, ou run + draw).
- [ ] l'humain n'écrit jamais le modèle à la main (prose → Claude compile → modèle) — cf. [[0032]].
- [ ] ADR capturant la décision « modèle typé + vues générées, PAS de DSL inventé ».

## Notes / décisions (brainstorm 2026-07-12)
- **Direction, pas engagement** : incertain que ce soit la bonne colonne vertébrale (à groomer).
  Capturé en `idea` pour ne pas perdre le fil.
- Généralise **0028** (dont le diagramme descriptif serait le premier rendu de ce modèle).
- **Pas de DSL** : langages consensus déjà là = donnée structurée (sens) + Mermaid (image). Composer, pas inventer.
- L'intégrité des agents (garde-fous) est une facette voisine → [[0034]].
