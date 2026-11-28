---
id: "20261128120000210"
title: "Exploration : la simulation d'intégration (--dry-run) n'écrit rien et rend le même verdict que la vraie fusion"
type: feature
priority: P3
product: mega-city
milestone:
version:
labels: [theme:outillage-methode, origine:retro-2026-11-28]
status: idea
blocked:
depends: []
pr:
evidence: none
created: 2026-11-28
---

# 20261128120000210 — Exploration : la simulation d'intégration (--dry-run) n'écrit rien et rend le même verdict que la vraie fusion

**En clair.** Trois notes du carnet, du 14 octobre au 15 novembre, montrent que la simulation de `ezk forge integrate` ment. Une fois elle a écrit le squash. Une fois elle a dit « propre » alors que la vraie fusion était impossible. Une fois le guichet `ezk` a avalé l'option avant le script. Cette exploration établit les cas exacts et ce qu'il faut corriger.

## Contexte / Problème

- 14 oct. : `--dry-run` a fait avancer `main` (le squash a été écrit).
- 14 oct. : le guichet `ezk` capte `--dry-run` comme sa propre option ; le script ne le voit pas.
- 15 nov. : depuis un dossier de travail, la simulation dit « merge propre » ; la vraie fusion échoue, car `main` est sorti dans un autre dossier.

## Proposition

Écrire un test qui compare simulation et vraie fusion sur trois cas : depuis un dossier de travail, avec un conflit, avec une branche déjà intégrée. Noter les écarts et proposer les corrections en fiches.

## Critères d'acceptation

- [ ] Les trois cas sont reproduits par un test, qui dit pour chacun si la simulation écrit et si son verdict diffère.
- [ ] Chaque écart trouvé a une fiche de correction ou une raison écrite de ne pas corriger.

## Comment vérifier

- Lancer le test d'exploration : il imprime un tableau cas → écrit ? → verdict identique ?

## Hors périmètre

- Corriger les écarts dans la même story.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
