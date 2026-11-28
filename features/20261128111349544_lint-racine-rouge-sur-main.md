---
id: "20261128111349544"
title: "Le lint racine est rouge sur main : 34 erreurs dans le serveur local de mission control"
type: chore
priority: P2
product: cop1
milestone: qualite
version:
labels: [qualite, lint]
status: idea
blocked:
depends: []
pr:
evidence: none # mise en forme du code, aucun écran
created: 2026-11-28
---

# 20261128111349544 — Le lint racine est rouge sur main : 34 erreurs dans le serveur local de mission control

**En clair.** La commande de contrôle de style du dépôt (`pnpm lint`) échoue sur `main` : 34 erreurs, toutes
dans le serveur local de mission control. Aucune gate ne la joue, donc personne ne l'a vu. On remet le
contrôle au vert et on le fait jouer par la gate.

## Contexte / Problème

Mesuré le 28 novembre sur `main`, avant le sprint 29 : `pnpm lint` rend 34 erreurs et 1 avertissement. Elles
portent sur des fichiers `ezk*Source*.ts`, `chantierAdapter*.ts` et un script de capture. Ce sont surtout
des mises en forme, plus quelques `delete`. La gate des stories de mission control joue le contrôle de types
et les tests, pas le lint : chaque développeur du sprint 29 l'a trouvé rouge sans pouvoir dire si c'était
de son fait.

## Proposition

1. Corriger les 34 erreurs (mise en forme automatique d'abord, puis les cas à la main).
2. Ajouter le lint à la gate des stories qui touchent le serveur local.

## Critères d'acceptation

- [ ] `pnpm lint` rend le code 0 sur `main`.
- [ ] Aucun test ne change de résultat.
- [ ] La gate d'une story du serveur local joue le lint.

## Comment vérifier

- `pnpm lint`
- `npx vitest run products/cop1/packages/app`

## Notes / décisions

- 2026-11-28 — Fiche de suite demandée par ezk-pm au checkpoint du sprint 29. Hors maquette.
