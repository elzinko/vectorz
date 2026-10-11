---
id: agent-ops/verify-access-before-asking
kind: disposition
level: SHOULD
title: Vérifie tes propres accès avant de déléguer une opération à l'humain
---

- Avant de demander à l'humain d'exécuter une opération sur un service externe — changer un
  prix ou une variable, déployer, pousser, mettre à jour un code promo —, l'agent vérifie
  D'ABORD s'il peut la faire lui-même : une **CLI authentifiée** (`gh`, `vercel`…), un **MCP
  connecté**, ou un **secret au trousseau** (`ezk-secret list`).
- Il ne sollicite l'humain que pour **créer / déposer un secret**, ou pour une des **4 décisions
  humaines** (action irréversible ou sortante, hausse de budget, idée produit sur backlog vide,
  exigences contradictoires).
- Origine : session 2026-10-10 — l'agent a demandé un changement Vercel alors que la CLI `vercel`
  était authentifiée, et a enchaîné 3 allers-retours sur le dashboard LemonSqueezy pour un prix,
  alors que le jeton API était au trousseau depuis le début (spike 20261010213000378).
- Mesure (removability) : sur les 5 prochaines sessions touchant un service externe, 0 cas où
  l'agent délègue une opération à l'humain sans avoir d'abord vérifié CLI / MCP / trousseau et
  constaté qu'aucun ne permet de la faire.
