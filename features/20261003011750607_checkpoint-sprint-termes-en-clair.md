---
id: "20261003011750607"
title: "Le checkpoint d'ezk-sprint définit en clair les termes de chaque option"
type: chore
priority: P2
product: mega-city
milestone:
version:
labels: [sprint, lisibilite]
status: idea
pr:
evidence: none # texte de skill, pas d'écran
created: 2026-10-03
---

# 20261003011750607 — Le checkpoint d'ezk-sprint définit en clair les termes de chaque option

**En clair.** Au point d'arrêt avant fusion, le PO de muti a répondu « pas compris la problématique »
et « de quelle fusion parles-tu ? ». Le résumé proposait « fusionner malgré le statut rouge » sans
dire ce qu'est la fusion ni le statut rouge. On ajoute au skill une consigne courte : chaque option
soumise au PO dit ce qui va se passer, en mots simples, avec les termes définis.

**Si tu arrives frais.** Le checkpoint est l'arrêt obligatoire d'`ezk-sprint` avant de fusionner une
PR (étape 9). La règle globale `human-facing-lisibility` mesure les « pas compris » du PO.

## Contexte / Problème

- muti, 2026-10-02 (PR muti #271) : « fusion » (= intégrer la PR dans main) et « statut rouge »
  (= voyant `ci/local-build` posé sur la PR) n'étaient pas définis. 1 « pas compris » compté contre
  la mesure de `human-facing-lisibility` (0 sur 5 sprints).

## Proposition

Dans `skills/ezk-sprint/SKILL.md`, étape 9 : chaque option soumise au PO commence par l'effet concret
(« j'intègre la PR dans main, en un commit », « j'attends que le voyant de la vérification passe au
vert »). Les termes techniques (merge, statut, gate) sont définis à leur première apparition dans le
message. Renvoi à la règle, pas de recopie.

## Critères d'acceptation

- [ ] L'étape 9 d'`ezk-sprint` porte la consigne et renvoie à `human-facing-lisibility`.
- [ ] Un test de contrat sur le texte du skill vérifie la présence de la consigne.
- [ ] 0 « pas compris » du PO sur les 5 prochains checkpoints (mesure de la règle).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
```

## Notes / décisions

- 2026-10-03 : née de la rétro muti docs/captures/2026-10-03-retro-fps-auto-adaptatif.md (dépôt muti), retenue (choix délégué par le PO au pilote). Pas de
  nouvelle règle : c'est la même règle de lisibilité qui récidive (avis du juge).
