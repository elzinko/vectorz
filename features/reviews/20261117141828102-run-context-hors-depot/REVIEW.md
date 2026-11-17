---
schema: method-review@0.1
fiche: "20261117141828102"
branch: "feat/20261117141828102-run-context-hors-depot"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "87b5e270"
status: ready-for-review
created: "2026-11-17"
---

# Review — 20261117141828102

## Résumé

GO. 2 critères prouvés par ezk-reviewer : hors du dépôt, ligne Dossier et code 0 ; dans le dépôt ou un worktree, sortie inchangée. Rebasée sur le retrait des anciens verbes : conflits de run-context résolus (githubLocalFlow retiré, sessionOutsideRepo gardé).

## Rendus

N.A.

## Matrice de validation

tests ciblés 23 ✅ · typecheck ✅ · gate complète après rebase · E2E N.A.

## À tester

cd /tmp && ezk --root <vectorz> run context --no-fetch (ligne Dossier)

## Qualité

N.A.

## Provisioning / preview

aucun

## Trouvailles

N.A.
