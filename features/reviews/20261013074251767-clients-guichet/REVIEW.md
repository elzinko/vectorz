---
schema: method-review@0.1
fiche: "20261013074251767"
branch: "feat/20261013074251767-clients-guichet"
product: "mega-city"
method:
  name: "ezk-sprint"
  version: "8d2d2f93"
status: approved
created: "2026-10-13"
---

# Review — 20261013074251767

## Résumé

Revue adverse : GO. check.sh (ezk-archive) ne lance plus aucun gh en github:false (pas meme gh auth status ; detection avant tout gh) et dit 'PR sans objet : GitHub coupe par la config' ; reconcile passe par ezk forge changes --merged (off -> sans objet) ; cliquet forge-gh-ratchet refuse tout nouveau gh pr list hors liste ; config.example promet 'aucun appel a l'API GitHub (gh)'. Teste sur depot jetable (off=0 gh, config absente=gh appele), cliquet vert, gate complete verte. 1 constat faible gravite : check.sh ne gate que le github:false franc (granulaire via guichet) ; cliquet matche la chaine gh pr list (un peu strict sur les commentaires, mais sur).

## Rendus

N.A.

## Matrice de validation

Gate locale=vert ; Revue adverse=GO ; Before/after (UI)=N.A. (terminal)

## À tester

cf. Comment verifier : check.sh en github:false -> sans objet + zero gh ; pnpm test (cliquet)

## Qualité

N.A.

## Provisioning / preview

Aucun : teste sur dossier git jetable + gh factice.

## Trouvailles

N.A.
