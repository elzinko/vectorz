---
id: "20260930194219068"
title: "ezk-product-build : orchestrateur de session, contrat de sprint redéfini (Option A)"
type: refactor
priority: P1
product: mega-city
milestone:
labels: [sprint]
depends: ["20260930194219046", "20260930123438875"]
status: idea
pr:
evidence: none # méthode / skills, pas d'écran
created: 2026-09-30
---

# 20260930194219068 — ezk-product-build : orchestrateur de session, contrat de sprint redéfini (Option A)

## En clair

Aujourd'hui, `ezk-product-build` confie **une fiche** à la fois à `ezk-sprint`, et pose sa question
« on continue ? » après chacune. Cette fiche lui fait confier **un lot** : `ezk-sprint` construit les
stories du lot, `close` scelle l'incrément, puis le product-owner pose **une seule** question par lot.
Avec un lot d'une fiche, le défaut, les runs existants gardent leur déroulé.

## Contexte / Problème

Le panel adverse du 2026-09-30 a trouvé une **contradiction**. L'ADR-0054 fait de `run` le cycle
complet d'un lot. Or `ezk-product-build` appelle encore `ezk-sprint` fiche par fiche et tient
lui-même le checkpoint après chaque fiche. Les deux ne peuvent pas être vrais.

Le PO a tranché pour l'**Option A** : `ezk-sprint` possède la boucle du lot
(`start → stories → close` = un incrément). `ezk-product-build` se pose au-dessus et enchaîne des
**sprints**, c'est-à-dire des lots. Les deux briques existent : le lot (fiche 1, `next --lot N`) et
les verbes `start --lot` / `close` (fiche 2, livrée par #275). Voir
[ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md), décision 6.

## Proposition (POC : le texte des skills + un test de contrat)

- **La boucle par lot** (`SKILL.md` d'`ezk-product-build`, « La boucle ») :
  `ezk-backlog next --lot N` → `ezk-sprint start --lot <ids>` → les stories du lot, une PR chacune
  → `ezk-sprint close` (`CLOSE: SEALED`) → checkpoint inter-sprint.
- **Taille du lot** : nouvelle option `--lot N` d'`ezk-product-build`. Défaut **1** : le déroulé d'avant.
- **`--max-sprints N` et `--once`** comptent désormais des **lots** (une paire `start`…`close`).
- **Un checkpoint par lot** : la question « sprint suivant ? » vient après `close`, plus après chaque
  story. Le stop & ask immédiat (blocage, gate rouge 2 fois, action irréversible) et les 4 STOP
  humains ne bougent pas.
- **Les 3 `SKILL.md` disent la même chose** : `ezk-sprint` (son absorption passe à « une question
  par sprint ») et `ezk-backlog` (le builder passe par `next --lot`).

## Critères d'acceptation

- [x] Le `SKILL.md` d'`ezk-product-build` décrit la boucle par lot (`next --lot N` → `start --lot` → stories → `close` → checkpoint). Il ne dit plus qu'il confie une fiche isolée.
- [x] L'option `--lot N` (défaut 1) figure dans l'`argument-hint` et dans l'usage. `--max-sprints` et `--once` comptent des lots.
- [x] Le checkpoint inter-sprint se joue une fois par lot, après `CLOSE: SEALED`.
- [x] Rétro-compat écrite : avec `--lot 1`, le déroulé est celui d'avant ; `once`, `--once` et `--checkpoints ask` s'arrêtent où avant.
- [x] Plus de formulation contradictoire dans les 3 `SKILL.md` (ezk-backlog, ezk-sprint, ezk-product-build). Un test de contrat garde la boucle par lot, l'option `--lot` et l'absorption par sprint. Preuve : `ezk-sprint-lifecycle-contract.test.ts`, bloc « Option A », dont une liste de formulations périmées qui ne doivent plus apparaître.
- [x] Tests verts (`test` + `test:scripts`).

## Comment vérifier

```bash
pnpm --dir products/mega-city exec vitest run src/__tests__/ezk-sprint-lifecycle-contract.test.ts
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
grep -nE "next --lot|start --lot|CLOSE: SEALED|--lot N" products/mega-city/skills/ezk-product-build/SKILL.md
```

## Suite (hors POC)

- `run:context` et `run:report` affichent la taille du lot (code des deux scripts).
- `--delivery per-epic` : la règle est posée (livraison coordonnée **avant** `close`, un ensemble plus grand qu'un lot se livre lot par lot, retour Codex sur #325) ; reste à la prouver par un test de bout en bout.
- Panel adverse complet (architecte, scrum master, PO/juge) sur ce repositionnement (ADR-0054, « Suite »).
- Orchestration de session complète : planning → sprint → rétro → planning.

## Notes / décisions

- Dépend de la fiche 1 ([lot](20260930194219046_ezk-backlog-lot.md)) et de la fiche 2 ([start/close](done/20260930123438875_cycle-vie-sprint-session-ceremonies.md)) — construite **en dernier**.
- Lève la contradiction pointée par le panel (architecte) le 2026-09-30 ; Option A actée par le PO. Voir [ADR-0054](../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md).
- **Groom du 2026-10-02** (run V0.5) : défaut `--lot 1` choisi pour la rétro-compat (un run hérité ne change pas) ; le reste en « Suite ».
- **DoR du 2026-10-02** : GO d'`ezk-pm`, avec une réserve tenue au build : le test de contrat prouve aussi qu'aucune formulation « une fiche à la fois » ne reste.
- **Revue du 2026-10-02** : GO. Une nuance écrite dans le `SKILL.md` : avec `--lot 1`, une fiche prête mais marquée `blocked:` est écartée, alors que `next --ready-only` la construisait. C'est plus sûr.
