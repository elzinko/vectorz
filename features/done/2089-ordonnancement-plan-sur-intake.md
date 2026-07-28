---
id: 2089
product: mega-city
title: Ordonnancement — brancher PLAN.md sur l'intake (l'ordre suit la priorité, pas l'inverse)
type: feature
priority: P0
epic:
depends: []
labels: [enabler]
status: shipped
ready: 2026-07-26
pr: "#52"
created: 2026-07-25
---

# 0089 — L'ordre, pas seulement la priorité

## Contexte / Problème

Le backlog a des **priorités** (P0→P3) mais pas d'**ordre**. Une priorité est un seau avec
beaucoup d'ex æquo : 5 fiches P0 ne disent pas laquelle d'abord, ni où s'insère une nouvelle
fiche. La séquence réelle se re-décide de tête à chaque session — et se perd. (Cette session
même l'a vécu : `0088` a été pris par une autre session pendant qu'on travaillait.)

La sous-commande `ezk-backlog plan` (commit 5f49b98) sait **persister** la séquence dans
`features/PLAN.md`… mais **jamais utilisée** (aucun `PLAN.md`) et **pas branchée sur `add`** :
ajouter une fiche propose un re-classement de *priorité*, jamais une place dans la *séquence*.

## Valeur

« Quelle est la suite, dans l'ordre ? » a une réponse écrite et stable, qui survit aux sessions
et se met à jour quand on ajoute une fiche.

## Proposition

- `add` propose un **point d'insertion dans `PLAN.md`** (arbitrage, jamais silencieux) — pas
  seulement un bucket de priorité.
- `review` / `regen` **signalent la dérive** de `PLAN.md` (fiches shippées encore listées,
  actionnables absentes de la séquence).
- `next` affiche la **tête de `PLAN.md`** à côté du gate `ready`.

### Placement multi-rôle (au gate ready/plan, PAS à la capture)

`add` reste **cheap** (capture idea). Le placement forcé multi-rôle se fait au gate
`ready`/`plan` : PO (`ezk-pm`) = valeur/priorité · architecte (`ezk-architect`) + dev
(`ezk-tdd`) = les `depends:` + flag **enabler** (l'avis technique, absent du flux backlog
aujourd'hui — il n'arrive qu'à l'étape Archi du sprint, trop tard) · scrum master (`ezk-sprint`)
= facilite + journalise. Les rôles existent déjà comme agents : trou de **câblage**, pas de rôle
manquant.

## Critères d'acceptation

- [ ] Ajouter une fiche déclenche une proposition de place dans `PLAN.md`.
- [ ] `review` liste les écarts entre `PLAN.md` et l'état réel.
- [ ] `PLAN.md` reste curé (LLM rédige, PO arbitre), référencé par le README.
- [ ] Le gate `ready` exige un `depends:` résolu (aval technique).

## Décision de sprint (2026-07-26) — scope POC

Gate `ready` validé par le PO (checkpoint `/ezk-product-builder`, la douleur venait d'être
vécue en direct : le builder lancé nu tirait `0041` au lieu de la tête de plan `2094`).

**POC = le pain-killer d'abord** (POC-first) : rendre **l'intake conscient de `PLAN.md`**.
- `next --ready-only` lit `features/PLAN.md`, calcule la **tête de plan** (1re fiche actionnable,
  non-`shipped`, dans l'ordre de `PLAN.md`) et :
  - la renvoie/pointe quand elle est `ready` ;
  - **signale « tête bloquée »** (nomme la tête à groomer) au lieu de renvoyer silencieusement une
    fiche `ready` de rang inférieur ;
  - l'affiche à côté du gate `ready`.
- Vaut pour l'usage racine **et** mega-city (skill `ezk-backlog` partagé).

**Reste = polish (fiche complète, sprint ultérieur)** : proposition de placement à `add` (AC1),
placement multi-rôle, `review` signale la dérive de `PLAN.md` (AC2), gate exige `depends:` résolu
(AC4). Non bloquants pour tuer la douleur d'aujourd'hui.

## Notes

- Bâtit sur `plan`/`plan set` existant — ne le réinvente pas.
- Cas d'école : `0091` (mise à plat) est P0 mais doit passer **après** `0079` (P1) — la
  priorité seule donnerait le mauvais ordre.
