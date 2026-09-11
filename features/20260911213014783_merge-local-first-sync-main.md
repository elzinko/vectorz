---
id: "20260911213014783"
title: "Merge local-first — piloter le squash en local, garder le main local à jour, propager vers GitHub"
type: feature # feature | bug | refactor | chore | epic
priority: P0 # P0 | P1 | P2 | P3
product: mega-city # obligatoire dans ce monorepo — vectorz | mega-city | …
epic: # optionnel — id de la fiche épic parente (type: epic) ; une épic n'en référence jamais une autre
status: idea # idea | ready | in-progress | blocked | shipped
ready: # YYYY-MM-DD — posée par le gate `ready <id>` (DoR complète) ; vide = non groomée
pr: # ex. "#123" quand une PR existe
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

Idée non tranchée — à départager au grooming avec l'architecte. Deux axes, idéalement
les deux ensemble :

1. **Le merge est piloté en local.** Une commande fait le squash de la branche de fiche
   en un commit conventional **sur le main local**, met le main local à jour, puis
   propage vers GitHub : `git push origin main`, PR marquée mergée/fermée, branche
   distante supprimée, prune.
   - Point à spiker : comment GitHub **ferme proprement** la PR quand le merge est fait
     en local. Pousser un squash local sur `main` ne « merge » pas forcément la PR aux
     yeux de GitHub. Il faudra peut-être `gh pr merge --squash` côté serveur puis
     fast-forward local, ou un `gh pr close` explicite « merged locally ». Le
     comportement exact est à vérifier, pas à supposer.

2. **Le main local et les worktrees se resynchronisent tout seuls après un merge.**
   Quel que soit le chemin de merge, un mécanisme met le main local à jour (fetch +
   fast-forward) et **resynchronise ou signale** les worktrees en retard. Sans terminal
   manuel. Déclenché par la méthode : au démarrage de session, par une commande, ou par
   un hook.

**Où ça vit** : sans doute une extension d'`ezk-pr` (le merge et le ship des PRs), à
composer avec les briques voisines plutôt qu'à les refaire. À trancher au grooming.

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

Initiaux — à finaliser au grooming (l'idée n'est pas mûre).

- [ ] Après un merge, le **main local avance** sans `git switch main && git pull` manuel.
- [ ] Un worktree en retard sur `origin/main` est **détecté puis resynchronisé** (ou au
      moins signalé sans ambiguïté), sans ouvrir un terminal à la main.
- [ ] Le squash-merge peut être **piloté depuis la méthode**, en local, pas seulement
      depuis l'UI GitHub.
- [ ] Après le merge : la **PR est fermée**, la **branche distante supprimée**, et
      `origin/main` est identique au `main` local.
- [ ] Le sens **local → GitHub** est documenté (GitHub = projection, pas source du merge).
- [ ] Aucune session concurrente cassée : ne touche pas un worktree tenu par une session
      vivante (réutiliser le prédicat de sûreté de [[20260902224043892]]).
- [ ] Gate locale verte (typecheck / lint / tests) et DoD script si de l'outillage est ajouté.

## Comment vérifier

- [ ] Scénario à deux worktrees : merger une PR depuis le premier, constater que le main
      local avance **et** que le second worktree se resynchronise ou est signalé — sans
      terminal manuel.
- [ ] Après un merge piloté en local : `gh pr view <n>` rend *merged/closed*,
      `git ls-remote --heads origin <branche>` est vide, et `git rev-parse main origin/main`
      renvoie le même SHA.
- [ ] Détail restant à définir au grooming.

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
