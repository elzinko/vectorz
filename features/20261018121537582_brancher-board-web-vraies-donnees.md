---
id: "20261018121537582"
title: "Brancher le board web sur les vraies données (read-model + backlog), au lieu de l'échantillon"
type: feature
priority: P1
product: cop1
milestone: board
version: "v0.24.0"
labels: [dashboard, board, read-model, supervision, data-wiring]
status: ready
pr:
evidence: before-after
created: 2026-10-18
---

# 20261018121537582 — Brancher le board web sur les vraies données

**En clair.** Le nouveau tableau de bord web est fini côté écran, mais il affiche un **jeu
d'exemple figé** au lieu du vrai projet. Cette fiche cadre le chantier qui le **branche sur les
vraies données** : le vrai plan (fiches + versions) et les vrais runs (le journal de supervision).
C'est le prérequis pour que ce board **remplace** l'ancien. Le chantier a une **découpe naturelle en
trois morceaux** si un sprint ne suffit pas (voir plus bas). Rien à coder ici — on cadre.

**Si tu arrives frais.** Le produit est **cop1**, la webapp qui observe les projets de la méthode.
Son nouveau board (`products/cop1/packages/web`, `Board.tsx`) a été refait par maquette en
v0.17/v0.18. Trois mots : un **run** est une session de la méthode ; le **read-model** est la couche
de code qui transforme les journaux bruts en données prêtes à afficher ; le **backlog** est
l'ensemble des fiches et du plan.

## Contexte / Problème

Le board web est bâti, mais **débranché**. Trois faits, vérifiés dans le code :

- **L'écran lit un échantillon en dur.** `Board.tsx:14` importe `BOARD_DATA`, un objet codé à la
  main dans `src/board/data.ts`. L'en-tête de ce fichier le dit lui-même : « Le read-model réel
  (journal par worktree + backlog) remplacera ces constantes aux tranches suivantes ». Au futur.
  Donc pas encore fait.
- **La couche de lecture live existe déjà** (livrée en v0.18). La fonction
  `journal-validator.projectChantiers(...)` lit les journaux des worktrees et rend la vraie vie des
  chantiers. Mais **personne ne l'appelle** : hors tests, elle n'a aucun consommateur dans tout le
  dépôt.
- **Aucun pont entre les deux.** Le package web n'importe ni `journal-validator` ni `observability`.
  Il n'existe aucun adaptateur qui transforme la sortie du read-model en données du board.

Résultat : l'écran est prêt, la donnée live est prête, mais le fil qui les relie **manque
entièrement**. Tant qu'il manque, le board neuf ne peut pas remplacer l'ancien (`ezk board open`,
qui, lui, sert de vraies données).

**Valeur.** Une seule interface pour piloter la méthode. Aujourd'hui l'ancien board dit vrai mais
est éparpillé ; le nouveau est unifié et lisible mais ment (échantillon). Ce chantier donne au
nouveau le droit de prendre la place de l'ancien.

## Proposition

### 1. Le contrat de données : ce que l'écran attend ↔ ce que la source produit

L'écran attend un objet `BoardData = Record<nomProjet, BoardProject>` (`src/board/types.ts`). Un
`BoardProject` réunit **deux familles de champs**, qui viennent de **deux sources différentes** :

| Famille de champs du board | Source réelle | Ce qui existe déjà |
|---|---|---|
| `funnel`, `versions` (current/upcoming/past + décomptes), `fiches` (détail), `metrics.done` | **le backlog** : les fiches `features/*.md` + `features/PLAN.md` | l'ancien board le calcule déjà, mais dans **mega-city** (`loadFiches` + `readPlan`), que cop1 **n'a pas le droit d'importer** (ADR-021) |
| `runs`, `chantiers`, `timeline`, `moments`, `metrics` live (tokens, temps, compte de runs/sprints/rétros) | **le journal de supervision** : `events.jsonl` par worktree | `journal-validator.projectChantiers(...)` rend un `ChantierProjection[]` prêt à projeter |

**L'écart précis à combler (l'adaptateur manquant)** :

1. **Pas d'adaptateur** `ChantierProjection[]` / `RunProjection` → `BoardProject` / `BoardChantier` /
   `BoardRun`. Tout est à écrire.
2. **Les types ne se mappent pas 1:1.** Trois pièges nommés :
   - Le cycle de vie du read-model (`'running' | 'at_gate' | 'finished' | 'orphan'`) doit se traduire
     dans l'état du board (`'live' | 'gate' | 'done' | 'dead'`).
   - Le read-model rend une **liste d'évènements** étiquetés par session ; le board attend une
     hiérarchie **run → moments → transitions de fiche**. La projection évènements → moments →
     transitions est à écrire.
   - Les tokens du read-model sont **toujours « absent »** (garde D9 d'ADR-079 : jamais
     auto-déclarés). Le board doit donc afficher **honnêtement l'absence** (« non mesuré » justifié,
     pas un faux chiffre) — ce que son propre critère d'acceptation permet déjà.
3. **Pas de lecteur de backlog côté cop1.** La part « plan » (funnel/versions/fiches) se calcule
   aujourd'hui dans mega-city. cop1 doit avoir **son propre lecteur**, recopié léger, comme il l'a
   déjà fait pour l'énumérateur de worktrees (ADR-079 §D9, précédent `registry.ts`).

### 2. Comment le web obtient le live : runtime, pas build-time

**Recommandation : un petit serveur local calcule les données à la demande ; le web les récupère par
`fetch`.** On ne génère pas un fichier de données figé à la construction.

Pourquoi, sous `github: false` (tout local, zéro cloud) :

| Option | Pour | Contre |
|---|---|---|
| **Build-time** : un `board.live.data.js` généré (comme `ezk views regen`) | simple, aucun serveur à lancer | **ment dès qu'un run tourne** : un instantané figé viole la règle « vue live, jamais committée » (ADR-0043/0055, ADR-079 §D11). Il faudrait le régénérer à la main sans arrêt. |
| **Runtime** : un endpoint local calcule `BoardData` à chaque requête | **vrai live** ; **réutilise une infra existante** | il faut qu'un petit serveur tourne (le board neuf est aujourd'hui un SPA vite sans backend) |

Le facteur décisif n'est **pas** le cloud (les deux options sont 100 % locales). C'est la
**fraîcheur** : les runs se passent en direct. Un instantané committé serait faux à la seconde où
une session démarre. Le runtime gagne, et la doctrine est déjà gravée (l'ancien board sert déjà ses
données calculées à chaque requête).

**Infra à réutiliser, pas à inventer.** cop1 a **déjà un daemon HTTP local**
(`packages/app/src/features/daemon/infrastructure/HttpServer.ts`) qui sert le journal en direct sur
`127.0.0.1` (`/api/supervision/runs|projects|history`, plus un flux SSE `/events`). Le chantier
l'**étend** d'un endpoint `/api/board/<projet>` qui rend `BoardData` (lecteur de backlog +
adaptateur de read-model). En dev, vite relaie ce chemin.

### 3. Activable par projet, et sans jamais casser

- **Portée projet.** Un réglage dans `.vectorz/config.yml` active la source live pour ce projet
  (même esprit que l'ancien dashboard et que les deux portées de config d'ADR-074).
- **Repli propre.** Réglage absent, source éteinte, ou serveur injoignable → le board **retombe sur
  l'échantillon** et **le dit à l'écran** (« échantillon », « données live indisponibles »). Jamais
  un faux chiffre muet, jamais un écran cassé.

## Critères d'acceptation

> Critères du chantier **entier**. Ils se répartiront sur les trois sœurs au grooming (voir
> Découpage). Une case cochée = prouvée par un relecteur qui a rejoué « Comment vérifier ».

- [ ] Le board, pour un projet activé, affiche le **vrai plan** : funnel, versions et fiches tirés
      des fiches `features/*.md` + `PLAN.md`, pas de l'échantillon.
- [ ] Le board affiche les **vrais runs** : runs, chantiers et chronologie tirés du journal
      (`projectChantiers`), nom de session réel, moments réels — aucun texte inventé.
- [ ] `Board.tsx` **ne lit plus `BOARD_DATA` en dur** : il lit une source injectée (endpoint live ou
      repli).
- [ ] Les **tokens absents** s'affichent comme une absence explicite et justifiée, pas comme un faux
      chiffre.
- [ ] **Activation par projet** : réglage présent → source live ; réglage absent ou serveur
      injoignable → repli sur l'échantillon, signalé à l'écran, sans crash.
- [ ] Preuve **avant / après** en PR (règle `development/pr-before-after-media`) : board sur
      échantillon → board sur vraies données, pour un projet réel.

**Mesure de suivi** *(optionnel)* : une fois ce chantier livré, `ezk board open` peut basculer sur le
board neuf (bascule hors périmètre de cette fiche, c'est la suite du chantier « une seule
interface »).

## Comment vérifier

> Procédure, pas recopie des critères. À compléter au grooming de chaque sœur.

```bash
# 1. Le board web construit et ses tests passent
pnpm --dir products/cop1/packages/web build
pnpm --dir products/cop1/packages/web test

# 2. Le read-model multi-chantier (source live) a ses tests verts
pnpm --dir products/cop1/packages/journal-validator test

# 3. Preuve agent, avant/après, liée au corps de PR :
#    - AVANT : board sur l'échantillon (BOARD_DATA)
#    - APRÈS : board sur un projet réel (vrai plan + vrais runs), + le cas repli (serveur éteint)
```

## Découpe naturelle (si le sprint déborde)

> **Une seule fiche** (pas de chapeau). Si le build déborde un sprint, le seam se coupe ici, en
> trois morceaux cohésifs — à décider **en cours de sprint**, pas d'avance. Chaque morceau livre une
> **valeur observable** (preuve avant/après), pas une couche invisible.

| Morceau | Ce qu'il couvre | Dépend de |
|---|---|---|
| **1. Le tuyau + repli gated** | `Board.tsx` lit une source injectée au lieu de `BOARD_DATA` ; endpoint local (étend le daemon cop1) servant `BoardData` ; activation par config projet ; repli échantillon explicite. Prouvé d'abord en servant **l'échantillon** par le vrai chemin (le câblage marche, la donnée viendra ensuite). | daemon cop1 existant |
| **2. Le plan réel (backlog)** | lecteur de backlog **cop1-local** (fiches + `PLAN.md`, ADR-021) → `funnel` / `versions` / `fiches` / `metrics.done`, branché dans le tuyau. Le board montre le vrai plan. | morceau 1 |
| **3. Les runs réels (journal)** | adaptateur `projectChantiers` → `runs` / `chantiers` / `timeline` / `moments` + les trois mappings de types (cycle de vie → état, évènements → moments → transitions, tokens honnêtes). Le board montre les vrais runs. | morceau 1 ; `projectChantiers` (livré v0.18) |

Si on coupe, les morceaux deviennent des **sœurs** (`milestone: board` + `version: v0.24.0`),
chacune référençant cette fiche + ADR-074 + ADR-079 + la maquette. Cette fiche-ci devient alors le
`split`, pas un parent dormant.

## Décisions prises (PO, 2026-10-18)

1. **La parente est dé-zombifiée, pas dé-parquée.** La fiche
   [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md)
   repasse en `milestone: board`, son `blocked:` périmé est vidé, et elle porte un bandeau
   « réalisé » : ses surfaces sont livrées, elle reste le **document de design** (cité par ADR-074 et
   8 fiches livrées), le branchement données est repris ici. Pas d'archivage vers `done/` : il
   casserait ~15 citations.
2. **Version : v0.24.0.** Un patch (ex. `0.22.1`) ne convient pas — un patch corrige une version déjà
   taguée, or ici on **ajoute** une capacité neuve (le board ne sait pas encore lire les vraies
   données). Trois morceaux de feature = un lot mineur. (Alternative écartée : rescoper la v0.23, dont
   le thème « L'app se cartographie » est distinct.)
3. **Aucun ADR neuf.** Le modèle et le contrat sont dans
   [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ; le
   read-model, le cop1-local et la vue live sont dans
   [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) (§D8, §D9, §D11) ; « live,
   jamais committé » est dans ADR-0043/0055 ; « cop1 n'importe pas mega-city » est dans ADR-021. Le
   transport runtime et le lecteur cop1-local **appliquent** ces décisions, ils n'en gravent pas de
   neuve.

## Glossaire

- `read-model` — la couche de code qui transforme les journaux bruts en données prêtes à afficher.
- `projectChantiers` — la fonction du read-model (livrée v0.18) qui réunit N journaux de worktrees
  par clé de chantier et rend leur vie (sessions, évènements, cycle de vie).
- `BoardData` / `BoardProject` — la forme de données que l'écran du board attend (`src/board/types.ts`).
- `run` — une session de la méthode ; `chantier` — un travail de méthode qui réunit plusieurs
  sessions (ADR-079).
- `daemon` — un petit serveur local qui tourne en tâche de fond et sert des données au board.
- `runtime` vs `build-time` — « à la demande, quand le web le réclame » vs « figé une fois à la
  construction ».

## Notes / décisions

- **Une seule fiche, pas un chapeau.** Elle enregistre le contrat et le transport ; elle se construit
  telle quelle, et se coupe en trois sœurs seulement si le sprint déborde (voir « Découpe
  naturelle »).
- **Taille (évaluée).** Six critères (sous le seuil), mais plusieurs surfaces (web, endpoint, deux
  adaptateurs). Elle **reste entière** à dessein : les trois morceaux partagent **un seul contrat**
  (`BoardData`) et **un seul transport** ; le premier sprint bâtit le **tuyau de bout en bout** en
  servant d'abord l'échantillon (POC du câblage), les sources se branchent ensuite. Le seam est
  **documenté** et se coupe en cours de sprint s'il déborde — même pli que la fiche read-model
  [353](done/20261015082118353_board-read-model-chantier-sessions-evenements.md) (« si le build
  déborde, le seam naturel serait… »). On ne pré-découpe pas d'avance.
- **Anti-doublon fait.** Toutes les fiches `milestone: board` sont en `features/done/`. Les deux plus
  proches ne couvrent pas le branchement :
  [activité run→moments→fiches](done/20261012231419211_board-activite-run-moments-fiches.md) a bâti
  l'UI **sur l'échantillon** ;
  [read-model chantier→sessions→events](done/20261015082118353_board-read-model-chantier-sessions-evenements.md)
  a bâti **la couche de lecture** (`evidence: none`, « couche de lecture, pas d'écran »). Le read-model
  et l'UI existent ; ce chantier est le **fil qui les relie**.
- **Précédent de l'ancien board.** `bin/ezk-map.ts` (mega-city, port 4173) sert ses `*.data.js`
  **calculés à chaque requête** depuis les fiches + `PLAN.md` + les récits `docs/sessions/*.md` — il
  n'a aucun lien avec le journal `events.jsonl`. Le chantier reprend son transport (runtime, local),
  mais branche la part runs sur le **vrai journal**, pas sur la prose.
- **Maquette de référence :** [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
