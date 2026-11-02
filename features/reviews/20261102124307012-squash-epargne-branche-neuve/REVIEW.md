---
schema: method-review@0.1
fiche: "20261102124307012"
branch: "feat/20261102124307012-squash-epargne-branche-neuve"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "ebf32c57"
status: ready-for-review
created: "2026-11-02"
---

# Review — 20261102124307012

## Résumé

GO de ezk-reviewer. Le squash local épargne toute branche dont la pointe est déjà dans l'historique de la base (git merge-base --is-ancestor). Les restes de squash et la branche intégrée restent supprimés. Hors fiche, commit séparé : plan-order.test.ts ne fige plus la tête du vrai PLAN.md (rouge sur main depuis f2a118ab) — jugé sain, P2 : idéalement sa propre fiche.

## Rendus

N.A.

## Matrice de validation

Critère 1 prouvé — cas 10, fresh-session survit sans worktree. Critère 2 prouvé — cas 10, older-session survit. Critère 3 prouvé — cas 10, feat/z prunée avec la ligne pruned: qui la recrée. Critère 4 prouvé — old-absorbed (vrai reste de squash) prunée, cas 1, 8 et 10. Critère 5 prouvé — test-ship-merge.sh TOUT VERT, EXIT=0, fixture réécrite et cas neuf présents.

## À tester

bash skills/ezk-pr/scripts/test-ship-merge.sh puis pnpm gate, depuis products/mega-city

## Qualité

Garde au repli sûr : une erreur de git merge-base fait retomber sur is_absorbed, jamais épargner à tort. Compromis déclaré : une branche intégrée par avance rapide n'est plus nettoyée.

## Provisioning / preview

Aucun. Piège : un worktree neuf n'a pas features/BACKLOG.md (ignoré par git) ; deux tests de lanceur échouent tant qu'on ne l'a pas régénéré.

## Trouvailles

N.A.
