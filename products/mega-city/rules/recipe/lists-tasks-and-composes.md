---
id: recipe/lists-tasks-and-composes
kind: disposition
level: SHOULD
title: Playbook + composes + profil référencé
enforcements:
  - type: agent-check
    agent: ezk-chef
---

Une bonne recette porte une section **« Les étapes (playbook) »** en liste de tâches
tâche-après-tâche (pas un paragraphe de prose continue), déclare ses `composes:` quand elle
s'appuie sur d'autres recettes (idiome ADR-0012/0025 — ex. `brancher-domaine-vercel` compose
`dns-ionos-mcp`), et référence un `profile:` quand un profil existe pour son contexte.

Relève du jugement d'`ezk-chef` : une recette qui viole ce SHOULD reste indexée et
utilisable, mais moins mûre — signalé, pas bloquant.
