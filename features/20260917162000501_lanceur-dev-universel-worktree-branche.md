---
id: "20260917162000501"
title: "Lanceur dev universel (n'importe quel projet / worktree / branche) — recette déployée par vectorz"
type: feature
priority: P0
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-09-17
---

# 20260917162000501 — Lanceur dev universel (worktree / branche), déployé par vectorz

## En clair

Aujourd'hui, lancer l'app d'un projet **depuis un worktree** est pénible : il faut connaître le
dépôt, la branche, le bon script de dev, et gérer les `node_modules` par worktree + le `.env`. On
veut **une seule commande**, la **même dans tous les projets**, qui lance l'app **sur la branche
voulue depuis n'importe quel worktree**, sans jongler. Elle doit être **installée DANS le projet**
(scripts versionnés), **pas dans le `~/.zshrc`** — et **déployée systématiquement par vectorz**
(recette/outil), comme les autres conventions.

## Contexte / Problème

- Muti : `node_modules` par worktree (worktree secondaire = pas de racine), `.env` non transitif,
  et surtout **le bon script diffère** — `dev:desktop` lance la webapp vite, mais le **MIDI/Electron**
  (ex. fiche verrou #207) exige `dev:electron`. Facile de se tromper.
- Frustration réelle exprimée : « une commande simple et efficace qui fait tout ça, peu importe le
  projet, le worktree, la branche ».

## Art antérieur (à récupérer, NE PAS réinventer)

- **city-guided** `scripts/` : `preview-branch.sh`, `preview-pr.sh`, `dev-start.sh`,
  `dev-all-start.sh` / `dev-all-stop.sh`, `dev-studio.sh`, `dev-e2e.sh`, `dev-stop.sh`
  → kit de lancement/preview par branche déjà mûr.
- **samplerz** `scripts/` : `desktop-dev-server.sh` (réutilise le port canonique au lieu de tuer
  aveuglément — leçon Codex #365), `preview-pr.sh`.
- **muti** `apps/desktop/scripts/dev-electron.sh` (+ scripts `dev:electron*` du package).

## Proposition (à cadrer au grooming)

- Une **recette vectorz** installable (`vectorz` déploie des `scripts/` + une entrée `package.json`,
  ex. `pnpm dev:branch <branche>`), homogène entre projets.
- Comportement cible : depuis n'importe quel worktree → résout le dépôt commun, prépare un
  **worktree de run dédié** (ou réutilise le courant), assure **deps + `.env`**, **détecte le bon
  script de dev** (Electron vs web vs mobile), et lance. Réutilise l'existant city-guided/samplerz.
- **Pas** de code dans `~/.zshrc` ; tout **versionné dans le projet**.

## À décider au grooming (avec un archi)

- Stratégie worktree : worktree de run dédié vs courant ; emplacement ; nettoyage.
- `node_modules` : install par worktree vs partage (store pnpm) ; coût premier lancement.
- `.env` : copie depuis le worktree principal vs source unique.
- Détection du « bon » script de dev par projet (Electron / web / Tauri / mobile) ou config
  déclarative par projet.
- Gestion des ports (réutiliser un serveur déjà lancé, cf. samplerz) ; multi-app (city-guided
  `dev-all-*`).
- Mécanisme de déploiement vectorz (recette idempotente + mise à jour).

## Notes

- Demandé explicitement en P0 par Thomas (2026-09-17). **Grooming archi requis** avant tout code.
- Recettes vectorz existantes : `/Users/elzinko/git/bacasable/vectorz/recipes` + `tools/` + `scripts/`.
