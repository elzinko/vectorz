---
id: 0083
title: SPIKE — où atterrit le journal quand une méthode tourne dans un worktree ? (mesurer cwd et CLAUDE_PROJECT_DIR)
type: chore
priority: P0
epic:
status: shipped
ready: 2026-07-24
pr: "#45"
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

- [x] Dans un projet **labo neuf** (dépôt git ordinaire, jamais vectorz), on relève :
      `process.cwd()` et `process.env.CLAUDE_PROJECT_DIR` d'un serveur stdio lancé par
      Claude Code **depuis un worktree** et **depuis l'arbre principal**.
- [x] Le relevé est fait par un **moyen indépendant du kit** (le kit ne lit pas encore
      la variable) — un serveur jetable qui imprime son environnement suffit.
- [x] Résultat consigné dans la fiche : la variable pointe-t-elle le worktree ou l'arbre
      principal ?
- [x] Conclusion écrite : la normalisation vers l'arbre principal reste-t-elle nécessaire
      (fiche 0086), et l'ordre de résolution proposé est-il sûr ?

## Résultats du relevé — 2026-07-24, Claude Code 2.1.218 (macOS)

**Protocole.** Labo jetable hors vectorz : dépôt git neuf + worktree **externe**
(`../repo-wt`) + worktree **imbriqué** (`.claude/worktrees/wt-nested`, la topologie des
sessions Claude Code — le cas réel du PO). Sonde = serveur MCP stdio minimal déclaré dans
le `.mcp.json` du projet (`enableAllProjectMcpServers: true`), qui append `{cwd, env}` en
JSONL **dès le spawn**, avant tout handshake. Runs `claude -p` (headless, entrypoint
`sdk-cli`) en environnement nettoyé (`env -i`) pour qu'aucune variable `CLAUDE*` de la
session parente ne contamine la mesure. 3 runs, 3 lignes de relevé.

| Lancé depuis | `process.cwd()` du serveur | `CLAUDE_PROJECT_DIR` |
|---|---|---|
| arbre principal (`repo/`) | `repo/` | `repo/` |
| worktree externe (`repo-wt/`) | `repo-wt/` | **`repo-wt/`** |
| worktree imbriqué (`repo/.claude/worktrees/wt-nested/`) | `…/wt-nested/` | **`…/wt-nested/`** |

**Lecture.** `CLAUDE_PROJECT_DIR` est bien **injectée dans l'environnement du serveur**
(ce que la doc ne disait que pour les hooks) — mais elle vaut le **dossier de lancement
de la session** : dans les trois cas mesurés, `CLAUDE_PROJECT_DIR == cwd`. Lancée depuis
un worktree, elle pointe **le worktree**, jamais l'arbre principal. « Stable project
root » signifie « stable pendant la session », pas « normalisé au dépôt principal ».

**Limites du relevé.** Une version de Claude Code (2.1.218), une machine, mode headless
`-p` ; une session interactive passe par le même lanceur de serveurs MCP (très faible
risque de divergence, non re-mesuré). À re-vérifier si le comportement de
`CLAUDE_PROJECT_DIR` change dans une version future.

## Conclusion (impact 0086 et ordre de résolution)

1. **La normalisation vers l'arbre principal (fiche 0086) reste nécessaire** — c'est
   même le seul mécanisme possible : aucune des deux sources d'environnement ne remonte
   au dépôt principal. Sans elle, tout journal écrit depuis une session worktree part
   dans le worktree et disparaît avec lui (perte silencieuse constatée). La 0086 doit la
   faire **côté kit** (`git rev-parse --git-common-dir` ou équivalent), pas espérer la
   recevoir de l'environnement.
2. **L'ordre `SUPERVISION_PROJECT_ROOT` > `CLAUDE_PROJECT_DIR` > `cwd` est sûr mais ne
   suffit pas** : `CLAUDE_PROJECT_DIR` ≈ `cwd` en pratique (mesuré identiques) ; l'ajouter
   n'apporte qu'une meilleure stabilité de session, aucune protection worktree. Il peut
   être adopté tel quel, **à condition** que la normalisation git de la 0086 s'applique
   **par-dessus le résultat** de cette résolution (et que l'échappatoire explicite de la
   0086 reste le seul moyen d'écrire dans le worktree).

## Notes

- **Aucun contact avec un projet existant** : tout se fait dans un labo jetable.
- Réfs : analyse `docs/captures/2026-07-19-topologie-supervision-et-plan-diagrammes.md` ;
  doc officielle Claude Code (portées MCP, `CLAUDE_PROJECT_DIR`) ; fiche 0086
  (normalisation), fiche 0050 (kit, livré).
