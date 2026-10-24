---
id: "20261024130842122"
title: "Board web : le plan réel — lecteur de backlog cop1-local (funnel, versions, fiches)"
type: feature
priority: P1
product: cop1
milestone: board
version: "v0.24.0"
labels: [dashboard, board, read-model, backlog, cop1]
status: ready
pr:
evidence: before-after
created: 2026-10-24
split_from: "20261018121537582"
---

# 20261024130842122 — Board web : le plan réel (backlog)

**En clair.** Une fois le tuyau posé (sœur 1), le board doit montrer le **vrai plan** : l'entonnoir,
les versions et les fiches, tirés des `features/*.md` + `PLAN.md`. Mais cop1 **n'a pas le droit
d'importer mega-city** (ADR-021), qui calcule ça aujourd'hui. Cette sœur écrit un **lecteur de backlog
propre à cop1** (recopié léger), et le branche dans l'endpoint du tuyau.

**Si tu arrives frais.** `BoardProject` réunit deux familles de champs ; celle-ci est la part
**« plan »** : `funnel`, `versions` (current/upcoming/past + décomptes), `fiches` (détail),
`metrics.done`. Sa source est le backlog (`features/*.md` + `features/PLAN.md`).

## Contexte / Problème

2e des 3 sœurs de [brancher le board sur les vraies données](done/20261018121537582_brancher-board-web-vraies-donnees.md).
L'ancien board calcule le plan dans **mega-city** (`loadFiches` + `readPlan`) — import interdit à cop1
(ADR-021). cop1 a déjà fait ce genre de recopie léger pour l'énumérateur de worktrees (ADR-079 §D9,
précédent `registry.ts`). Il manque l'équivalent pour le backlog.

## Proposition

- **Lecteur de backlog cop1-local** : lit `features/*.md` (front-matter) + `features/PLAN.md` du projet
  visé, sans importer mega-city. Il produit les champs « plan » de `BoardData` : `funnel`, `versions`
  (current/upcoming/past, décomptes), `fiches` (détail), `metrics.done`.
- **Branché dans l'endpoint** `/api/board/<projet>` (sœur 1) : la part plan n'est plus l'échantillon.
- Reste tolérant : un `PLAN.md` absent ou un champ vide dégrade proprement (section vide signalée,
  pas un crash), cohérent avec le repli du tuyau.

## Critères d'acceptation

- [ ] Le board, pour un projet activé, affiche le **vrai plan** : funnel, versions et fiches tirés des
      `features/*.md` + `PLAN.md`, pas de l'échantillon.
- [ ] Le lecteur de backlog vit **dans cop1**, n'importe **pas** mega-city (ADR-021) — vérifiable par
      l'absence d'import mega-city dans le package.
- [ ] `metrics.done` et les décomptes de versions reflètent le vrai backlog.
- [ ] Preuve **avant / après** en PR : part plan sur échantillon → part plan sur le vrai backlog d'un
      projet réel.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web build && pnpm --dir products/cop1/packages/web test
# Ouvrir le board d'un projet réel : funnel/versions/fiches = son vrai backlog.
rg -n "mega-city" products/cop1/packages/<pkg-du-lecteur>/src   # attendu : aucun import mega-city
```

## Notes / décisions

- Sœur de [board-web (fiche source)](done/20261018121537582_brancher-board-web-vraies-donnees.md),
  découpée au grooming (2026-10-24). Contrat :
  [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ; cop1-local :
  [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D9 ; frontière cop1↔mega-city :
  ADR-021 ; maquette validée en v0.17/v0.18.
- **Dépend de la sœur 1** (le tuyau + l'endpoint) : elle branche la source dans le chemin déjà posé.

- **Cœur construit (2026-10-24), via ezk-sprint.** `packages/app/src/features/board/backlogReader.ts` :
  `projectPlan` (PUR) calcule **l'entonnoir** (idea/ready/wip/sans-version/parkées), **les versions**
  (en cours = plus bas lot non tagué, ADR-0070 ; à venir ; passées) et le **compte livré**, depuis les
  fiches + les tags git. Bord I/O `readBacklogFiches` parse le front-matter **chez cop1** (dép `yaml`),
  **sans importer mega-city** (ADR-021). Testé (`backlogReader.test.ts`, 3 cas) ET **validé sur le vrai
  backlog vectorz** : version en cours `v0.23.0`, à venir `v0.24.0`, passées `v0.22→v0.18` avec leurs
  décomptes. `cop1 app` typecheck + 215 tests verts. Mergé main local `d8ca66d8`.
- **RESTE :** (a) le **détail de fiche** (`fiches?` : en-clair/contexte/critères/vérif = parse du CORPS,
  pas que le front-matter) ; (b) un écart de ~10 fiches lues vs `regen` (parse à durcir) ; (c) **brancher
  dans l'endpoint daemon** (sœur 1 moitié daemon) pour que le board SERVE ce plan — c'est là que se
  décide la provenance multi-projets (le daemon sert un registre de projets). La fiche reste `ready`.

- **Part PLAN servie (2026-10-24).** Le lecteur `backlogReader` est désormais branché dans l'endpoint
  `/api/board` : le board reçoit le vrai entonnoir, les vraies versions (en cours v0.23.0, à venir v0.24.0,
  passées v0.22→v0.1) et `metrics.done` (383), sans import mega-city (ADR-021, vérifié sur les imports réels).
  Preuve sur le vrai backlog. RESTE pour clore : le **détail de fiche** (`fiches?` = parse du CORPS) + l'écart
  de parse ~10. Reste `ready`.
