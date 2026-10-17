---
id: "20261015133600328"
title: "Émetteur T3 : la clé de chantier (le « quel travail », pour regrouper)"
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.18.0
labels: [supervision, emetteur, multi-session]
status: shipped
blocked:
pr: "local (92c3db93)"
evidence: none # brique émetteur ; prouvée par le payload de run.started
split_from: "20261015082118340"
created: 2026-10-15
---

# 20261015133600328 — Émetteur T3 : la clé de chantier

**En clair.** Chaque note doit dire **à quel chantier** elle appartient. On pose une **clé de
chantier** (construite depuis la version) dans l'ouverture du run. C'est elle qui permettra au
board de **réunir** les sessions d'un même travail — jamais le `run_id`, qui reste propre à
chaque session.

**Si tu arrives frais.** Un *chantier* (run) = un travail de méthode (« réaliser v0.17 »). Détail :
[ADR-079](../../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D2.

## Contexte / Problème

Le `run_id` est frappé par l'émetteur, horodaté, **unique par session** : deux sessions sur le
même travail ont deux `run_id`. Si le board agrégeait par `run_id`, il ne réunirait rien. Il faut
une **clé partagée** que la méthode pose, distincte du `run_id`.

## Proposition (ADR-079 §D2) — dépend de T1 (@0.2)

- **Clé de chantier dans le payload de `run.started`**, construite depuis `version` (+ `milestone`)
  — jamais un champ rempli à la main sur une fiche ; la méthode la **tamponne au démarrage**.
- **`run_id` inchangé** : frappé/horodaté par l'émetteur, **per-session** (le tri de `findOpenRun`
  et l'anti-collision du board restent intacts — ADR-079 D2).

## Critères d'acceptation

- [ ] `run.started` porte la **clé de chantier** (dérivée de `version` + `milestone`).
- [ ] Deux sessions réalisant la **même version** émettent la **même clé de chantier**.
- [ ] `run_id` reste **per-session, horodaté** ; rien ne l'utilise comme clé d'agrégation côté
      émetteur.

## Comment vérifier

- Deux sessions jouet réalisant la même version → **même** clé de chantier dans `run.started`,
  mais des `run_id` **différents**.
- Vérifier que la clé se dérive de `version`/`milestone` (pas d'un champ manuel).

## Notes / décisions

- Découpée de [Émetteur : identité + clé + @0.2](20261015082118340_emetteur-identite-session-cle-chantier-contrat-v02.md) le 2026-10-15.
- Décision : [ADR-079](../../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D2 ; le board
  regroupe par cette clé ([read-model](../20261015082118353_board-read-model-chantier-sessions-evenements.md)).
- **Dépend de** [T1 contrat @0.2](20261015133600298_emetteur-contrat-v02-journal-par-worktree.md).
  **Sœur** : [identité de session](20261015133600314_emetteur-identite-de-session.md) — `milestone: board` + `v0.23.0`.
