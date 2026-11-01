---
schema: method-review@0.1
fiche: "20261101175006022"
branch: "feat/20261101175006022-sprint-cite-worktree"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "236899df"
status: approved
created: "2026-11-01"
---

# Review — 20261101175006022

## Résumé

Revue adverse ezk-reviewer : GO, aucun bloquant. Le test « suis-je dans un worktree ? » tient depuis la racine, un sous-dossier et un worktree de l'app ; le chemin du journal concorde avec sprint.sh. Corrigés après la revue : la branche de story part toujours de main, et la reprise regarde d'abord git worktree list (une branche encore ouverte ne se rattache pas à un second worktree, rejoué sur un dépôt jetable). Ajoutés : partir de la racine, et .claude/ ignoré par git.

## Rendus

N.A.

## Matrice de validation

Gate locale (typecheck + pnpm test + test:scripts, 2336 tests)=vert ; Test de contrat du skill de sprint (29)=vert, 3 cas rouges sans la consigne ; Revue adverse=GO ; Before/after (UI)=N.A. (texte de skill et test de contrat)

## À tester

grep -n story-dans-un-worktree-dedie products/mega-city/skills/ezk-sprint/SKILL.md ; pnpm --dir products/mega-city exec vitest run src/__tests__/ezk-sprint-lifecycle-contract.test.ts

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
