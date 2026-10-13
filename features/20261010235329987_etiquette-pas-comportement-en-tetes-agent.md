---
id: "20261010235329987"
title: Quand on touche les règles déclarées d'un agent, dire si ça change son comportement ou juste l'étiquette
type: feature
priority: P2
product: mega-city
milestone:
version: v0.16.0
labels: [lisibilité, revue, loi]
status: ready
pr:
evidence: none
created: 2026-10-10
---

# 20261010235329987 — « Étiquette, pas comportement » quand on touche les en-têtes d'agent

**En clair.** Chaque agent a un en-tête qui liste « les règles que je suis ». On a cru deux fois
que modifier cet en-tête changeait ce que l'agent **fait**. C'est faux : cet en-tête est
**retiré avant** que l'agent reçoive ses instructions — il ne le lit jamais. C'est une
étiquette pour les inventaires et les schémas, pas un levier de comportement. On veut un
réflexe : chaque fois qu'on touche ces étiquettes, **dire clairement** si ça change le
comportement (non) ou seulement la déclaration auditable (oui).

**Si tu arrives frais.** Dans la méthode, un agent déclare les règles qu'il suit via des champs
`interactions:` (agent) ou `applies:` (skill). Ces champs servent à dessiner le graphe de la
méthode et à vérifier la cohérence (`graph:check`). Mais le **modèle** (l'IA derrière l'agent)
ne les lit pas : ils sont enlevés du prompt. Ce que l'agent fait vraiment vient de sa **prose**
(ses instructions écrites) et d'un **cliquet** (`law-coverage`), pas de l'étiquette.

## Contexte / Problème

- **Symptôme daté (2026-10-10).** Pendant le run v0.8.0, deux fois un livrable touchant ces
  étiquettes a failli sur-promettre un effet réel : F1 (`appliedRuleIds` sans effet runtime) et
  F2 (un ADR qui disait « injecté dans le prompt des deux côtés » — faux). Le relecteur a
  rattrapé F2 ; sans lui, on publiait une affirmation mensongère.
- **Pourquoi ça compte.** Se tromper sur « déclaration vs comportement » fait croire qu'on a
  changé une garantie alors qu'on a juste bougé une étiquette. C'est une entorse à l'honnêteté
  que la méthode défend (ADR-0050).

## Proposition

1. Une **lentille de revue** (ou un item de checklist fiche/ADR) : tout livrable qui touche
   `interactions:` / `applies:` / le graphe **déclare explicitement** s'il change le **prompt
   runtime** de l'agent, ou seulement la **déclaration auditable** (`graph:check`).
2. Le relecteur (`ezk-reviewer`) le vérifie : un texte qui promet un effet runtime via ces
   étiquettes est un NO-GO jusqu'à correction.

## Critères d'acceptation

- [ ] Un livrable (fiche/ADR/PR) qui modifie une étiquette de règles d'agent contient une phrase
      disant « ceci change la déclaration/le graphe, pas le prompt de l'agent » (ou le contraire,
      si c'est vraiment le cas et prouvé).
- [ ] La lentille/l'item est portée quelque part de durable (lentille `ezk-reviewer` ou règle),
      pas seulement dans cette fiche.

## Comment vérifier

```bash
# un ADR qui affirme « injecté dans le prompt » via interactions: doit être attrapé par la revue
```

La forme exacte (lentille reviewer vs item de règle) se décide au grooming.

## Glossaire

- `interactions:` / `applies:` — les champs d'en-tête où un agent/skill déclare les règles qu'il
  suit ; métadonnée de graphe, pas lue par le modèle.
- `prompt runtime` — les instructions réellement données à l'IA de l'agent (sa prose).
- `cliquet law-coverage` — le mécanisme qui vérifie que les règles contrôlées sont bien portées.

## Notes / décisions

- Née de la rétro du 2026-10-10 (grain n°2), capture
  [docs/captures/2026-10-10-retro-run-regles-composables.md](../docs/captures/2026-10-10-retro-run-regles-composables.md).
- Lié à [ADR-0071](../products/mega-city/docs/adr/0071-dod-dor-contrat-partage-bundle-role-methode.md)
  (qui pose déjà la distinction « déclaré/chargé » vs « appliqué ») et à la fiche sœur
  [capture de rétro lisible](20261010213353647_capture-retro-lisible-pour-le-po.md).
