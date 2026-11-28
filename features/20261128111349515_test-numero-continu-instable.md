---
id: "20261128111349515"
title: "Le test du numéro continu de sprint échoue une fois sur cinq"
type: bug
priority: P1
product: mega-city
milestone: qualite
version:
labels: [sprint, tests]
status: ready
blocked:
depends: []
pr:
evidence: none # un test et un script, aucun écran
created: 2026-11-28
---

# 20261128111349515 — Le test du numéro continu de sprint échoue une fois sur cinq

**En clair.** Un test du cycle de sprint vérifie que le compte rendu porte le bon numéro. Il a échoué une
fois sur cinq passages, sans changement de code. Un test instable fausse la gate de chaque story : on
trouve la cause et on la corrige.

**Si tu arrives frais.** À la clôture d'un sprint, `sprint.sh close` écrit un compte rendu et lui donne un
numéro continu : le nombre de comptes rendus connus, plus un. L'écriture du compte rendu est « au mieux » :
si elle échoue, le sprint reste clos et la clôture ne dit rien de plus qu'un avertissement.

## Contexte / Problème

Constaté le 28 novembre, à l'intégration de la fiche « Le sprint se publie avec son numéro continu, son but
et sa branche ». Dans `skills/ezk-sprint/scripts/test-sprint-lifecycle.sh`, le cas S14 attend « compte
rendu du sprint 6 ». Un passage sur cinq, la ligne manque. Hypothèse du pilote : sous charge, un compte
rendu d'un cas précédent ne s'écrit pas, et le compte se décale d'un cran. La revue adverse avait déjà noté
que la lecture fait confiance au numéro écrit, sans le recalculer.

## Proposition

1. Reproduire l'échec : rejouer la suite en boucle, sous charge, jusqu'à l'obtenir, et lire pourquoi le
   compte rendu attendu manque.
2. Corriger la cause, pas le test : si un compte rendu « au mieux » peut ne pas s'écrire, la clôture le dit
   clairement et le numéro suivant ne réutilise pas un numéro déjà donné.
3. Si la cause est dans le test lui-même (ordre, horloge, dossier partagé), le rendre déterministe.

## Critères d'acceptation

- [ ] La cause de l'échec est écrite dans cette fiche, avec la preuve.
- [ ] La suite `test-sprint-lifecycle.sh` passe vingt fois de suite, dont dix sous charge.
- [ ] Un compte rendu qui ne s'écrit pas laisse une ligne d'avertissement lisible à la clôture.
- [ ] Aucun verdict de `close` ne change.

## Comment vérifier

- `for i in $(seq 1 20); do bash products/mega-city/skills/ezk-sprint/scripts/test-sprint-lifecycle.sh >/dev/null || echo "échec $i"; done`
- `pnpm --dir products/mega-city gate`

## Notes / décisions

- 2026-11-28 — Demandée par ezk-pm au checkpoint du sprint 29, à tirer en tête du sprint suivant : un test
  instable fausse la gate de chaque story.
