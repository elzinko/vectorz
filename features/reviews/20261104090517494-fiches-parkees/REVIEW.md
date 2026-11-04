---
schema: method-review@0.1
fiche: "20261104090517494"
branch: "feat/20261104090517494-fiches-parkees"
product: "cop1"
method:
  name: "ezk-sprint"
  version: "4423cc3d"
status: approved
created: "2026-11-04"
run_id: "2026-11-04T09-07-25-962Z-0e3680b2"
---

# Review — 20261104090517494

## Résumé

Revue adverse ezk-reviewer : GO. La règle isParked est dédupliquée sans changement de comportement (prédicat identique aux trois copies retirées). Le daemon lit parkee publié par la méthode, jamais milestone (ADR-086). L'extension du type FicheStatus couvre les trois cartes exhaustives, typecheck vert. Non bloquant : parkee est requis par le schéma v1 alors que le daemon tolère son absence ; double ligne vide cosmétique.

## Rendus

N.A.

## Matrice de validation

Gate locale : 2322 tests et 48 suites de scripts verts ; mission control 811 tests ; page web 181 tests ; typecheck vert ; vérification navigateur avant et après

## À tester

Vue Fiches de vectorz : Idées 18, égal à la Vue d'ensemble ; la bascule montrer les parkées (85) fait apparaître la colonne Parkées

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
