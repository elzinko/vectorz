---
id: "20261115180227117"
title: "Le serveur de mission control regroupe ses routes de lecture par projet"
type: refactor
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
blocked:
pr:
evidence: none # aucun écran modifié, le comportement des routes ne change pas
created: 2026-11-15
---

# 20261115180227117 — Le serveur de mission control regroupe ses routes de lecture par projet

**En clair.** Le serveur local de mission control sert trois lectures par projet : la loi, les recettes et
les étapes du process. Le même bloc de branchement est recopié trois fois, et une quatrième lecture arrive
avec le graphe ou le glossaire. On écrit ce branchement une seule fois ; ajouter une lecture devient une ligne,
et le confinement ne peut plus diverger d'une route à l'autre.

**Si tu arrives frais.** Le « daemon » est le serveur local de cop1 : il lance une commande `ezk … --json`
pour un projet connu et renvoie le résultat à l'écran. Le « confinement » refuse tout projet qu'il ne connaît
pas.

## Contexte / Problème

- `products/cop1/packages/app/src/features/daemon/infrastructure/HttpServer.ts` : trois méthodes
  `setLawHandler`, `setRecipesHandler`, `setProcessHandler` (lignes 156-170) et trois blocs de route
  `/api/law/`, `/api/recipes/`, `/api/process/` (lignes 312-330) presque identiques ; le cœur
  `handleProjectRead` est déjà partagé.
- `products/cop1/packages/app/src/features/daemon/application/DaemonService.ts` : trois branchements
  semblables (lignes 140 et suivantes).
- Relevé par la revue adverse de la fiche
  [La méthode émet ses étapes fines](done/20261110191135802_methode-emet-ses-etapes-fines.md), le 15 novembre.

## Proposition

- Une table des lectures par projet (chemin, code d'indisponibilité, gestionnaire) et un seul branchement qui
  la parcourt, côté serveur et côté service.
- Les trois routes gardent exactement leurs réponses : 200, 404 projet inconnu, 404 chemin mal formé, 503
  sans gestionnaire.
- Hors périmètre : toute nouvelle route ; le format des sorties.

## Critères d'acceptation

- [ ] Les tests existants des trois routes passent sans modification de leurs attentes.
- [ ] Ajouter une lecture par projet demande une seule entrée dans la table, prouvée par un test qui en ajoute
  une factice.
- [ ] Le refus d'un projet inconnu et d'un chemin mal formé est testé une fois pour toutes les routes.
- [ ] Il ne reste aucune copie du bloc de route.

## Comment vérifier

```bash
pnpm exec vitest run products/cop1/packages/app/src/features/daemon
pnpm --dir products/cop1/packages/app typecheck
```

## Notes / décisions

- Origine : rétro du [sprint 8](../docs/captures/2026-11-15-retro-sprint-8-la-methode-publie-son-process.md),
  proposition retenue par le PO le 15 novembre (« 1 à 6 oui »). Priorité P2 : à faire avant la quatrième route.
