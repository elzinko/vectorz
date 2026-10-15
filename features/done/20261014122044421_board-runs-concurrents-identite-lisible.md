---
id: "20261014122044421"
title: "Board : runs et sessions concurrents — distinguer le run (travail de méthode) de la session (LLM), les rendre lisibles et tool-agnostiques (design par maquette)"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.23.0
labels: [dashboard, board, ux, supervision, runs, multi-session, multi-llm]
status: shipped
blocked:
pr: "local (maquette fe287dac, ADR-079 e4a80b39)"
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

Six faits du code et de l'usage, constatés le 2026-10-14, cadrent le problème.

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
6. **Les sessions ne se ressemblent pas** (usage PO). Une session de **grooming** crée des
   fiches et les **cristallise** en fin de course — une *fiche* = la *user story* / l'*issue*
   de la méthode (terme à figer dans l'ADR). Une session de **dev** tient un sprint. Il y a de
   la **hiérarchie** (un pilote lance des filles) ou pas. Et il arrive qu'une session **ne
   passe pas par la méthode** — à éviter.

Résultat : le board ne peut pas répondre d'un coup d'œil à « combien de sessions tournent
sur ce projet, que fait chacune, et à quel travail de méthode elles contribuent ? ». Et ce
doit tenir pour tout outil LLM, pas seulement Claude.

Cette fiche **affine le board après v0.17** : la vue Activité et la Chronologie de v0.17
sortent telles quelles, celle-ci décide ensuite comment elles représentent le parallélisme.
Elle contraint les tranches [Board : l'activité par run → moments → fiches](../20261012231419211_board-activite-run-moments-fiches.md)
et [Board : la chronologie condensée](../20261012231419237_board-chronologie-condensee.md).

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

### Volet 1bis — le rattachement : explicite, jamais deviné (PO, ADR-079 D3)

Une session est rattachée à un chantier (run) **seulement quand on l'a dit** — jamais par
co-présence dans un projet. Deux voies :

- **Piloté** : une session pilote lance les ouvrières et leur **passe la clé** du chantier.
- **À la main** : une **étape d'accueil** à l'ouverture (crochet `CLAUDE.md` + skill
  d'ouverture) lit les chantiers ouverts + la version/le sprint en cours et **propose**
  rattachement ou autonome ; l'humain confirme, une règle de config peut auto-confirmer les cas
  clairs, sinon la session est **autonome** (ou « hors méthode », cas 7B).

Garde-fous : advisory (pas un verrou), **ne bloque jamais**, **dégrade en autonome**,
**débrayable par config**. Tool-agnostique : vit côté méthode, pas dans un IDE.

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

- **Vue globale (tous projets)** : **piste 1 retenue** (décision PO du 2026-10-14) — une **vue
  d'accueil « Tous les projets »** montre la flotte (chaque projet, ses sessions, leur état), on
  clique pour entrer dans le board d'un projet (inchangé), et la **liste déroulante reste un
  raccourci**. Écartées : rail persistant (piste 2), déroulante enrichie (piste 3). Le board
  validé choisissait un seul projet par déroulante — insuffisant pour voir la flotte (cas 5).
  Maquette cas 8.
- **Vue d'ensemble → bloc « En cours »** : passe d'« une ligne » à « N sessions », groupées,
  étiquetées par branche/worktree, triées de façon stable (pas de saut à chaque battement).
- **Activité (Cadrage / Développement)** : les lignes de run gagnent les sessions qui y ont
  contribué.
- **Chronologie** : **piste retenue = D + B combinés** (décision PO du 2026-10-14), une
  navigation à **3 niveaux**. (1) Les **runs**, vue globale, peu de détail. (2) Un **run** :
  ses sessions (liste avec hiérarchie) + son **fil fusionné** (tous ses évènements, étiquetés
  par session). (3) Une **session** : son **propre fil**. Le menu de gauche fait double emploi,
  liste des sessions **et** filtre : « Tout le run » = niveau 2, une session = niveau 3.
  Écartées : A (fil unique, trop dense) et C (couloirs, tient mal au-delà de 3-4 sessions).
- **Compteurs et badges** : vérifier qu'ils tiennent (le badge « ● en run » sur une version,
  les compteurs « lancements » / « sprints », le minuteur « silence prolongé ») — par
  session, sans double compte ni ambiguïté.

### Volet 4 — une vue « hiérarchie des sessions » (suggestion PO)

Une petite vue qui montre **les sessions et leurs relations** dans la méthode : qui pilote
qui, quelles sessions sont attachées à quel run, lesquelles sont vivantes. Lens ou panneau,
à cadrer dans la maquette. Elle répond à « comment s'organisent mes sessions, là, maintenant ».

## Critères d'acceptation

- [x] Un **ADR** tranche le **modèle** : définition de *run* vs *session*, leur lien (m:n),
      et **qui rattache** une session à un run (la méthode/ezk). →
      [ADR-079](../../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) (Proposé, à ratifier
      en panel ; modèle de concurrence B recommandé, B vs C au panel).
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
- [ ] **Rattachement par défaut** : supervision activée ⇒ une session ouverte s'y rattache
      sans geste (opt-out), **débrayable** par config projet ou demande explicite ; une session
      « hors méthode » est visible comme telle (cas 7B).
- [ ] La **Chronologie retenue** (D+B, navigation à 3 niveaux : runs → run+sessions → session)
      est validée sur maquette, puis portée par l'ADR surface par surface.
- [ ] Les **tranches de build** sont découpées en fiches sœurs et liées, **sans chapeau**
      (identité émetteur = mega-city ; représentation board = cop1) ; le dossier vit dans l'ADR.

## Comment vérifier

1. Ouvrir la maquette [docs/maquettes/board-runs-concurrents.html](../../docs/maquettes/board-runs-concurrents.html)
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
- **ADR** : [ADR-079 — Run et session, deux entités distinctes](../../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md)
  (**Accepté** le 2026-10-15 — ratifié en panel adverse le 2026-10-14, **modèle B**, corrections
  intégrées). Il grave : run (chantier) ≠ session (ouvrier), la jointure par l'évènement, la
  **clé de chantier** (version+milestone, en payload de `run.started`) comme clé d'agrégation
  (**jamais le `run_id`** ; `runDir` reste clé de stockage), le **rattachement explicite**
  (piloté ou étape d'accueil, jamais deviné), **un journal par worktree** (B), le contrat `@0.2`,
  et le read-model + la découverte des worktrees comme **travail neuf**. La **session existe déjà**
  (`ezk-sessions`, ADR-0042/0043), on la relie. Découpage de build : 5 fiches sœurs en fin d'ADR.
- **Maquette (brouillon)** : [docs/maquettes/board-runs-concurrents.html](../../docs/maquettes/board-runs-concurrents.html)
  — 8 cas : 1-5 côté Activité (étiquette d'impact chacun), **6 la Chronologie — piste retenue
  D+B, 3 niveaux** (runs → run+sessions → session), **7 la hiérarchie avec 2 variantes** (arbre ·
  groupé par run + « hors méthode »), **8 la vue globale des projets avec 3 pistes** (accueil
  « Tous les projets » · rail persistant · déroulante enrichie). Sert à départager, et à décider
  si une part rejoint v0.17 ou reste en v0.23.
- **Voisine, pas doublon** : contraint les tranches
  [activité run → moments → fiches](../20261012231419211_board-activite-run-moments-fiches.md)
  et [chronologie condensée](../20261012231419237_board-chronologie-condensee.md). Sujet distinct
  de [« En cours » se déduit des branches](20261013131852984_en-cours-deduit-des-branches-portier-vue.md)
  (côté branches committées, pas journal).
- **Design de référence** : [coque + vue d'ensemble](../20261012231419185_board-coque-vue-ensemble.md)
  et [ADR-074](../../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) ;
  maquette validée `docs/maquettes/board-ezk-dashboard.html`.
- **Garde-fou orphelin** : [ADR-035](../../docs/adr/ADR-035-abandon-siege-run-orphelin.md).
  **Émetteur sans git** : [ADR-019](../../docs/adr/ADR-019-worktree-location.md).
- Origine : session 2026-10-14 — analyse « plusieurs sessions et chronologie du board ». Le
  PO a soulevé : le run devient ambigu si des sessions se cumulent ; tout l'app doit tenir ;
  une vue hiérarchie des sessions serait utile ; et **ça doit marcher pour tout LLM, pas que
  Claude**. Priorité P1 décidée par le PO le 2026-10-14.
- **Version v0.23.0** (PO, 2026-10-15) : d'abord rangée en v0.18, **re-slottée en v0.23** après
  synchronisation avec `main` — une session de planning y avait déjà pris v0.18→v0.22 (v0.18 = « La
  CLI se tient »). Le lot multi-sessions vient **après le board v0.17**. Aucun doublon : le design
  (ADR-079) était neuf, absent de main.
