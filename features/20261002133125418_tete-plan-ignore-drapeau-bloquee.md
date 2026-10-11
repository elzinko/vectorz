---
id: "20261002133125418"
title: La tête du plan montre comme tirable une fiche marquée bloquée
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [backlog]
status: idea
pr:
evidence: none # pas d'écran
created: 2026-10-02
---

# 20261002133125418 — La tête du plan montre comme tirable une fiche marquée bloquée

**En clair.** La commande qui affiche la prochaine fiche du plan peut montrer comme « tirable » une
fiche prête mais marquée bloquée. Le lot d'un sprint, lui, écarte bien cette fiche. Les deux commandes
doivent appliquer la même règle, sinon on risque de tirer une fiche qui attend autre chose.

**Si tu arrives frais.** `plan:head` affiche la tête du plan, c'est-à-dire la prochaine fiche à
construire. `plan:lot` choisit les N prochaines fiches d'un sprint. Le drapeau `blocked:` marque une
fiche prête qui attend une dépendance.

## Contexte / Problème

Constaté le 2026-10-02 par l'agent de sprint de la V0.5. `plan:lot` n'accepte qu'une fiche prête,
active, hors épic et sans drapeau `blocked:`. `plan:head` ne regarde pas ce drapeau : une fiche prête et
bloquée y apparaît « ✓ TIRABLE ».

**Deuxième symptôme, daté — extension demandée.** 2026-10-11, run autonome v0.7. Le run a longuement
hésité sur des fiches que le PO avait différées (« réveiller quand F1/F2 »). Le drapeau `blocked:` existe,
mais sa raison est du texte libre : le tirage et le run ne peuvent pas la lire pour décider seuls. Il
faudrait des raisons **typées** (par exemple : différée-PO, attend-maquette, attend-GitHub, auto-édition
risquée) que `next` et le run sautent sans délibérer.

## Proposition

`plan:head` reprend la règle d'éligibilité de `plan:lot`. Une fiche prête mais bloquée est sautée et
signalée avec sa raison, comme le fait déjà le lot.

Extension : étendre le champ `blocked:` existant avec des **raisons typées et lisibles**, que `next` et le
run autonome savent interpréter pour sauter une fiche sans délibérer. C'est le socle machine qui rend la
règle d'arrêt du run (fiche sœur [[20261011091553794]]) déterministe.

## Critères d'acceptation

- [ ] Une fiche prête marquée `blocked:` n'est jamais affichée « tirable » par `plan:head`.
- [ ] `plan:head` la signale, avec la raison du drapeau.
- [ ] `plan:head` et `plan:lot` donnent la même première fiche sur un même backlog.
- [ ] Le champ `blocked:` accepte une raison typée dans une liste fermée, et une raison inconnue échoue.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city plan:head
pnpm --dir products/mega-city plan:lot 1
```

## Notes / décisions

- Repéré pendant la construction du lot, PR #324.
- Enrichie à la rétro du 2026-10-11 (run autonome v0.7),
  [capture](../docs/captures/2026-10-11-retro-run-v07-autonome.md), S7 : extension « raisons typées » ajoutée, pas de doublon créé.
