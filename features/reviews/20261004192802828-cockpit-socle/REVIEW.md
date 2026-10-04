---
schema: method-review@0.1
fiche: "20261004192802828"
branch: "feat/20261004192802828-cockpit-socle"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "cd852acb"
status: approved
created: "2026-10-04"
---

# Review — 20261004192802828

## Résumé

GO de ezk-reviewer au premier passage. L'ADR-0062 décrit le comportement réel ; les tests sur le vrai manifeste et la suite bash échoueraient sans le changement. 4 P2 traités (liens de fiches, conseil du daemon déplacé, droit d'exécution, git absent noté). Cas voisin hors périmètre (config show refusé sans features/) ajouté à la fiche du bug ezk config.

## Rendus

N.A.

## Matrice de validation

test-supervision-registry-add=✅, ezk-manifest.test=✅, vitest 1791=✅, test:scripts 36=✅, typecheck=✅, Revue ezk-reviewer=✅ GO, CI cloud=N.A. github off, Codex=N.A. github off

## À tester

bash products/mega-city/bin/test-supervision-registry-add.sh ; pnpm --dir products/mega-city vitest run src/__tests__/ezk-manifest.test.ts ; ezk --root ~/git/bacasable/cop1-cobaye config show

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
