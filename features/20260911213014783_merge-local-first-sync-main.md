---
id: "20260911213014783"
title: "Merge local-first — piloter le squash en local, garder le main local à jour, propager vers GitHub"
type: feature # feature | bug | refactor | chore | epic
priority: P0 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic) ; une épic n'en référence jamais une autre
status: ready # idea | ready | in-progress | blocked | shipped
ready: 2026-09-12 # YYYY-MM-DD — posée par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr:
evidence: none # flux git/CLI, aucun écran
created: 2026-09-11
---

# 20260911213014783 — Merge local-first : le main local mène, GitHub suit

## En clair

Aujourd'hui, quand une PR est mergée, ton main local ne bouge pas. Tu dois faire
`git switch main && git pull` à la main. Dans une autre session, tu n'as même pas de
terminal sous la main sans lancer un prompt exprès. Résultat : des worktrees en retard
sur `origin/main`, et un ménage manuel pénible à répéter à chaque fois.

On veut l'inverse. Vectorz pilote le squash-merge **en local**, garde le main local
comme référence, puis **pousse** le résultat vers GitHub. La PR se ferme, la branche
distante se nettoie, `origin/main` s'aligne sur le main local. Le sens du flux devient
**local → GitHub**, pas l'inverse. GitHub sert à voir et à sauvegarder, pas à décider
du merge.

## Contexte / Problème

Le point de merge, aujourd'hui, c'est GitHub. Le squash se fait dans l'UI GitHub, ou
piloté par un prompt côté serveur. Le main **local**, lui, n'avance jamais tout seul.

La friction vécue, à chaque merge :

- il faut un terminal, puis `git switch main && git pull` ;
- en session Claude, pas de terminal direct — il faut lancer un prompt rien que pour ça ;
- avec plusieurs worktrees, chacun peut se retrouver en retard sur `origin/main` sans le
  savoir. On travaille alors sur une base périmée. Les conflits et les regen partent d'un
  main faux.

C'est un piège déjà connu du projet : *« squash-merge qui n'avance pas le main local »*
(mémoire `ezk-worktree-friction`). La parade actuelle est manuelle et se rejoue sans fin.

Le principe visé : **travailler en local d'abord**. GitHub devient une projection
(visualisation, sauvegarde, PR pour l'historique), pas la source du merge.

## Proposition

**Tranché au grooming (architecte, 2026-09-12 — [ADR-0052](../products/mega-city/docs/adr/0052-merge-local-first-github-execute-le-squash-main-se-realigne.md)).**

La prémisse « piloter le squash en local » est **corrigée** sur le comportement réel de
GitHub. Un squash fabriqué en local puis poussé ne fait jamais voir la PR comme mergée ;
la fermer à la main la marque « closed unmerged » — la PR fantôme qu'on veut éviter. Donc :

1. **Le squash reste exécuté par GitHub, le local décide et se réaligne.** Avec remote :
   `gh pr merge <n> --squash --delete-branch`, message conventional fourni par le local
   (`--subject`/`--body`) — c'est le seul geste qui donne une PR réellement « Merged » et
   supprime la branche distante. « Local-first » se déplace : le local possède la décision,
   le message et le commit de ship ([[20260823121712781]], ADR-0049) ; GitHub exécute.
   Sans remote (pas de PR) : le squash est bien local (`git merge --squash` + commit
   conventional). Juste après le merge, `ezk-pr ship` fait **`git fetch --prune`** : comme
   les worktrees partagent les refs, ce seul fetch rafraîchit `origin/main` **pour tous**.

2. **Le main local et les worktrees se réalignent tout seuls, sans terminal.** Personne
   ne réaligne le worktree d'une autre session (ADR-0042). Chaque worktree — l'arbre
   principal qui porte `main` compris — se **fast-forward lui-même** à son prochain geste,
   via la **gate de fraîcheur existante** (`development/run-freshness-origin-main`), promue
   de « avertir » à « avertir **ou** se réaligner quand c'est sûr ». Remplace le
   `git switch main && git pull` manuel.

**Où ça vit** : **extension d'`ezk-pr ship`** pour le geste au moment du merge (fetch/prune,
fast-forward de sa propre vue, signal des worktrees en retard), et **promotion de la gate de
fraîcheur** pour l'auto-réalignement des autres worktrees. **Aucun nouveau skill** : le git
vit déjà dans `ezk-pr` (ADR-0009), `ezk-product-build` décide *quand* shipper (ADR-0001 :
le script range, le LLM décide aux bords).

**Prédicat de sûreté** (réutilisé de [[20260902224043892]] + ADR-0042) : un worktree est
auto-fast-forwardable ssi working tree **propre** ET fast-forward strict possible. Sinon :
**signal seulement**. Un worktree sale ou tenu par une session vivante n'est jamais déplacé.

**Dépendance** : l'axe 2 dépend du spike offline [[20260906122942825]] (la gate de fraîcheur
doit dégrader proprement sans remote / hors ligne).

**Frontière avec les fiches voisines** (anti-doublon) :

- [[0076]] *(shippée)* — supprime les branches locales absorbées par un squash. Elle
  range les branches, elle ne remet pas le main local à jour. Cette fiche la **réutilise**.
- [[20260902224043892]] *(idea)* — le ménage de fin de session (branches, worktrees,
  ship, reconcile). Elle range **après coup**. Cette fiche agit **au moment du merge**.
- [[20260823121712781]] — `reconcile` rattrape le **statut des fiches** après un merge
  hors flux. Voisin : le statut, pas l'état git.
- [[20260906122942825]] *(spike)* — coût d'un gate de fraîcheur offline. Matière pour
  l'axe 2 (détecter un worktree en retard).

## Critères d'acceptation

Finalisés au grooming (ADR-0052). Tous vérifiables.

- [ ] **Merge propre (remote).** `ezk-pr ship` merge via `gh pr merge --squash
      --delete-branch` avec message conventional fourni par le local. Après : `gh pr view
      <n>` rend **`MERGED`** (jamais `CLOSED` unmerged), la branche distante est supprimée.
- [ ] **Merge local (sans remote).** Sur un dépôt sans remote, le ship fait un squash
      **local** (`git merge --squash` + commit conventional) sur `main` et prune les
      branches absorbées (0076). Aucun `gh` appelé, aucune erreur.
- [ ] **Refus du chemin fantôme.** La commande ne fabrique jamais une PR « closed
      unmerged » (pas de `push` d'un squash local suivi de `gh pr close`).
- [ ] **Refresh partagé.** Après le merge, `ezk-pr ship` exécute `git fetch --prune` : tout
      worktree du dépôt voit `origin/main` à jour et la ref de branche distante mergée
      disparue — sans commande manuelle dans ces worktrees.
- [ ] **Main local réaligné, sans terminal.** La vue de la session qui a shippé, et l'arbre
      principal portant `main`, se retrouvent sur `origin/main` par **fast-forward** (jamais
      par merge), sans `git switch main && git pull` tapé à la main.
- [ ] **Auto-réalignement des worktrees en retard.** Un worktree en retard sur `origin/main`
      se **fast-forward lui-même** à son prochain geste via la gate de fraîcheur promue,
      **si et seulement si** le prédicat de sûreté est vrai ; sinon il **signale** sans agir.
- [ ] **Prédicat de sûreté respecté.** Aucune session concurrente cassée : un worktree avec
      working tree sale, ou tenu par une session vivante, n'est **jamais** déplacé — il est
      seulement signalé (ADR-0042 ; prédicat réutilisé de [[20260902224043892]]).
- [ ] **Dégradation offline.** Hors ligne ou remote injoignable, la gate de fraîcheur
      **avertit sans bloquer** (selon le spike [[20260906122942825]]).
- [ ] **Sens documenté.** Le flux « le local décide + se réaligne, GitHub exécute le
      squash » est écrit dans `ezk-pr` (GitHub = exécutant du merge + projection, le local
      garde la décision, le message et le commit de ship).
- [ ] **Gate locale verte** (`pnpm build` + `pnpm test` + `pnpm test:scripts` + lint) et DoD
      script pour tout outillage bash ajouté (prédicat de sûreté testé sur fixture jetable).

## Comment vérifier

- [ ] **Scénario deux worktrees (remote).** Depuis le worktree A : shipper une PR. Constater
      `gh pr view <n>` = `MERGED`, `git ls-remote --heads origin <branche>` vide,
      `git rev-parse main origin/main` (dans l'arbre principal) = même SHA. Depuis le
      worktree B **propre et en retard** : au geste suivant, il s'est fast-forwardé seul.
- [ ] **Worktree B sale.** Répéter avec un changement non commité dans B : B **n'est pas**
      déplacé, un signal clair dit « en retard sur origin/main, working tree sale ».
- [ ] **Sans remote.** Sur un clone sans remote : le ship squash-merge en local, prune les
      branches absorbées, `main` avance ; aucun appel `gh`.
- [ ] **Offline.** Couper le remote (ou simuler un fetch qui timeout) : la gate de fraîcheur
      avertit, le run n'est pas bloqué.
- [ ] **DoD script** : `test-*.sh` du prédicat vert sur fixture (propre → ff ; sale → signal ;
      divergent → signal ; read-only garanti).

## Notes / décisions

- **Idée capturée** (Thomas, 2026-09-11) sur la friction vécue : `git switch main &&
  git pull` manuel après chaque merge, impossible sans terminal en session parallèle,
  worktrees qui finissent en retard sur `origin/main`.
- **Type : feature**, pas `bug`. Le « retard » n'est pas un défaut d'un code existant,
  c'est une **capacité manquante**. Demandé « bug » par Thomas → reclassé feature ;
  à rebasculer si tu préfères.
- **Priorité P0 posée par le PO** (Thomas). Devient la tête du flux actionnable — aucune
  autre P0 groomée aujourd'hui.
- **Anti-doublon fait et arbitré** (PO, 2026-09-11) : fiche **distincte**, pas une fusion.
  Elle **compose** [[0076]], [[20260902224043892]], [[20260823121712781]] et le spike
  [[20260906122942825]] au lieu de les refaire.
- **Contrainte forte de Thomas** : vectorz **doit** pouvoir travailler en local. Un plugin
  de visualisation GitHub est un bonus, jamais la source de vérité.
- Recoupe la mémoire projet `ezk-worktree-friction` (frictions ezk en worktree) — matière
  de cadrage disponible pour le grooming.
- **Tranché au grooming** (architecte, 2026-09-12, ADR-0052) : la prémisse « squash en
  local » est corrigée sur le comportement réel de `gh`/GitHub — le squash reste exécuté
  par GitHub (seul chemin « Merged » propre), le local décide + se réaligne par fast-forward.
  Axe 2 = promotion de la gate de fraîcheur (advisory, prédicat de sûreté ADR-0042), dépend
  du spike [[20260906122942825]]. **DoR atteinte.**
