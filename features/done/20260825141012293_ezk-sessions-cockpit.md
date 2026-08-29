---
id: "20260825141012293"
title: "ezk-sessions — cockpit de pilotage des sessions Claude Code (worktrees × sessions × branches), avec onglet dans la map"
type: feature
priority: P1
product: mega-city
version:
epic:
status: shipped
ready: 2026-08-29
pr: "#188"
created: 2026-08-25
---

# ezk-sessions — cockpit de pilotage des sessions

## En clair

Quand on travaille avec **plusieurs sessions Claude Code en parallèle**, on perd vite le fil :
des dossiers de travail (worktrees) restent sur le disque après qu'on a archivé la session,
des branches s'accumulent alors qu'elles sont déjà fusionnées, et on ne sait plus **qui
travaille sur quoi**. Cette fiche propose un outil, `/ezk-sessions state`, qui affiche un
**tableau clair** de l'état courant, **dit quoi nettoyer**, et **alerte quand deux sessions risquent de se
percuter** (elles ont touché le même fichier).

Le tableau croise trois sources et **sort d'un script** (donc **sans coût IA** pour les
données) : les dossiers de travail git, les sessions Claude Code (archivée ou active), et
les branches. Le même tableau s'affiche aussi dans un **onglet de la map**
(`pnpm ezk:map sessions`, à côté de `pnpm ezk:map avancement`).

## Contexte / Problème

Vécu le 2026-08-25 sur le repo **muti** : 8 dossiers de travail (worktrees) en même temps,
plusieurs sessions archivées dont les dossiers **traînaient encore**, un **cimetière de
13 branches** déjà fusionnées, et le travail de backlog d'une fiche resté **coincé sur une
vieille branche**. Aucun outil ne donnait la photo d'ensemble ; il a fallu enchaîner une
dizaine de commandes git à la main pour comprendre.

Deux confusions à lever, qui sont la racine du désordre :

- **Un dossier de travail (worktree) ≠ une session Claude Code.** Archiver une session **ne
  supprime pas** son dossier git. D'où les « dossiers orphelins ».
- **Une branche fusionnée reste en local** tant qu'on ne la supprime pas, même quand son
  contenu est sur `main`. D'où le cimetière.

## Proposition (esquisse, à groomer)

Un outil `ezk-sessions` dont la première sous-commande est **`state`** :

- **Un script déterministe** collecte et **croise** trois sources — **aucun appel IA** pour
  produire les données :
  1. `git worktree list` (les dossiers de travail + la branche de chacun) ;
  2. les **sessions Claude Code** via le MCP `ccd_session_mgmt` (`list_sessions`) — titre
     donné par l'humain, archivée ou active, PR liée et son état ;
  3. `git branch` + l'état « déjà dans `main` ou non ».
- **Sortie = un tableau** : une ligne par dossier de travail / branche, colonnes
  **session (nom) · sujet · branche · PR + état · statut**, avec une **colonne « supprimable »**
  (et pourquoi : session archivée + PR fusionnée, ou branche déjà dans `main`).
- **Un encart « recommandations »** : les actions concrètes — *quoi nettoyer* (dossiers
  orphelins, branches fusionnées) et *quoi finir* (PR encore ouvertes des sujets en cours).
  C'est **le seul endroit** où l'IA intervient (un avis), jamais pour les données.
- **Option `--llm=claude`** (par défaut `claude`). On commence simple avec Claude Code seul ;
  l'option laisse la porte ouverte à d'autres outils (Cursor…) plus tard, **seulement si
  utile**.

**Onglet dans la map (faisabilité confirmée).** La map a déjà des onglets alimentés par un
script séparé — modèle `avancement` : `bin/regen-avancement.ts` génère les données,
`pnpm ezk:map avancement` les affiche. On ajoute un onglet **`sessions`** sur le **même
patron** : un `bin/regen-sessions-data.ts` (les mêmes données que la CLI) affiché par
`pnpm ezk:map sessions`. La CLI et l'onglet **partagent le même collecteur** — une seule
source de vérité.

## Pilotage & collision — décisions du 2026-08-28 (brainstorm PO)

Le cockpit n'est pas qu'un outil d'hygiène. Sa **première valeur**, c'est d'éviter que deux
sessions se percutent. Décisions actées (cadre : ADR-0042 —
`products/mega-city/docs/adr/0042-concurrence-inter-sessions-advisory-visibilite.md`) :

**1. L'alarme n°1 = l'intersection des fichiers touchés.** Deux sessions ne se gênent que si
elles visent le **même fichier**. Le détecteur croise les fichiers **non commités** de chaque
worktree (`git status` par worktree) ; une intersection non vide = collision imminente.
Fichiers **chauds** à surveiller en priorité (partagés) : l'index du backlog, `PLAN.md`, une
fiche en cours d'édition. Cas physique : deux sessions dans le **même répertoire** (même
working tree) = tout est en collision.

**2. Un worktree qui dort n'est pas « jetable ».** Croiser « session vivante ? » avec « working
tree propre ? ». Dormant + **propre** + branche fusionnée → supprimable. Dormant + **non
commité** → ⚠ **travail non sauvé, à GARDER** : ne jamais suggérer de le supprimer. Le cockpit
éclaire, il ne détruit pas. *(Corrige le penchant « nettoyage » de l'esquisse ci-dessus.)*

**3. Le type sprint / métier est une étiquette d'affichage, pas un garde-fou.** On le dérive du
**préfixe de branche** (`feat/…` = sprint) ; un marqueur `.ezk-session` **optionnel** (non
commité, dans `.gitignore`) enrichit le sujet libre. Absence de marqueur = « non précisé »,
toléré. La sécurité ne repose **pas** dessus — elle repose sur l'intersection (point 1).

**4. Visibilité plutôt qu'interdiction.** Pour les sessions **que tu supervises**, le cockpit
**avertit**, il n'interdit rien (advisory). Le garde-fou **bloquant** est réservé aux **runs
autonomes** (`ezk-product-build` en mode auto, cop1) : là, avant de démarrer un sprint, la
skill vérifie l'intersection et s'arrête (ou délègue à `ezk-pm`) si collision. Un seul
détecteur, deux réactions selon le contexte.

**5. Absorbe le besoin « Owner de PR » ([[20260812104022237]]).** « Qui tient cette PR » était
une fiche à part (P1, idea). Le cockpit y répond : il affiche déjà session × branche × PR, et
l'alarme d'intersection traite « deux sessions, même objet ». Décision PO 2026-08-28 : advisory,
pas de verrou exclusif. La fiche owner-PR est **absorbée ici**.

## Critères d'acceptation (esquisse — non ready)

- [ ] `/ezk-sessions state` affiche un tableau **dossier de travail · branche · session
      (nom + archivée/active) · PR + état · colonne supprimable**.
- [ ] Les données du tableau sortent d'un **script** — **zéro appel IA** pour les produire.
- [ ] L'outil **repère** les dossiers de travail orphelins (session archivée, plus rien
      d'actif dessus) **et** les branches déjà fusionnées dans `main`.
- [ ] Un **encart recommandations** liste les actions : quoi nettoyer, quelles PR ouvertes
      finir.
- [ ] La **même donnée** s'affiche en onglet de la map : `pnpm ezk:map sessions`, sur le
      modèle de `pnpm ezk:map avancement`.
- [ ] Option `--llm=claude` (défaut) ; l'architecture reste ouverte à d'autres outils plus tard.
- [ ] Le tableau **signale les collisions** : deux worktrees dont les fichiers non commités
      s'intersectent, avec le(s) fichier(s) en cause ; les fichiers chauds (index backlog,
      `PLAN.md`, fiche en cours) sont mis en avant.
- [ ] Un worktree **dormant avec des changements non commités** est marqué « travail non sauvé
      — garder », **jamais** proposé à la suppression.
- [ ] Le **type** (sprint / métier) est dérivé du préfixe de branche ; l'absence de marqueur
      `.ezk-session` affiche « non précisé », sans erreur.

## Comment vérifier

- **Sur un cas réel multi-worktrees** (l'état muti du 2026-08-25 en est un bon test : 8
  dossiers de travail, sessions archivées, PR ouvertes et fermées) : lancer
  `/ezk-sessions state` **et** `pnpm ezk:map sessions` → le tableau doit **classer** chaque
  ligne (active / orpheline / supprimable) et l'encart **proposer le nettoyage** exact.
- **Coût IA** : vérifier que produire le tableau **ne déclenche aucun appel LLM** (seul
  l'encart recommandations en fait un, et il est optionnel).

## Notes / décisions

- **Origine** : douleur vécue le 2026-08-25 (session muti, pilotage de multiples sessions à
  la main). Le besoin est de **piloter** plusieurs sessions d'un coup d'œil, pas de les
  dérouler.
- **Product `mega-city`** : c'est là que vivent les skills ezk, la map et les scripts `bin/`.
- **Principe maison respecté** (`bin/README.md`, ADR-0001) : *le script range, l'IA ne fait
  que juger*. Ici le script produit tout le tableau ; l'IA se limite à l'encart reco.
- **Frontière à trancher au grooming** : la famille `bin/supervision-*.ts` observe les
  **événements de la méthode** (les agents ezk qui émettent), **pas** le croisement dossier
  git ↔ session Claude Code. Vérifier au grooming si des briques sont réutilisables ou si
  c'est bien distinct — **ne pas dupliquer**.
- **Briques réutilisables** : `bin/ezk-map.ts` (onglets), `bin/regen-map-data.ts` /
  `bin/regen-avancement.ts` (patron « données d'onglet »), le MCP `ccd_session_mgmt`
  (`list_sessions`), `git worktree list` / `git branch`.
- **Suite naturelle** : une fois l'état visible, une sous-commande de **nettoyage assisté**
  (proposer les `git worktree remove` / `git branch -d` sûrs) — hors périmètre `state`.

## Grooming — 2026-08-29 (auto, ezk-product-build)

Les deux frontières laissées ouvertes au grooming sont tranchées ; DoR atteinte.

- **Frontière `bin/supervision-*.ts` → distincte, aucune duplication.** Ces scripts
  (`supervision-analyze`, `-doctor`, `-registry-add`…) lisent le **journal de supervision**
  (les runs/gates émis par les agents ezk). Ils ne croisent PAS worktree git × session
  Claude Code. Le collecteur `sessions` est une source de données différente. Rien à
  réutiliser côté supervision ; le patron à reprendre est celui de l'onglet **avancement**
  (`bin/regen-avancement.ts` + `bin/ezk-map.ts`).
- **Faisabilité « zéro IA » confirmée.** Les sessions Claude Code sont sur disque en clair :
  `~/.claude/projects/<slug-du-projet>/<uuid>.jsonl` (une session = un fichier). Un script
  déterministe les lit sans appel LLM — le critère d'acceptation « zéro appel IA » tient.
  **Seul point à nailer à l'étape archi du sprint** : le titre humain et l'état
  archivée/active ne sont pas forcément dans le `.jsonl` brut (le MCP `ccd_session_mgmt` les
  gère) ; vérifier qu'ils sont dans un fichier lisible du store, sinon dériver l'état
  « active » du `mtime` du `.jsonl` et le sujet du préfixe de branche (déjà prévu, point 3).

**État DoR** : critères d'acceptation testables ✅ · périmètre borné au sous-commande `state`
✅ · décisions de conception actées (brainstorm PO 2026-08-28 + ADR-0042) ✅ · faisabilité
confirmée ✅. **Tampon `ready` en attente du PO** (mode `--check-ready true`).
