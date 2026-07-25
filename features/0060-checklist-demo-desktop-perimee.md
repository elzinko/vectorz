---
id: 0060
title: La checklist démo Desktop publie encore le bloc de config MCP prouvé cassé (corrigé ailleurs par #41)
type: bug
priority: P2
epic:
status: todo
ready:
pr:
created: 2026-07-25
---

## Contexte / Problème

`docs/demo-desktop-checklist.md` § 3 fait copier-coller ce bloc dans Claude Desktop :

```json
"supervision": {
  "command": "pnpm",
  "args": ["exec", "tsx", "/…/products/mega-city/bin/supervision-mcp.ts"],
  ...
}
```

C'est **exactement** le bloc dont la PR **#41** a prouvé qu'il ne démarre pas, et qu'elle
a corrigé dans `products/mega-city/src/supervision/README.md` :

- `command: "pnpm"` nu → `spawn pnpm ENOENT` (une app GUI macOS démarre avec un PATH
  launchd minimal ; pnpm sous nvm/corepack/Homebrew est introuvable) → chemin **absolu** ;
- `pnpm exec tsx` sans `--dir <mega-city>` → `ERR_PNPM_RECURSIVE_EXEC_NO_PACKAGE`
  (`tsx` n'est pas hoisté à la racine du monorepo, et le cwd d'une app GUI est `/`).

La correction a été appliquée au README du kit, **pas** à la checklist. Cette dernière est
pourtant le document qui se présente comme « rejouable » — « une étape non écrite ici est
réputée manquante ». Un lecteur qui la suit tombe sur les deux pannes déjà payées une fois.

Deux autres écarts constatés en la rejouant le **2026-07-25** :

1. **Le chemin nominal a changé.** Depuis la fiche 0078, le chemin recommandé est le
   bundle `.mcpb` (double-clic, Node fourni par Claude Desktop, sélecteur de dossier) ;
   le câblage JSON manuel est devenu le **chemin de secours**. La checklist présente
   toujours le manuel comme le chemin normal, et ne mentionne pas `bash
   bin/build-mcpb.sh`.
2. **Le piège du `dist` périmé n'est pas nommé.** L'étape 1 dit bien `pnpm install &&
   pnpm build` — mais si on l'omet (ou si `node_modules` date d'avant l'ajout du paquet
   `@cop1/journal-validator`), `pnpm build` échoue sur `Cannot find module
   '@cop1/journal-validator'`, **et** un `dist` ancien fait répondre
   `{"error":"not_found"}` à `/api/supervision/runs` — alors que la checklist annonce
   `[]` et attribue ce symptôme à un `watch_roots` mal configuré. Diagnostic faux,
   piste perdue. (Vécu tel quel le 2026-07-25 : `dist` du 14/07, antérieur à la route.)

## Proposition

Remettre la checklist en accord avec l'état de `main` :

- § 3 : le **`.mcpb`** en chemin nominal (build + installation + réglage `project_root` +
  activation de l'extension) ; le bloc JSON manuel relégué en secours, **avec la
  correction #41** — ou, mieux, **remplacé par un lien** vers
  `src/supervision/README.md` (source de vérité unique : ce bloc a déjà divergé une fois,
  il divergera encore s'il est dupliqué).
- § 1 : nommer le symptôme `Cannot find module '@cop1/journal-validator'` et sa cause
  (`node_modules` antérieur au paquet → `pnpm install` avant `pnpm build`).
- § 4 : ajouter le diagnostic manquant — `/api/supervision/runs` qui répond
  `{"error":"not_found"}` (et non `[]`) signifie un **binaire périmé**, pas une mauvaise
  config.

## Critères d'acceptation

- [ ] Aucun bloc de configuration MCP n'est **dupliqué** dans la checklist (lien vers la
      source de vérité), ou s'il l'est, il est identique à celui du README du kit.
- [ ] Le chemin `.mcpb` est le chemin nominal décrit ; le manuel est marqué « secours ».
- [ ] Les deux symptômes de build (`Cannot find module`, `not_found`) sont nommés avec
      leur cause et leur remède.
- [ ] La checklist est **rejouée** de bout en bout après correction (c'est sa promesse).

## Notes

- Découvert en rejouant la démo le 2026-07-25 : la chaîne complète (banc
  `bin/supervision-demo-run.ts` → daemon → SSE → Moniteur → validateur vert, exit 0)
  fonctionne. Seule la **documentation** du chemin a décroché.
- Voisine de la PR **#37** (guide utilisateur Claude Desktop, en attente) : si ce guide
  est abandonné, cette checklist redevient le **seul** document d'installation — raison de
  plus pour qu'elle soit juste.
