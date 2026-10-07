---
id: "20261007151859479"
title: "Chemin « lite » du sprint pour fiches triviales (éviter la sur-cérémonie)"
type: refactor
priority: P2
product: vectorz
milestone:
version:
labels: [outillage, sprint, token-economy]
status: idea
pr:
evidence: none
created: 2026-10-07
---

# 20261007151859479 — Chemin « lite » du sprint pour fiches triviales

**En clair.** Le benchmark du 2026-10-07 l'a montré : **toutes** les méthodes — vectorz compris —
produisent environ **2 fois plus de doc que de code** sur une petite feature. On veut un chemin
« lite » : une fiche triviale **saute la cérémonie lourde** (ADR, Gherkin complet) et garde juste le
test et la revue. Le chemin complet reste le défaut pour le reste.

**Si tu arrives frais.** La boucle `ezk-sprint` déroule beaucoup d'étapes (fiche, BDD, ADR, TDD,
gate, revue). Sur une broutille, cette cérémonie coûte plus que le code lui-même. Prior art :
**BMAD** et son `quick-flow`, qui court-circuite le pipeline documentaire long.

## Contexte / Problème

Mesure du benchmark 2026-10-07 : sur la feature `configz` (une CLI de ~60 lignes), le ratio
doc/code était d'environ **1,8:1 chez vectorz** — le meilleur des quatre méthodes, mais encore trop
pour une tâche aussi petite. La cérémonie, calibrée pour du non-trivial, **écrase le petit**.

## Proposition

1. Un **mode « lite »** du sprint pour les fiches marquées triviales : cérémonie réduite au strict —
   **test + revue + commit** —, sans ADR ni Gherkin complet.
2. Le **chemin complet reste le défaut** pour toute fiche non triviale.
3. Un **critère objectif** décide « lite » (ex. ≤ N critères d'acceptation, une seule surface
   touchée) — pas au doigt mouillé.

## Critères d'acceptation

- [ ] Une fiche triviale se construit **sans** la cérémonie complète (pas d'ADR, Gherkin minimal), **test et revue conservés**.
- [ ] Le chemin complet **reste le défaut** pour le non-trivial.
- [ ] Un **critère objectif** déclenche le mode lite (seuil de critères / nombre de surfaces) — reproductible, pas au jugé.

## Comment vérifier

```bash
# Une fiche triviale passe en mode lite ; le sprint ne produit ni ADR ni Gherkin complet, mais un test vert.
pnpm --dir products/mega-city ezk sprint run --lite <fiche-triviale>
```

## Notes / décisions

- **Origine** : constat du benchmark du 2026-10-07 (sur-cérémonie sur petit, toutes méthodes confondues).
- **Prior art** : BMAD `quick-flow`.
- **Lié** : règle [token-economy/fiche-tient-dans-un-sprint](../products/mega-city/rules/token-economy/fiche-tient-dans-un-sprint.md)
  (une fiche doit tenir dans un sprint) — le mode lite en est le pendant côté exécution.
- **Hors** du thème portabilité — planifiable seul.
