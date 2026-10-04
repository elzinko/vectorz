---
schema: method-review@0.1
fiche: "20261004192802897"
branch: "feat/20261004192802897-cockpit-menu-projets"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "c41cf956"
status: approved
created: "2026-10-04"
---

# Review — 20261004192802897

## Résumé

GO de ezk-reviewer : rien ne lit ni n'écrit hors des projets du registre, la barre échappe tout, le pouce garde sa garde. Correctifs appliqués : retour après un choix sans caractère de contrôle ni autre origine (une tabulation menait ailleurs), choix périmé visible avec un lien de retour, cookie propre au port, coques inchangées sans choix. Écartés avec raison : /projet en POST, cache du registre.

## Rendus

N.A.

## Matrice de validation

cockpit.test=✅, project-root-bins.test=✅, vitest 1824=✅, test:scripts 36=✅, typecheck=✅, Revue ezk-reviewer=✅ GO, Before/after=✅, CI cloud=N.A. github off, Codex=N.A. github off

## À tester

pnpm --dir products/mega-city vitest run src/__tests__/cockpit.test.ts src/__tests__/project-root-bins.test.ts ; ezk dashboard puis choisir un projet dans la barre

## Qualité

N.A.

## Provisioning / preview

Inscrire les projets avec ezk supervision registry-add, ou EZK_COCKPIT_REGISTRY pour un registre d'essai

## Trouvailles

N.A.
