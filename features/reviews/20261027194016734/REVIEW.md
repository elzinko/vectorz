---
schema: method-review@0.1
fiche: "20261027194016734"
branch: "fix/20261027194016734-ship-depuis-hote"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "510f4460"
status: approved
created: "2026-11-03"
run_id: "2026-11-03T17-33-20-863Z-83ef5598"
---

# Review — 20261027194016734

## Résumé

Revue adverse ezk-reviewer : GO. Ship réel rejoué depuis un clone de livestreamz (fiche à trois chiffres rangée, commit, BACKLOG de l'hôte régénéré à 51 fiches) ; check et ship partagent la règle de nom ; le loader des vues reste inchangé, sciemment ; le faux pnpm du test exige --root, que le vrai ship:fiche applique. Remarques non bloquantes : message imprécis hors dépôt git (préexistant), check ne voit plus un fichier chiffres.md sans séparateur.

## Rendus

N.A.

## Matrice de validation

Gate locale 2312 tests verts ; test-ship-in-pr.sh cas hôte ; ship-fiche 26 tests ; dry-run et add réels sur clone hôte

## À tester

Au prochain run dans un projet hôte : ezk pr ship-in-pr add --repo . --fiche-id <id> --pr <N>

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
