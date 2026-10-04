---
schema: method-review@0.1
fiche: "20261004074008211"
branch: "feat/20261004074008211-merge-local-ne-supprime-jamais-main"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "f87c31f5"
status: approved
created: "2026-10-04"
---

# Review — 20261004074008211

## Résumé

GO de ezk-reviewer : main, master et la cible d'origin/HEAD protégées ; chaque suppression s'imprime. Le cas 8 échoue sans le correctif. P2 corrigé (sha complet) ; P2 hors périmètre noté (remote lu sous le nom origin).

## Rendus

N.A.

## Matrice de validation

test-ship-merge (cas 1 à 8)=✅, test:scripts 34=✅, vitest 1787=✅, Revue ezk-reviewer=✅ GO, CI cloud=N.A. github off, Codex=N.A. github off

## À tester

bash products/mega-city/skills/ezk-pr/scripts/test-ship-merge.sh

## Qualité

N.A.

## Provisioning / preview

Aucun

## Trouvailles

N.A.
