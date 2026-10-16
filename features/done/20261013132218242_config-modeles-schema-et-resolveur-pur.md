---
id: "20261013132218242"
title: "Config des modèles : le schéma à deux portées + le résolveur pur"
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.17.0
labels: [installation, board, config]
status: shipped
blocked:
pr: "local (979fa00e)"
evidence: none # schéma + fonction pure, pas d'écran
split_from: "20261002205205417"
created: 2026-10-13
---

# 20261013132218242 — Config des modèles : schéma à deux portées + résolveur pur

**En clair.** Aujourd'hui, chaque agent a un seul modèle, le même dans tous les projets. On pose le
**moteur** qui permet d'en changer projet par projet, sans rien toucher à l'app. Deux portées : côté
**projet**, chaque rôle a un **tier** abstrait (performant / standard / économe) ; côté **outil**
(poste), un **mapping** dit quel modèle concret et quel effort derrière chaque tier, par IDE. Une
fonction pure calcule « projet + agent + hôte → modèle + effort ». Sans réglage, rien ne change.

**Si tu arrives frais.** Un *agent* est un rôle de l'équipe (architecte, PO, reviewer, dev…). L'*effort*
dit combien l'agent réfléchit (`low`…`max`). Un *tier* range les agents par besoin ; le mapping
tier → modèle vit côté outil car un modèle écrit dans le projet casserait dans un autre IDE (ADR-074).

## Contexte / Problème

Découpée de la fiche [Régler le modèle et l'effort de chaque agent](20261002205205417_modele-effort-agents-par-projet.md),
**côté moteur**. Le modèle est écrit en dur dans le fichier de chaque agent (`ezk-architect.md` :
`model: claude-opus-4-8`), et tous les projets lisent les mêmes fichiers via l'install globale.
Impossible de tester Opus 5.5 sur samplerz sans le changer partout. Il faut d'abord un **schéma** et un
**calcul** propres, sur lesquels les pointeurs, la CLI et le board (fiches sœurs) se branchent.

## Proposition

- **Trois tiers** : performant (architecte, PO, reviewer), standard (dev, QA, archive), économe
  (steward, chef). Défauts de la méthode = exactement les réglages d'aujourd'hui.
- **Deux portées** (ADR-074) : le **projet** (`.vectorz/config.yml`) fixe le tier par rôle ; l'**outil**
  fixe le mapping tier → modèle + effort, par IDE. Plus un **repli par agent** (réglage direct).
- **Ordre de priorité** : réglage de l'agent → tier du projet → mapping de l'outil → défaut de la
  méthode. Une valeur inconnue est **refusée** (pas de remplacement silencieux, constat fiche 0144).
- **Un seul point de calcul** : une fonction pure `projet + agent + hôte → modèle + effort`, qui laisse
  une place à l'hôte (la fiche multi-client n'aura qu'à traduire 3 tiers en noms Cursor).

## Critères d'acceptation

- [ ] Sans réglage (`modeles:` / `agents:` absents), chaque agent garde exactement son modèle et son
      effort d'aujourd'hui.
- [ ] Les trois tiers par défaut valent exactement les réglages des fichiers d'agents ; un test casse si
      l'un des deux bouge sans l'autre.
- [ ] Un modèle, un effort, un tier ou un agent **inconnu** est refusé, avec un message qui nomme la clé
      et la valeur. Rien n'est remplacé en silence.
- [ ] Le calcul « projet + agent + hôte → modèle + effort » est une **fonction pure, testée** ; il
      accepte un hôte en plus sans changer de forme.

## Comment vérifier

```bash
cd products/mega-city && pnpm typecheck && pnpm test
# tests unitaires du résolveur : défauts = réglages actuels ; valeur inconnue rejetée ; priorité respectée
```

## Notes / décisions

- Découpée de `20261002205205417` le 2026-10-13 (**le moteur**). Fiches sœurs, même version v0.17.0,
  milestone `board` : [pointeurs + CLI `ezk config`](20261013132218451_config-modeles-pointeurs-et-cli.md)
  et [route gardée + page ⚙ config outil](20261013132218656_config-outil-page-reglage-mapping.md).
- Rouvre l'alternative D de [ADR-0047](../../products/mega-city/docs/adr/0047-multi-client-cursor-et-modeles-par-hote.md)
  (la config Claude ne bouge pas : les défauts reprennent les réglages actuels). Au build : un
  amendement à l'ADR-0047 consigne cette réouverture.
- Code existant à réutiliser : lecteur de config `products/mega-city/src/loaders/project-config.ts`.
- Design de référence : [ADR-074](../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md)
  (deux portées) ; doctrine des modèles `products/mega-city/docs/ezk-model-and-lisibility.md`.
