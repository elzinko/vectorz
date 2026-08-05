---
id: 0060
title: Les deux docs d'installation ont décroché de main (checklist démo + guide web UI)
type: bug
priority: P2
product: vectorz
epic:
status: shipped
ready: 2026-08-05
pr: "#107"
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

### Second document touché — `docs/USER-GUIDE-web-ui.md`

Même symptôme, autre porte d'entrée (constaté le 2026-07-25) :

- **Chemins d'avant le monorepo** : il fait `cd /Users/elzinko/git/bacasable/cop1` et
  `pnpm --filter @cop1/web dev` — ce dépôt n'existe plus, le code est sous
  `products/cop1/` dans `vectorz`. Aucune de ses commandes ne s'exécute telle quelle.
- **Il décrit le produit d'il y a deux époques** : « elle expose le panneau Connexion
  (Story A) ; le lanceur de run (Story B) **arrive ensuite** ». Story B est livrée
  (fiche 0001), et deux onglets de plus existent depuis — dont le **Moniteur**, qui est
  le chemin actuel du produit et n'est mentionné nulle part.
- **Il envoie vers un banc d'essai fantôme** : `/Users/elzinko/git/bacasable/cop1-cobaye/`
  (cf. fiche 0041, banc jamais reconstruit post-pivot).

Un lecteur qui ouvre ce guide pour comprendre l'interface tombe sur une application qui
n'existe plus, et rate entièrement l'onglet qui compte.

## Proposition

Remettre les **deux** documents en accord avec l'état de `main`.

**`docs/USER-GUIDE-web-ui.md`** :

- corriger les chemins (monorepo) et la commande de lancement du daemon et de la web UI ;
- décrire les **quatre** onglets, en disant lequel est le chemin vivant — et notamment
  que `Run` (cop1 pilote) et `Moniteur` (cop1 observe) relèvent de **deux paradigmes
  différents**, ce que l'interface seule ne laisse pas deviner ;
- retirer ou requalifier le renvoi au banc `cop1-cobaye` (fiche 0041).

**`docs/demo-desktop-checklist.md`** :

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
- [ ] `USER-GUIDE-web-ui.md` : toutes ses commandes s'exécutent telles quelles depuis un
      clone frais de `vectorz` (rejouées, pas relues).
- [ ] Les quatre onglets y sont décrits, avec le statut de chacun (vivant / hérité).
- [ ] Plus aucun chemin vers `bacasable/cop1` ni `cop1-cobaye` dans `docs/`
      (`grep -rn "bacasable/cop1\b\|cop1-cobaye" docs/` ne renvoie rien, ou seulement des
      mentions historiques explicitement datées).

## Notes

- Découvert en rejouant la démo le 2026-07-25 : la chaîne complète (banc
  `bin/supervision-demo-run.ts` → daemon → SSE → Moniteur → validateur vert, exit 0)
  fonctionne. Seule la **documentation** du chemin a décroché.
- Voisine de la PR **#37** (guide utilisateur Claude Desktop, en attente) : si ce guide
  est abandonné, cette checklist redevient le **seul** document d'installation — raison de
  plus pour qu'elle soit juste.
