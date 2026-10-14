---
id: "20261014122044421"
title: "Board : des runs concurrents lisibles — donner une identité à un run et choisir comment plusieurs sessions s'affichent (design par maquette)"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.18.0
labels: [dashboard, board, ux, supervision, runs, multi-session]
status: idea
blocked:
pr:
evidence: before-after # la vue d'activité du board, avant/après plusieurs sessions concurrentes
created: 2026-10-14
---

# 20261014122044421 — Board : des runs concurrents lisibles

**En clair.** Quand plusieurs sessions travaillent sur le même dépôt, le board ne sait pas
les montrer de façon lisible. Un run n'a pas de nom parlant : deux runs concurrents
ressemblent à deux cartes jumelles, même méthode, même projet, séparées par un
identifiant illisible. Cette fiche **conçoit par maquette** deux choses d'un coup : donner
à un run une **identité lisible** (worktree, branche, nom de session), et **décider comment
le board affiche plusieurs sessions en parallèle** sans devenir incompréhensible. Elle ne
code pas encore : elle produit une **maquette validée** et une **décision gravée (ADR)**,
puis les tranches de build.

**Si tu arrives frais.** Un *run* est une session de la méthode qui écrit un journal. Un
*worktree* est une copie de travail isolée du dépôt ; tu peux en avoir plusieurs ouvertes en
même temps. Le *board* (vue d'activité, ex-« Moniteur ») lit les journaux et montre une
**carte par run**. Aujourd'hui la carte ne porte ni worktree, ni branche, ni nom de session.

## Contexte / Problème

Trois faits du code, constatés le 2026-10-14, cadrent le problème.

1. **Par défaut, tous les worktrees d'un dépôt partagent un seul journal.** Le code ramène
   tout worktree vers l'arbre principal avant d'écrire (`project-root.ts`,
   `normalizeFromWorktree`). L'échappatoire est la variable `SUPERVISION_PER_WORKTREE`.
2. **Un seul run ouvert à la fois sous une racine.** `findOpenRun` prend le run le plus
   récent et refuse `run_start` tant qu'il n'est pas clos (`runtime.ts`, invariant
   « un seul run ouvert à la fois »). Deux sessions concurrentes se bloquent donc : la
   seconde n'a pas de run, et reste **invisible** au board.
3. **Un run n'a pas d'identité parlante.** La carte se distingue par nom de méthode,
   version, `seat`, racine projet, et un `runId` opaque (horodatage + 8 caractères). **Aucun
   champ worktree, branche ou session.** Deux runs sous la même racine ont la même racine
   projet : seul le `runId` les sépare, et le tri par récence les fait **changer de place**
   à chaque battement.

Résultat : le board ne peut pas répondre d'un coup d'œil à « combien de sessions tournent
sur ce projet, et que fait chacune ? ». Soit il n'en montre qu'une (cas par défaut), soit
il montre des jumelles indistinguables.

Cette fiche **affine le board après v0.17** : la vue d'activité de v0.17 sort telle quelle,
celle-ci décide ensuite comment elle représente le parallélisme. Voir la tranche qu'elle
contraint : [Board : l'activité par run → moments → fiches](20261012231419211_board-activite-run-moments-fiches.md).

## Proposition

On procède **par maquette d'abord**, comme pour tout le board (ADR-074, conçu en 17
itérations) : on dessine, on départage avec le PO sur des exemples concrets, **puis** on
grave et on construit. La fiche porte deux volets couplés.

### Volet 1 — l'identité d'un run (côté kit émetteur, mega-city)

Ajouter à l'évènement `run.started` un ou deux champs **lisibles par un humain** :

- `worktree` : le nom du dossier de worktree (toujours disponible, lecture pur
  file-system) ;
- `branch` : la branche git courante, lue **sans lancer `git`** (lecture directe de
  `.git/HEAD`, car l'émetteur tourne sous Claude Desktop où `git` peut manquer — contrainte
  ADR-019) ; dégrade proprement si détachée ou absente ;
- `session_label` *(optionnel)* : un libellé humain (titre de session, objectif).

**Contrainte** : au moins un libellé parlant est présent et affiché. Le board ne montre
**jamais** le seul `runId`.

### Volet 2 — le modèle de concurrence (le choix à trancher)

Trois options, à départager par la maquette et un avis architecte :

- **A. Un seul run supervisé par dépôt (pilote unique).** On garde l'invariant actuel. Une
  session pilote la supervision, les autres tournent sans. Le plus simple ; c'est presque
  aujourd'hui. Coût : aucune visibilité sur les sessions parallèles.
- **B. Un journal par worktree, agrégé par le board.** Chaque worktree ouvre son propre run
  (per-worktree activé) ; le daemon surveille **toutes** les racines de worktree et les
  agrège. L'invariant « un seul run ouvert » tient **par worktree**. Coût : détection
  d'orphelin par worktree, et le board doit découvrir/fusionner plusieurs racines.
- **C. Des runs concurrents sous une racine partagée.** On relâche l'invariant : N runs
  ouverts sous une racine, indexés par identité, détection d'orphelin par run. Le plus
  souple (toute situation représentable), mais le plus gros changement de l'émetteur
  (territoire ADR-035).

Ta direction : « n'importe quelle situation envisageable, c'est plus sage ». Ça pointe vers
**B ou C**, pas A seul. Le **volet 1 (identité)** est nécessaire dans **tous les cas** : il
est la première brique à construire, quel que soit le modèle retenu.

### Volet 3 — la représentation lisible sur le board (la maquette)

Règle d'or : **en un coup d'œil**, un humain répond à « combien de sessions actives ici, et
que fait chacune ? » sans cliquer. D'où des **contraintes de représentation** :

- grouper par projet, puis une carte par run, étiquetée par branche (ou worktree) + nom de
  session — jamais par `runId` nu ;
- un **tri stable** : deux cartes jumelles ne changent pas de place à chaque battement
  (départage par identité / heure de début, pas seulement par récence d'absorption) ;
- un **plafond** : au-delà de N runs concurrents, regrouper et montrer le compte, déplier à
  la demande ;
- distinguer nettement vivant / au jalon / silence prolongé / orphelin entre runs
  concurrents.

## Critères d'acceptation

- [ ] Une **maquette** dans `docs/maquettes/` rend au moins ces cas concrets, et le PO valide
      qu'elle se lit d'un coup d'œil :
      (1) 1 session / 1 run (inchangé) ;
      (2) 3 worktrees, 3 runs vivants sur le même dépôt ;
      (3) 1 session pilote + 2 worktrees (ou 3 pairs, selon le modèle) ;
      (4) un run en silence prolongé / orphelin à côté de 2 vivants ;
      (5) deux projets, chacun avec plusieurs sessions.
- [ ] Dans la maquette, chaque run porte un **libellé humain** (branche/worktree/session),
      **jamais** le seul `runId`.
- [ ] Un **ADR** grave : (a) les champs d'identité ajoutés à `run.started` ; (b) le modèle de
      concurrence retenu (A / B / C) ; (c) les règles de groupement, de tri stable et de
      plafond du board.
- [ ] Le design dit **comment l'émetteur sans `git`** obtient l'identité (lecture pur FS de
      `.git/HEAD`, repli sur le nom de worktree).
- [ ] Les **tranches de build** sont découpées en fiches sœurs et liées, **sans chapeau**
      (identité émetteur = mega-city ; représentation board = cop1) ; le dossier vit dans
      l'ADR.

## Comment vérifier

1. Ouvrir la maquette [docs/maquettes/board-runs-concurrents.html](../docs/maquettes/board-runs-concurrents.html)
   dans un navigateur : les cinq cas s'affichent, chacun lisible sans explication.
2. Test « nouveau venu » : une personne neuve regarde le cas (2) et dit, en une phrase,
   combien de sessions tournent et ce que fait chacune — sans cliquer, sans jargon.
3. Aucune carte n'affiche un `runId` nu comme seule identité.
4. L'ADR existe sous `docs/adr/`, tranche le modèle (A/B/C) et est référencé par cette fiche.
5. Les fiches de build (émetteur, board) existent comme sœurs, liées par `milestone` +
   `version`, sans fiche chapeau.

## Notes / décisions

- **Maquette (brouillon)** : [docs/maquettes/board-runs-concurrents.html](../docs/maquettes/board-runs-concurrents.html)
  — les 5 cas, avec une étiquette d'impact par cas (faible / moyen / fort). Sert à décider
  si la fiche rejoint v0.17 (si l'impact est faible) ou reste en v0.18 (si fort). À valider
  par le PO avant de graver l'ADR.
- **Voisine, pas doublon** : contraint la tranche
  [Board : l'activité par run → moments → fiches](20261012231419211_board-activite-run-moments-fiches.md)
  et [Board : la chronologie condensée](20261012231419237_board-chronologie-condensee.md).
  Sujet distinct de [« En cours » se déduit des branches](20261013131852984_en-cours-deduit-des-branches-portier-vue.md),
  qui calcule l'état depuis les **branches committées** (côté portier), pas depuis le
  **journal de supervision**.
- **Design de référence** du board : [Unifier les tableaux de bord](20261012231419185_board-coque-vue-ensemble.md) et [ADR-074](../docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md).
- **Garde-fou orphelin** à respecter dans le choix du modèle :
  [ADR-035](../docs/adr/ADR-035-abandon-siege-run-orphelin.md) (abandon d'un run orphelin).
- **Contrainte émetteur sans git** : [ADR-019](../docs/adr/ADR-019-worktree-location.md)
  (le kit lit le file-system, ne lance pas `git`).
- Origine : session 2026-10-14 — analyse « plusieurs sessions ouvertes et chronologie du
  board », qui a trouvé le run sans identité et l'invariant « une seule place ».
- Priorité P1 et version v0.18.0 (refonte du board **après** v0.17) décidées par le PO le
  2026-10-14.
