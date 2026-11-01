---
schema: method-review@0.1
fiche: "20261101215342537"
branch: "feat/20261101215342537-ezk-law-show"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "ad3eef1c"
status: approved
created: "2026-11-01"
---

# Review — 20261101215342537

## Résumé

Revue adverse ezk-reviewer : GO, cinq critères prouvés, comptes réels identiques à la mesure manuelle (96 / 10 / 0 / 17 / 50 / 19), ezk-sprint porte ses 7 règles. Trois constats non bloquants, corrigés : un titre « ## <id> » dans un bloc de code ne compte plus comme règle installée (test ajouté, rouge avant) ; un test garde désormais les règles héritées par extends (bundle et profil) ; la fonction tolerant() recopiée est remplacée par l'export de contract-files.ts, une fois ce fichier libéré par l'autre session. La branche intègre main, avec le contrat config-show de la session fix, sans conflit.

## Rendus

N.A.

## Matrice de validation

Gate de la méthode (2365 tests)=vert ; Contrat law-show=à jour ; Contrat board-show=à jour ; Essai réel=96 règles, 10/0/17/50/19 ; Revue adverse=GO ; Before/after=N.A. (commande sans écran)

## À tester

ezk law show ; ezk law show --json | jq .comptes ; ezk law show --json | jq '.objets[] | select(.id == "skill:ezk-sprint") | .regles'

## Qualité

N.A.

## Provisioning / preview

N.A.

## Trouvailles

N.A.
