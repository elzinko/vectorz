---
id: 2094
product: mega-city
title: Brancher l'émetteur sur Claude Code (.mcp.json du dépôt) — le dogfooding n'émet rien aujourd'hui
type: feature
priority: P0
epic:
status: blocked
ready: 2026-07-26
pr: '#51 · #54'
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

Un `.mcp.json` à la racine du dépôt (portée projet Claude Code), déclarant le
serveur `supervision` avec `SUPERVISION_PROJECT_ROOT` fixé — **jamais** un paramètre
d'outil (invariant anti-falsification de la fiche 0050 : le modèle ne choisit jamais où
son journal s'écrit).

> **Révisé le 2026-07-26 par [ADR-034](../../../docs/adr/ADR-034-mcp-json-artefact-local.md)** :
> ce fichier est **local et gitignoré**, pas commité. Trois raisons vérifiées sur pièce —
> il contient des chemins machine (nvm, `$HOME`) dans un dépôt public ; commité il
> *fail-fast* sur tout autre poste (`assertValidExplicitRoot`) ; et il neutraliserait
> l'échappatoire `SUPERVISION_PER_WORKTREE` en figeant la même racine dans tous les
> worktrees (`project-root.ts:156-161` — la racine explicite est prise comme base **avant**
> l'échappatoire). `supervision:link` **est** l'étape d'installation. L'invariant
> anti-falsification est intact : il porte sur *qui écrit la racine* (un script, depuis un
> argument humain), pas sur *où le fichier est rangé*.

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

## Décision PO — 2026-07-26 (arbitrage à l'intake d'`ezk-sprint`)

Le PO a d'abord refusé de brancher vectorz (« trop risqué, on teste sur un cobaye »), puis
**maintenu le branchement** après vérification de la surface d'écriture. Les deux moitiés
de sa décision, à conserver ensemble :

- **Vectorz émet — c'est de l'observation, pas du dogfooding risqué.** Vérifié sur pièce
  le 2026-07-26 : `appendFileSync` sur `.supervision/runs/<id>/events.jsonl`
  (`journal.ts:123`), rapport de gate **confiné** au dossier du run avec garde `realpath`
  active (`runtime.ts:126-151`), `.mcp.json` fusionné sans destruction, `.supervision/`
  gitignoré. **Aucune écriture dans le code, aucune suppression.** Le branchement se défait
  en supprimant un fichier.
- **Pourquoi vectorz et pas seulement le cobaye** : « le moment où je travaille sur
  vectorz est le bon moment pour regarder si ce qui apparaît dans le monitoring reflète
  bien ce qu'il se passe […] je sais ce que je demande et je peux tout de suite constater
  si c'est ok dans le produit, et corriger avec des fix/features si besoin ». Le Moniteur
  se juge sur deux axes — **fidélité** (ce qu'il montre = ce qui se passe) et **lisibilité**
  (projet, PR, infos remontées, liens cliquables, organisation) — et ces deux jugements
  exigent un observateur qui **sait ce qu'il devrait voir**. Sur un jouet, personne ne le sait.
- **Le cobaye reste** le terrain de ce qui casse (tests destructifs) — cohérent avec
  ADR-031 (Axe 1 = banc fonctionnel, fiche racine 0041).

## Critères d'acceptation

- [x] Une session Claude Code ouverte dans un projet branché voit les **5 outils**
      `run_start`, `gate_reached`, `gate_resumed`, `escalate`, `run_finished` — pas un de
      plus. *(Prouvé 2026-07-25 : serveur `connected`, 5 tools, dans une vraie session
      Claude Code sur `vectorz-jouet` ; + probe automatisé sur le `.mcp.json` généré.)*
- [ ] Un `ezk-sprint` réel (pas le banc de démo) produit un `events.jsonl` dans
      `.supervision/runs/<run_id>/` de l'**arbre principal**, y compris lancé **depuis un
      worktree** (preuve de la normalisation ADR-0019 en conditions réelles). *(Reste dû :
      la commande branche, mais un vrai run `ezk-sprint` depuis un worktree n'a pas encore
      été rejoué.)* **2026-07-26 (#54)** : vectorz est branché et le probe prouve
      mécaniquement la chaîne, worktree compris (racine déclarée = worktree, journal
      normalisé vers l'arbre principal). Ce qui reste n'est plus du développement mais
      une **constatation** : Claude Code charge ses serveurs MCP à l'ouverture, donc la
      1ʳᵉ session ouverte sur vectorz après ce merge émettra — il suffira de regarder.
      **La fiche reste `in-progress` tant que ça n'a pas été vu**, pas parce qu'il reste
      à faire.
- [x] **`supervision:probe`** — un banc **automatisable** vérifie qu'un `.mcp.json` donné
      démarre *tel qu'il est écrit* et expose exactement les 5 outils. Ajouté le 2026-07-26 :
      le trou constaté est que les tests existants prouvent le **serveur**, jamais le
      **fichier généré** (chemin `pnpm`, `--dir`, entrée `tsx`). Jouable sur vectorz **et**
      sur le cobaye, en local comme en CI — c'est la forme « test e2e rapide, déclenché
      ponctuellement » demandée par le PO.
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

- **2026-07-28 — PARK (refonte époque 2 / PR #62).** Dev livré (#51/#54) : `supervision:link`,
  `supervision:probe`, `.mcp.json` local gitignoré présent sur ce poste. **AC observationnel
  restant** (vrai `ezk-sprint` → `events.jsonl` vu dans le Moniteur) **non inventé** —
  exige une session dogfood humaine. Déblocage : ouvrir Claude Code sur vectorz avec MCP
  chargé, lancer un sprint trivial, cocher l'AC, `ship 2094`. Jusque-là : `blocked` (pas
  `in-progress` — rien à coder).
- Voisine, **pas doublon** : fiche **2077** (hooks Claude Code **classe A**, émission
  déterministe). Ici on branche l'émission **classe B** (best-effort, déclarée par la
  méthode) — c'est le contrat v0.1 tel qu'il existe.
- Débloque la fin de la fiche racine **0030** (MVP démo Desktop, `in-progress`) : son
  dernier AC non tenu est « un run **réel** émis depuis un client, pas une fixture ».
- Chaîne aval vérifiée le 2026-07-25 : `pnpm install && pnpm build` (le `dist` du
  2026-07-14 était antérieur à la route `/api/supervision/runs`), daemon avec
  `supervision.watch_roots`, `pnpm --dir products/cop1/packages/web dev`, onglet Moniteur.
