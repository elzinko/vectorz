---
date: 2026-10-03
session: test du cycle local sur le banc cop1-cobaye (branche claude/github-workflow-user-story-276456)
type: problème
---

# En mode local, un changement de backlog n'a pas de chemin de revue

**En clair.** vectorz est passé en mode local le 2026-10-03. Le premier squash local vers `main`
ne contenait que des fiches, le plan et une ligne de config. Le garde-fou automatique de Claude
Code a refusé son push, au motif d'un « merge sans revue ». La méthode exige pourtant une revue
avant tout merge, mais ne prévoit cette revue que pour une story de code.

## Ce qui s'est passé

- Le commit `f0e93201` (branche `squash/github-local`) regroupe `.vectorz/config.yml`,
  `features/0171-adapter-github-issues-push-only.md`,
  la fiche du mode local depuis un projet hôte et `features/PLAN.md`. Les tests
  étaient verts : 1 777 tests et 34 suites de scripts.
- La règle de l'ADR-0059 dit qu'aucun merge ne se fait sans le GO d'`ezk-reviewer`. Son chemin
  est l'étape 7 d'`ezk-sprint`, pour une story. Une édition de fiches ou de plan, en mode local,
  n'a ni PR ni revue prévue.
- Le push est revenu au PO, à la main.

## Point voisin, lu dans le code et non exécuté

`ship-merge.sh --local` fait `git checkout <base>` (fonction `ship_local` de
`products/mega-city/skills/ezk-pr/scripts/ship-merge.sh`). Depuis une session en worktree, `main`
est déjà extrait dans le dossier principal, et git refuse d'extraire une branche à deux endroits.
Le merge local de la méthode ne pourrait donc pas tourner depuis un worktree. Ici, le squash a été
fait à la main, sur une branche partie d'`origin/main`.

## Constaté ensuite : le merge local a tenté de supprimer `main`

Le 2026-10-03, pendant le run `ezk-product-build`, le squash local de la fiche
`20261003200945204` a visé la branche d'intégration `squash/github-local`, puisque `main` est
extrait dans le dossier principal. `ship-merge.sh --local --base squash/github-local` a affiché :
« branche absorbée 'main' non supprimée (tenue par un worktree ?) — ignorée ». La fonction
`prune_absorbed_branches` ne protège que la base : quand la base n'est pas `main`, elle juge `main`
absorbée et lance `git branch -D main`. Seul le verrou du worktree principal l'a empêché. Le script
ne journalise pas les suppressions réussies : on ne peut pas dire après coup quelles branches il a
effacées (par construction, seulement des branches dont le contenu est déjà dans la base).
Corrigé le 2026-10-04 (squash local `80af4fbf`) :
`features/done/20261004074008211_merge-local-ne-supprime-jamais-main.md`.

## Constaté aussi : le bilan de run refuse un merge local

Le 2026-10-04, `ezk run report --no-github` a refusé les deux fiches du run, livrées en local
(`pr: local (eb8de257)` et `local (80af4fbf)`) : « PR attendue […] forme #<numéro> ». Le bilan
de fin de run n'accepte pas encore le mode local (`products/mega-city/bin/run-report.ts`).

## À juger en rétro

Quelle revue pour un changement de backlog en mode local : `ezk-reviewer` en version courte, la
relecture du PO, ou une forme « backlog » à part ? La fiche « Deux formes de PR »
(`features/20261003075821858_deux-formes-de-pr-dev-et-backlog.md`) pose déjà cette distinction
pour les PR GitHub.
