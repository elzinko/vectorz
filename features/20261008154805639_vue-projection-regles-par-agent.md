---
id: "20261008154805639"
title: Vue de projection par projet — chaque agent/skill avec ses règles dépliées
type: feature
priority: P2
product: mega-city
milestone:
version:
labels: [observabilite]
status: idea
pr:
evidence: none
created: 2026-10-08
---

# 20261008154805639 — Vue de projection par projet

**En clair.** Aujourd'hui on ne peut pas lire, en un seul endroit, un agent **avec les règles
qu'il applique vraiment**. `bind` dépose le rôle de l'agent d'un côté et **toute** la loi du
projet dans `.iamthelaw/ENTRY.md` de l'autre. On veut une **vue de projection** par projet : pour
chaque agent/skill, les règles qu'il applique, telles que déployées. Lecture seule.

**Si tu arrives frais.** `bind` matérialise la méthode dans un projet (`.claude/agents/<id>.md`,
`.iamthelaw/ENTRY.md`). *Projeter* = montrer l'état effectif (rôle + règles dépliées) d'un
consommateur, sans recompiler.

## Contexte / Problème

- `bind` écrit le rôle de l'agent et, séparément, **toutes** les règles du projet dans
  `ENTRY.md` (niveau projet, pas par agent).
- Donc nulle part « `ezk-dev` **avec ses** règles » en un endroit lisible. Et un projet comme
  muti n'est même pas bindé (dossier `.rules/` maison).
- Conséquence : difficile de constater « ce que cet agent applique vraiment » — exactement ce qui
  freine le pilotage.

## Proposition

- Une vue **lecture seule** depuis le **graphe compilé** (`.ezk/graph.compiled.json`),
  **jamais** de recompilation (borne ADR-0040 D5).
- **Version minimale** : les règles par agent depuis les arêtes actuelles (peut précéder F1).
- **Version riche** : règles **dépliées** + appartenance à un contrat (DoD/DoR) — **après
  F1/F2** (plus de choses à projeter).
- Pas d'UI web tant que la douleur n'est pas prouvée : un rendu lisible (terminal/markdown)
  suffit.

## Critères d'acceptation

- [ ] Une commande/vue liste, pour un projet donné, **chaque agent/skill** avec les règles qu'il
      applique.
- [ ] **Lecture seule** : lit le graphe compilé, ne recompile rien.
- [ ] La version minimale fonctionne sur les arêtes actuelles (sans attendre F1).

## Comment vérifier

```bash
pnpm --dir products/mega-city test
# lancer la vue et constater agent → règles pour un projet donné
```

## Notes / décisions

- **Pas d'ADR** : lecture pure du graphe compilé (ADR-0040) ; au plus une ligne en
  « Conséquences » de 0040.
- Avis : `ezk-architect` GO (risque faible, valeur opérateur) ; `ezk-pm` **P2, différée**
  (douleur non prouvée aujourd'hui). Valeur croît après F1
  (20261008154803440_consommateur-cite-un-bundle.md) et F2
  (20261008154804532_dod-dor-contrat-partage.md).
