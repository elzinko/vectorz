---
id: "20260825141012293"
title: "ezk-sessions — cockpit de pilotage des sessions Claude Code (worktrees × sessions × branches), avec onglet dans la map"
type: feature
priority: P1
product: mega-city
version:
epic:
status: todo
ready:
pr:
created: 2026-08-25
---

# ezk-sessions — cockpit de pilotage des sessions

## En clair

Quand on travaille avec **plusieurs sessions Claude Code en parallèle**, on perd vite le fil :
des dossiers de travail (worktrees) restent sur le disque après qu'on a archivé la session,
des branches s'accumulent alors qu'elles sont déjà fusionnées, et on ne sait plus **qui
travaille sur quoi**. Cette fiche propose un outil, `/ezk-sessions state`, qui affiche un
**tableau clair** de l'état courant et **dit quoi nettoyer**.

Le tableau croise trois sources et **sort d'un script** (donc **sans coût IA** pour les
données) : les dossiers de travail git, les sessions Claude Code (archivée ou active), et
les branches. Le même tableau s'affiche aussi dans un **onglet de la map**
(`pnpm ezk:map sessions`, à côté de `pnpm ezk:map avancement`).

## Contexte / Problème

Vécu le 2026-08-25 sur le repo **muti** : 8 dossiers de travail (worktrees) en même temps,
plusieurs sessions archivées dont les dossiers **traînaient encore**, un **cimetière de
13 branches** déjà fusionnées, et le travail de backlog d'une fiche resté **coincé sur une
vieille branche**. Aucun outil ne donnait la photo d'ensemble ; il a fallu enchaîner une
dizaine de commandes git à la main pour comprendre.

Deux confusions à lever, qui sont la racine du désordre :

- **Un dossier de travail (worktree) ≠ une session Claude Code.** Archiver une session **ne
  supprime pas** son dossier git. D'où les « dossiers orphelins ».
- **Une branche fusionnée reste en local** tant qu'on ne la supprime pas, même quand son
  contenu est sur `main`. D'où le cimetière.

## Proposition (esquisse, à groomer)

Un outil `ezk-sessions` dont la première sous-commande est **`state`** :

- **Un script déterministe** collecte et **croise** trois sources — **aucun appel IA** pour
  produire les données :
  1. `git worktree list` (les dossiers de travail + la branche de chacun) ;
  2. les **sessions Claude Code** via le MCP `ccd_session_mgmt` (`list_sessions`) — titre
     donné par l'humain, archivée ou active, PR liée et son état ;
  3. `git branch` + l'état « déjà dans `main` ou non ».
- **Sortie = un tableau** : une ligne par dossier de travail / branche, colonnes
  **session (nom) · sujet · branche · PR + état · statut**, avec une **colonne « supprimable »**
  (et pourquoi : session archivée + PR fusionnée, ou branche déjà dans `main`).
- **Un encart « recommandations »** : les actions concrètes — *quoi nettoyer* (dossiers
  orphelins, branches fusionnées) et *quoi finir* (PR encore ouvertes des sujets en cours).
  C'est **le seul endroit** où l'IA intervient (un avis), jamais pour les données.
- **Option `--llm=claude`** (par défaut `claude`). On commence simple avec Claude Code seul ;
  l'option laisse la porte ouverte à d'autres outils (Cursor…) plus tard, **seulement si
  utile**.

**Onglet dans la map (faisabilité confirmée).** La map a déjà des onglets alimentés par un
script séparé — modèle `avancement` : `bin/regen-avancement.ts` génère les données,
`pnpm ezk:map avancement` les affiche. On ajoute un onglet **`sessions`** sur le **même
patron** : un `bin/regen-sessions-data.ts` (les mêmes données que la CLI) affiché par
`pnpm ezk:map sessions`. La CLI et l'onglet **partagent le même collecteur** — une seule
source de vérité.

## Critères d'acceptation (esquisse — non ready)

- [ ] `/ezk-sessions state` affiche un tableau **dossier de travail · branche · session
      (nom + archivée/active) · PR + état · colonne supprimable**.
- [ ] Les données du tableau sortent d'un **script** — **zéro appel IA** pour les produire.
- [ ] L'outil **repère** les dossiers de travail orphelins (session archivée, plus rien
      d'actif dessus) **et** les branches déjà fusionnées dans `main`.
- [ ] Un **encart recommandations** liste les actions : quoi nettoyer, quelles PR ouvertes
      finir.
- [ ] La **même donnée** s'affiche en onglet de la map : `pnpm ezk:map sessions`, sur le
      modèle de `pnpm ezk:map avancement`.
- [ ] Option `--llm=claude` (défaut) ; l'architecture reste ouverte à d'autres outils plus tard.

## Comment vérifier

- **Sur un cas réel multi-worktrees** (l'état muti du 2026-08-25 en est un bon test : 8
  dossiers de travail, sessions archivées, PR ouvertes et fermées) : lancer
  `/ezk-sessions state` **et** `pnpm ezk:map sessions` → le tableau doit **classer** chaque
  ligne (active / orpheline / supprimable) et l'encart **proposer le nettoyage** exact.
- **Coût IA** : vérifier que produire le tableau **ne déclenche aucun appel LLM** (seul
  l'encart recommandations en fait un, et il est optionnel).

## Notes / décisions

- **Origine** : douleur vécue le 2026-08-25 (session muti, pilotage de multiples sessions à
  la main). Le besoin est de **piloter** plusieurs sessions d'un coup d'œil, pas de les
  dérouler.
- **Product `mega-city`** : c'est là que vivent les skills ezk, la map et les scripts `bin/`.
- **Principe maison respecté** (`bin/README.md`, ADR-0001) : *le script range, l'IA ne fait
  que juger*. Ici le script produit tout le tableau ; l'IA se limite à l'encart reco.
- **Frontière à trancher au grooming** : la famille `bin/supervision-*.ts` observe les
  **événements de la méthode** (les agents ezk qui émettent), **pas** le croisement dossier
  git ↔ session Claude Code. Vérifier au grooming si des briques sont réutilisables ou si
  c'est bien distinct — **ne pas dupliquer**.
- **Briques réutilisables** : `bin/ezk-map.ts` (onglets), `bin/regen-map-data.ts` /
  `bin/regen-avancement.ts` (patron « données d'onglet »), le MCP `ccd_session_mgmt`
  (`list_sessions`), `git worktree list` / `git branch`.
- **Suite naturelle** : une fois l'état visible, une sous-commande de **nettoyage assisté**
  (proposer les `git worktree remove` / `git branch -d` sûrs) — hors périmètre `state`.
