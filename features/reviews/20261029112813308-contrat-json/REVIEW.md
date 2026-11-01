---
schema: method-review@0.1
fiche: "20261029112813308"
branch: "feat/20261029112813308-contrat-json"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "d99e179a"
status: approved
created: "2026-11-01"
run_id: "2026-10-30T12-25-57-418Z-21e76858"
---

# Review — 20261029112813308

## Résumé

Revue adverse ezk-reviewer : NO-GO puis GO. Premier passage : 1 bloquant (le test de contrat fabriquait trois fois la fixture git et dépassait le délai de 5 s sous la charge de la gate) et 4 points à corriger (schéma publié strict alors que le README promet qu'un champ ajouté ne casse rien ; test sur le vrai dépôt tautologique ; nommage schema_version et counts ; compte des bloquées qui incluait les parkées). Tous corrigés : fixture partagée et délai de 60 s, schéma publié tolérant (zod reste strict pour le producteur), recoupements falsifiables sur le vrai dépôt, nommage justifié en tête du module, bloquées limitées aux fiches à faire avec un test pur. Contre-revue : GO.

## Rendus

N.A.

## Matrice de validation

Gate locale (pnpm test + test:scripts, 2311 tests)=vert ; Test de contrat=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (contrat en ligne de commande)

## À tester

pnpm --dir products/mega-city exec vitest run src/__tests__/board-contract.test.ts ; pnpm --dir products/mega-city board:contract ; ezk board show --json | python3 -c 'import json,sys; d=json.load(sys.stdin); print(d["schema_version"], d["comptes"])'

## Qualité

N.A.

## Provisioning / preview

Aucun : la fixture se construit dans un dossier jetable (git requis).

## Trouvailles

- Coût d'un appel : un git merge-tree par branche locale pour les fiches en cours (préexistant) — reporté dans la fiche sœur mission control
