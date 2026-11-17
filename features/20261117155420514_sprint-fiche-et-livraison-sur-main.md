---
# id : horodatage AAAAMMDDHHMMSSmmm QUOTÉ (17 chiffres > MAX_SAFE_INTEGER) posé par `add` (scripts/mint-id.sh) — nom <id>_<slug>.md
id: "20261117155420514"
title: Le skill ezk-sprint met la fiche et sa livraison sur main aux bons moments
type: chore
priority: P2
product: mega-city
milestone:
version:
labels: [sprint, methode]
status: ready
pr:
evidence: none # texte de skill et test, aucun écran
created: 2026-11-17
---

# 20261117155420514 — Le skill ezk-sprint met la fiche et sa livraison sur main aux bons moments

**En clair.** Au sprint 11 du 17 novembre, la livraison d'une fiche n'est pas arrivée dans main. La
fiche avait été créée sur la branche de session, puis la story était partie de cette branche. Après
l'intégration, la session ne suivait plus main, et le commit de livraison est resté à côté. Les
sprints 12 et 13 ont évité le piège avec deux gestes. Le skill les écrit maintenant.

**Si tu arrives frais.** En mode local (sans GitHub), une story s'intègre dans `main` par un squash
(`ezk forge integrate`). La fiche passe ensuite en `done/` par un commit de livraison (`ship`). `close`
scelle le sprint et écrit son compte rendu directement dans main.

## Contexte / Problème

Rétros des sprints 11, 12 et 13 du 17 novembre : un cas raté, puis deux cas réussis avec le geste.
La rétro 13 a posé la question au PO, et la délégation du PO l'a acceptée.

## Proposition

Deux phrases dans le skill ezk-sprint :

1. À l'étape 0, avant de couper la branche de story : une fiche créée ou groomée pendant la session
   passe d'abord dans `main`.
2. À l'étape 10, en mode local : le commit de livraison de la fiche passe dans `main` avant `close`.

## Critères d'acceptation

- [x] L'étape 0 du skill dit qu'une fiche créée pendant la session va dans `main` avant de couper la
      branche de story.
- [x] L'étape 10 du skill dit qu'en mode local le commit de livraison va dans `main` avant `close`.
- [x] Un test lit les deux phrases dans le skill.

## Comment vérifier

```bash
cd products/mega-city && pnpm exec vitest run src/__tests__/ezk-sprint-fiche-sur-main.test.ts
```

## Notes / décisions

- Créée et tirée au sprint 14 du 17 novembre. Décision par délégation du PO absent, qui avait demandé
  de répondre aux questions de la méthode. Trois cas le même jour, voir les rétros des sprints 11 à 13.

**Livraison du 2026-11-17.** Revue adverse `ezk-reviewer` : GO, 3 critères prouvés. Sa première réserve
P3 est corrigée : le test lit toute l'étape 0, jusqu'à l'étape 1. La seconde reste ouverte : le test
fige l'apostrophe courbe de la phrase.
