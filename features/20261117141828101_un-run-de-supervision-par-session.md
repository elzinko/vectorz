---
id: "20261117141828101"
title: "Deux sessions qui pilotent le même dépôt ouvrent chacune leur run de supervision"
type: feature
priority: P2
product: mega-city
milestone: observabilite
version:
labels: [supervision, sessions-paralleles]
status: idea
blocked:
pr:
evidence: none # le journal de supervision, aucun écran modifié
created: 2026-11-17
---

# 20261117141828101 — Deux sessions qui pilotent le même dépôt ouvrent chacune leur run de supervision

**En clair.** Le 17 novembre, la seconde session qui pilotait vectorz n'a pas pu ouvrir son run de
supervision : le serveur a répondu qu'un run était déjà ouvert, celui de la session voisine. Ses sprints
n'ont donc ni point de passage ni datation : leur compte rendu dit « non daté », et leur durée et leurs
jetons ne sont pas mesurés. Chaque session ouvre désormais son propre run, même sur un dépôt partagé.

**Si tu arrives frais.** Le serveur MCP `supervision` écrit le journal d'un run (`run_start`,
`gate_reached`…). Le compte rendu de sprint se date grâce au point `sprint-<slug>-checkpoint` de ce
journal (ADR-0068). ADR-079 a séparé le run de la session et posé un journal par worktree.

## Contexte / Problème

- Réponse vue le 17 novembre, depuis le worktree `objectifs-publies` : `run_start refusé : un run est
  déjà ouvert (run_id=2026-11-17T11-47-24-011Z-5bd4f370) · Méthode bloquante : ezk-sprint@a0db1a59`.
- Ce run appartenait à la session voisine, dans un autre worktree.
- Le compte rendu `docs/sprints/2026-11-17-sprint-mission-control-lit-les-objectifs-et-les-version.md`
  est sorti non daté.

## Proposition

Trouver d'abord pourquoi le journal du worktree voisin bloque celui-ci : le serveur lit-il le journal
du dossier principal plutôt que celui du worktree appelant ? Puis faire qu'un `run_start` depuis un
autre worktree ouvre un run distinct, sans toucher au run de la voisine.

## Critères d'acceptation

- [ ] Deux `run_start` depuis deux worktrees du même dépôt sont acceptés et donnent deux `run_id`.
- [ ] `run_finished` d'une session ne ferme jamais le run de l'autre.
- [ ] Le compte rendu d'un sprint joué en parallèle d'une autre session est daté.

## Comment vérifier

```bash
pnpm --dir products/mega-city test -- src/supervision   # le cas « deux worktrees, deux runs » est vert
```

## Notes / décisions

- Origine : [rétro du 17 novembre, deux pilotes sur un dépôt](../docs/captures/2026-11-17-retro-sprint-objectifs-versions-deux-pilotes.md), proposition P2.
- Priorité P2 tranchée par ezk-pm le 17 novembre, par délégation du PO.
- Voisine : [L'émetteur nomme la session et dérive la clé de chantier](20261114131612388_session-nommee-cle-de-chantier-derivee.md).
