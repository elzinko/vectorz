---
id: 0083
title: SPIKE — où atterrit le journal quand une méthode tourne dans un worktree ? (mesurer cwd et CLAUDE_PROJECT_DIR)
type: chore
priority: P0
epic:
status: todo
ready:
pr:
created: 2026-07-19
---

# 0083 — Mesurer la racine de projet vue depuis un worktree

## Contexte / Problème

C'est **la seule inconnue sérieuse** du dossier « émetteur par-projet » (analyse du
2026-07-19). Personne ne sait aujourd'hui ce que vaut la racine de projet **quand la
session est lancée depuis un worktree git** :

- Le kit résout la racine ainsi : `SUPERVISION_PROJECT_ROOT` si fournie, **sinon
  `process.cwd()`** (`src/supervision/mcp-server.ts`, `resolveProjectRootFromEnv`).
  Aucun contrôle git, aucune notion de worktree nulle part dans le chemin d'écriture.
- Claude Code injecte `CLAUDE_PROJECT_DIR` dans l'environnement du serveur qu'il lance,
  décrit par la doc officielle comme *« the stable project root »* — **mais la doc ne
  tranche pas worktree vs arbre principal**.
- ⚠️ Le kit **ne lit pas encore** `CLAUDE_PROJECT_DIR` (zéro occurrence dans le dépôt).
  La mesure doit donc être faite par un moyen **indépendant du kit** (petit serveur
  jetable qui imprime son environnement), pas en retirant le bloc `env` d'une config —
  ça ne mesurerait que `process.cwd()`.

## Valeur

Cette mesure **conditionne** la fiche « résolution de la racine » (ordre
`SUPERVISION_PROJECT_ROOT` > `CLAUDE_PROJECT_DIR` > `cwd`) : s'appuyer sur une variable
dont on ignore le comportement en worktree, chez un PO qui travaille **en permanence**
en worktrees (7 sur vectorz), remplacerait une friction visible par une **perte
invisible**. 20 minutes de mesure lèvent le doute.

## Critères d'acceptation

- [ ] Dans un projet **labo neuf** (dépôt git ordinaire, jamais vectorz), on relève :
      `process.cwd()` et `process.env.CLAUDE_PROJECT_DIR` d'un serveur stdio lancé par
      Claude Code **depuis un worktree** et **depuis l'arbre principal**.
- [ ] Le relevé est fait par un **moyen indépendant du kit** (le kit ne lit pas encore
      la variable) — un serveur jetable qui imprime son environnement suffit.
- [ ] Résultat consigné dans la fiche : la variable pointe-t-elle le worktree ou l'arbre
      principal ?
- [ ] Conclusion écrite : la normalisation vers l'arbre principal reste-t-elle nécessaire
      (fiche 0086), et l'ordre de résolution proposé est-il sûr ?

## Notes

- **Aucun contact avec un projet existant** : tout se fait dans un labo jetable.
- Réfs : analyse `docs/captures/2026-07-19-topologie-supervision-et-plan-diagrammes.md` ;
  doc officielle Claude Code (portées MCP, `CLAUDE_PROJECT_DIR`) ; fiche 0086
  (normalisation), fiche 0050 (kit, livré).
