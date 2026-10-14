---
id: "20261014122044421"
title: "Board : runs et sessions concurrents — distinguer le run (travail de méthode) de la session (LLM), les rendre lisibles et tool-agnostiques (design par maquette)"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.18.0
labels: [dashboard, board, ux, supervision, runs, multi-session, multi-llm]
status: idea
blocked:
pr:
evidence: before-after # vue d'activité ET chronologie du board, avant/après plusieurs sessions
created: 2026-10-14
---

# 20261014122044421 — Board : runs et sessions concurrents, lisibles et tool-agnostiques

**En clair.** Quand plusieurs sessions travaillent sur le même dépôt, le board ne sait pas
les montrer sans se contredire — et le mot « run » lui-même devient ambigu. Cette fiche
**conçoit par maquette** le modèle et son affichage : séparer le **run** (un travail de
méthode, ex. « réaliser v0.17 ») de la **session** (une période de travail d'un LLM, sur un
worktree, une branche), donner à la session une **identité lisible**, et décider comment le
board les montre — dans l'activité **et dans la chronologie** — pour **n'importe quel outil
LLM**, pas seulement Claude. Elle ne code pas encore : elle produit une **maquette validée**
et une **décision gravée (ADR)**, puis les tranches de build.

**Si tu arrives frais.** Un *run* = un travail de méthode qui écrit un journal (un cadrage,
une réalisation de version). Une *session* = une instance de LLM qui travaille un moment
(un worktree ouvert, une branche). Un *worktree* = une copie de travail isolée du dépôt. Le
*board* lit les journaux ; sa vue **Activité** montre des cartes, sa vue **Chronologie** un
fil d'évènements trié par le temps.

## Contexte / Problème

Cinq faits du code, constatés le 2026-10-14, cadrent le problème.

1. **Le modèle actuel confond run et session.** ADR-074 pose « un run = une session de la
   méthode ». Mais un même travail de méthode peut s'étaler sur **plusieurs sessions** (je
   reprends demain) ou être mené par **plusieurs sessions en parallèle** (3 worktrees sur
   v0.17). Le mot « run » porte alors deux choses à la fois.
2. **Par défaut, tous les worktrees partagent un seul journal**, et **un seul run y est
   ouvert à la fois** (`project-root.ts` ramène vers l'arbre principal ; `findOpenRun` +
   l'invariant « un seul run ouvert »). Deux sessions concurrentes se bloquent donc, ou la
   seconde devient invisible.
3. **Une session n'a pas d'identité parlante.** La carte se distingue par nom de méthode,
   version, `seat`, racine projet, et un `runId` opaque. **Aucun champ worktree, branche ou
   session.**
4. **La Chronologie validée est un fil unique trié par le temps**, filtrable par **type** et
   par **version** — **sans aucune notion de session**. Avec plusieurs sessions, leurs
   évènements s'**entrelacent** dans ce fil, sans moyen de dire lequel vient de qui. Le
   filtre par version ne les sépare pas : le tirage reste borné à la **version en cours**
   (ADR-0070), donc des sessions concurrentes partagent souvent la même version.
5. **Le board est déjà multi-outils** : la config résout les tiers (`high/middle/low`) en
   modèles concrets **par IDE** — Claude Code, Cursor, Codex CLI (ADR-074). Le contrat de
   supervisabilité lui-même est **MCP + JSONL**, deux standards non liés à Claude.

Résultat : le board ne peut pas répondre d'un coup d'œil à « combien de sessions tournent
sur ce projet, que fait chacune, et à quel travail de méthode elles contribuent ? ». Et ce
doit tenir pour tout outil LLM, pas seulement Claude.

Cette fiche **affine le board après v0.17** : la vue Activité et la Chronologie de v0.17
sortent telles quelles, celle-ci décide ensuite comment elles représentent le parallélisme.
Elle contraint les tranches [Board : l'activité par run → moments → fiches](20261012231419211_board-activite-run-moments-fiches.md)
et [Board : la chronologie condensée](20261012231419237_board-chronologie-condensee.md).

## Proposition

On procède **par maquette d'abord**, comme pour tout le board (ADR-074, conçu en 17
itérations) : on dessine, on départage avec le PO sur des exemples concrets, **puis** on
grave et on construit. La fiche porte **cinq questions couplées**, du modèle à l'affichage.

### Volet 0 — qu'est-ce qu'un *run* ? (le modèle, à trancher d'abord)

Recommandation à valider : **séparer deux entités** que le board confond aujourd'hui.

- **Run** = une unité de **travail de méthode** (réaliser v0.17, cadrer un lot). C'est ce
  autour de quoi le board s'organise (runs → moments → fiches, rattachés à une version).
- **Session** = une **période de travail d'un LLM** : un émetteur qui s'ouvre et se ferme,
  sur un worktree, une branche, avec un outil donné.

Lien : **un run peut réunir plusieurs sessions** (successives ou concurrentes) ; une session
peut toucher plusieurs runs. Chaque évènement du journal est attribué à **la session** (qui
l'a fait) **et au run** (à quel travail il appartient). **ezk/la méthode décide le
rattachement** : quand une session se met à réaliser v0.17, elle s'attache (ou ouvre) le run
« réalisation v0.17 ». C'est le point que la maquette et un avis architecte doivent trancher.

### Volet 1 — l'identité d'une session (côté kit émetteur), tool-agnostique

Ajouter à l'ouverture d'une session un ou deux champs **lisibles par un humain** :

- `worktree` : le nom du dossier de worktree (toujours disponible, lecture pur file-system) ;
- `branch` : la branche git, lue **sans lancer `git`** (lecture directe de `.git/HEAD`) ;
- `session_label` *(optionnel)* : un libellé humain (objectif, titre).

**Contraintes dures.**
- Au moins un libellé parlant est présent et affiché. Le board ne montre **jamais** le seul
  `runId`/`sessionId` nu.
- L'identifiant de session est **frappé par l'émetteur** (comme le `run_id` l'est déjà), pas
  emprunté à une API propre à un outil. L'identité vient de **git (pur FS)**. Donc **aucune
  dépendance à Claude Desktop** ni à un IDE précis : tout outil qui parle MCP émet pareil.

### Volet 2 — le modèle de concurrence (comment les sessions coexistent)

Trois options, à départager par la maquette et l'architecte :

- **A. Un seul run supervisé par dépôt (pilote unique).** On garde l'invariant. Simple ;
  aucune visibilité sur les sessions parallèles.
- **B. Un journal par worktree, agrégé par le board.** Chaque session ouvre son run ; le
  daemon surveille toutes les racines et agrège.
- **C. Des sessions concurrentes rattachées à des runs sous une racine partagée.** On
  relâche l'invariant : N sessions ouvertes, chacune attachée à un run, orphelin détecté par
  session (territoire ADR-035).

Ta direction — « n'importe quelle situation envisageable, c'est plus sage » — penche vers
**B ou C**. Le volet 0 (run ≠ session) et le volet 1 (identité) sont nécessaires **dans tous
les cas**.

### Volet 3 — la représentation sur le board **validé** (où ça vit)

Règle d'or : **en un coup d'œil**, un humain répond à « combien de sessions actives ici, que
fait chacune, sur quel run ? ». La maquette brouillon le montre côté **Activité**. Reste à
l'**intégrer dans les surfaces validées de v0.17**, sans les casser :

- **Vue d'ensemble → bloc « En cours »** : passe d'« une ligne » à « N sessions », groupées,
  étiquetées par branche/worktree, triées de façon stable (pas de saut à chaque battement).
- **Activité (Cadrage / Développement)** : les lignes de run gagnent les sessions qui y ont
  contribué.
- **Chronologie** : le point sensible. Le fil reste trié par le temps, mais chaque ligne
  devient **attribuable à une session** — un libellé de session + un **filtre « session »**
  à côté des filtres type/version existants, et/ou des **couloirs** (swimlanes) par session.
  Sans ça, les évènements de 2-3 sessions s'empilent sans qu'on sache qui fait quoi.
- **Compteurs et badges** : vérifier qu'ils tiennent (le badge « ● en run » sur une version,
  les compteurs « lancements » / « sprints », le minuteur « silence prolongé ») — par
  session, sans double compte ni ambiguïté.

### Volet 4 — une vue « hiérarchie des sessions » (suggestion PO)

Une petite vue qui montre **les sessions et leurs relations** dans la méthode : qui pilote
qui, quelles sessions sont attachées à quel run, lesquelles sont vivantes. Lens ou panneau,
à cadrer dans la maquette. Elle répond à « comment s'organisent mes sessions, là, maintenant ».

## Critères d'acceptation

- [ ] Un **ADR** tranche le **modèle** : définition de *run* vs *session*, leur lien (m:n),
      et **qui rattache** une session à un run (la méthode/ezk).
- [ ] Une **maquette** dans `docs/maquettes/` rend, et le PO valide la lisibilité d'un coup
      d'œil : (1) 1 session / 1 run ; (2) 3 worktrees, 3 sessions vivantes ; (3) 1 pilote +
      2 worktrees ; (4) un orphelin à côté de 2 vivants ; (5) plusieurs projets multi-sessions ;
      **(6) la Chronologie avec sessions concurrentes** (libellé + filtre/couloir par session) ;
      **(7) la vue hiérarchie des sessions**.
- [ ] Chaque run/session porte un **libellé humain** (branche/worktree/session), **jamais**
      le seul identifiant opaque.
- [ ] L'ADR dit **comment l'intégration dans le board validé** se fait, surface par surface
      (En cours, Activité, Chronologie, compteurs, badges) **sans casser** la maquette v0.17.
- [ ] **Tool-agnostique prouvé** : l'émission et l'identité de session marchent pour **tout
      outil LLM parlant MCP** (ex. Cursor, Codex CLI), via `.git/HEAD` (pur FS) et un id frappé
      par l'émetteur — **aucune dépendance à une API propre à Claude**. Le croisement de
      transcripts Claude Code (`analyze.ts`) est explicitement **hors périmètre** (diagnostic
      optionnel, pas le board ni le contrat).
- [ ] Les **tranches de build** sont découpées en fiches sœurs et liées, **sans chapeau**
      (identité émetteur = mega-city ; représentation board = cop1) ; le dossier vit dans l'ADR.

## Comment vérifier

1. Ouvrir la maquette [docs/maquettes/board-runs-concurrents.html](../docs/maquettes/board-runs-concurrents.html)
   dans un navigateur : les sept cas s'affichent, chacun lisible sans explication.
2. Test « nouveau venu » : une personne neuve regarde le cas (2) et le cas (6) et dit, en une
   phrase chacun, combien de sessions tournent / que fait chacune — sans cliquer, sans jargon.
3. Aucune carte ni ligne de chronologie n'affiche un identifiant nu comme seule identité.
4. L'ADR existe sous `docs/adr/`, définit run vs session, tranche le modèle de concurrence
   (A/B/C), dit l'intégration surface par surface, et est référencé par cette fiche.
5. L'ADR décrit un chemin d'émission **sans Claude** (un outil MCP tiers ouvre une session,
   l'identité vient de git) ; rien dans le board ni le contrat ne dépend d'une API Claude.
6. Les fiches de build (émetteur, board) existent comme sœurs, liées par `milestone` +
   `version`, sans fiche chapeau.

## Notes / décisions

- **Le cœur, c'est le modèle (volet 0).** Tant que run et session ne sont pas séparés, toute
  représentation concurrente reste bancale. L'affichage (volets 3-4) en découle.
- **Tout le reste de l'app doit tenir** sous concurrence, pas seulement l'activité : la
  Chronologie, la Vue d'ensemble, les compteurs, les badges « en run », le minuteur de
  silence. C'est un critère, pas un détail.
- **Maquette (brouillon)** : [docs/maquettes/board-runs-concurrents.html](../docs/maquettes/board-runs-concurrents.html)
  — 5 cas côté Activité, une étiquette d'impact par cas. À compléter par le cas Chronologie
  (6) et la vue hiérarchie (7). Sert aussi à décider si une part rejoint v0.17 (impact faible)
  ou reste en v0.18 (impact fort).
- **Voisine, pas doublon** : contraint les tranches
  [activité run → moments → fiches](20261012231419211_board-activite-run-moments-fiches.md)
  et [chronologie condensée](20261012231419237_board-chronologie-condensee.md). Sujet distinct
  de [« En cours » se déduit des branches](20261013131852984_en-cours-deduit-des-branches-portier-vue.md)
  (côté branches committées, pas journal).
- **Design de référence** : [coque + vue d'ensemble](20261012231419185_board-coque-vue-ensemble.md)
  et [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ;
  maquette validée `docs/maquettes/board-ezk-dashboard.html`.
- **Garde-fou orphelin** : [ADR-035](../docs/adr/ADR-035-abandon-siege-run-orphelin.md).
  **Émetteur sans git** : [ADR-019](../docs/adr/ADR-019-worktree-location.md).
- Origine : session 2026-10-14 — analyse « plusieurs sessions et chronologie du board ». Le
  PO a soulevé : le run devient ambigu si des sessions se cumulent ; tout l'app doit tenir ;
  une vue hiérarchie des sessions serait utile ; et **ça doit marcher pour tout LLM, pas que
  Claude**. Priorité P1, version v0.18.0 décidées par le PO le 2026-10-14.
