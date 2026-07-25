---
id: 0094
title: Brancher l'émetteur sur Claude Code (.mcp.json du dépôt) — le dogfooding n'émet rien aujourd'hui
type: feature
priority: P0
epic:
status: in-progress
ready:
pr:
created: 2026-07-25
---

## Contexte / Problème

**Constat sur pièce (2026-07-25).** La méthode tourne dans **Claude Code**, mais l'émetteur
n'y est branché **nulle part** :

- pas de `.mcp.json` à la racine de `vectorz` (`ls .mcp.json` → absent) ;
- `~/.claude.json` : `mcpServers` global = `posthog`, `MaxMSPMCP`, `whatsapp-group` ;
  entrée projet `vectorz` = `mcpServers: []` ;
- côté Claude **Desktop**, l'extension `local.mcpb.vectorz.vectorz-supervision` **est
  installée** (2026-07-20) mais son réglage est `{"isEnabled": false}` et aucun
  `project_root` n'a jamais été renseigné.

Conséquence : les skills émettrices (`ezk-sprint`, `vz-product-builder`,
`supervision-demo`) portent toutes la clause « **si les outils MCP sont disponibles —
sinon saute cette section sans bruit** ». Les outils n'étant jamais disponibles, la
clause s'applique **toujours** : chaque sprint réel se déroule **sans laisser aucune
trace** dans `.supervision/`. Le journal n'a jamais été alimenté par un vrai run de
méthode — uniquement par le banc `bin/supervision-demo-run.ts`.

C'est le **seul verrou** entre « je lance `ezk-product-builder`/`ezk-sprint` » et « je le
vois dans le Moniteur ». Tout l'aval est prouvé fonctionnel : journal → daemon → SSE →
Moniteur → validateur vert (rejoué de bout en bout le 2026-07-25).

## Proposition

Un `.mcp.json` **commité à la racine du dépôt** (portée projet Claude Code), déclarant le
serveur `supervision` avec `SUPERVISION_PROJECT_ROOT` fixé — **jamais** un paramètre
d'outil (invariant anti-falsification de la fiche 0050 : le modèle ne choisit jamais où
son journal s'écrit).

Points à trancher pendant le sprint :

1. **Chemin du serveur** — `bin/supervision-mcp.ts` via `pnpm --dir products/mega-city
   exec tsx` (source vivante, cohérent avec un dépôt de dev) **ou** le bundle esbuild déjà
   produit par `bin/build-mcpb.sh` (figé, zéro dépendance). Claude Code hérite du shell,
   donc les deux pièges GUI documentés dans `src/supervision/README.md` (pnpm nu,
   `--dir` manquant) ne s'appliquent **pas** ici — à vérifier plutôt qu'à supposer.
2. **`SUPERVISION_PROJECT_ROOT`** — la racine du dépôt suffit-elle, ou faut-il
   `${workspaceFolder}`/équivalent ? La normalisation vers l'arbre principal (ADR-0019,
   fiche 0086) doit couvrir le cas worktree — **à prouver en worktree**, c'est
   exactement le cas d'usage quotidien ici (une feature = un worktree).
3. **Portée** — dépôt seul (dogfooding) ; l'extension au poste entier et au consommateur
   externe reste le job de la fiche **0087**.

**Frontière avec 0087 (à arbitrer par le PO au grooming).** 0087 décide que le *plugin*
Claude Code embarque ce même serveur MCP (« un serveur, deux emballages »), mais elle est
bloquée par son AC n°1 (ADR de versionnage, couplé cop1-0050) et vise un **consommateur
externe**. Cette fiche-ci est le **chemin interne d'aujourd'hui** : un fichier de config,
zéro doctrine. Si le PO préfère, elle peut être absorbée comme première tâche de 0087 —
mais elle ne doit alors pas hériter de son blocage.

## Critères d'acceptation

- [x] Une session Claude Code ouverte dans un projet branché voit les **5 outils**
      `run_start`, `gate_reached`, `gate_resumed`, `escalate`, `run_finished` — pas un de
      plus. *(Prouvé 2026-07-25 : serveur `connected`, 5 tools, dans une vraie session
      Claude Code sur `vectorz-jouet` ; + probe automatisé sur le `.mcp.json` généré.)*
- [ ] Un `ezk-sprint` réel (pas le banc de démo) produit un `events.jsonl` dans
      `.supervision/runs/<run_id>/` de l'**arbre principal**, y compris lancé **depuis un
      worktree** (preuve de la normalisation ADR-0019 en conditions réelles). *(Reste dû :
      la commande branche, mais un vrai run `ezk-sprint` depuis un worktree n'a pas encore
      été rejoué.)*
- [x] Le run apparaît dans l'onglet **Moniteur** de la mission-control, et son gate de
      checkpoint s'y affiche `at_gate`. *(Prouvé 2026-07-25 : run émis depuis une vraie
      session Claude Code, carte `at_gate` puis `finished` dans le Moniteur.)*
- [x] Le validateur cop1 est **vert** sur le dossier du run (ou la perte détectée est
      montrée — c'est le produit). *(Prouvé 2026-07-18 puis rejoué 2026-07-25.)*
- [x] `.supervision/` est gitignoré (règle DP6) — la commande `supervision:link` l'ajoute
      au `.gitignore` du projet branché.

## Livré (2026-07-25)

- **Commande `pnpm --dir products/mega-city supervision:link <projet>`** : branchement
  automatisé côté Claude Code — écrit/**fusionne** le `.mcp.json` (préserve les autres
  serveurs MCP), gitignore `.supervision/`, imprime les étapes suivantes. **Idempotente**
  (rejouer met à jour les chemins) et **non-destructive** — prouvé par test (injection
  d'un serveur MCP tiers conservé) et par un probe MCP (le serveur démarre, 5 outils).
- Logique pure `src/supervision/link-config.ts` (8 tests) ; coquille I/O
  `bin/supervision-link.ts` ; doc dans `src/supervision/README.md`.
- **Reste** avant `shipped` : rejouer un vrai `ezk-sprint` depuis un worktree (2ᵉ AC), et
  purger le résidu racine `.supervision/runs/2026-07-24T…` du dépôt `vectorz`.

## Notes

- Voisine, **pas doublon** : fiche **0077** (hooks Claude Code **classe A**, émission
  déterministe). Ici on branche l'émission **classe B** (best-effort, déclarée par la
  méthode) — c'est le contrat v0.1 tel qu'il existe.
- Débloque la fin de la fiche racine **0030** (MVP démo Desktop, `in-progress`) : son
  dernier AC non tenu est « un run **réel** émis depuis un client, pas une fixture ».
- Chaîne aval vérifiée le 2026-07-25 : `pnpm install && pnpm build` (le `dist` du
  2026-07-14 était antérieur à la route `/api/supervision/runs`), daemon avec
  `supervision.watch_roots`, `pnpm --dir products/cop1/packages/web dev`, onglet Moniteur.
