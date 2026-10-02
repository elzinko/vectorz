---
id: "20261002231845120"
title: BACKLOG.md ne fait plus conflit entre deux PR ouvertes en même temps
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [backlog]
status: idea
pr:
evidence: none # vue générée et outillage git, pas d'écran
created: 2026-10-03
---

# 20261002231845120 — BACKLOG.md ne fait plus conflit entre deux PR ouvertes en même temps

**En clair.** `features/BACKLOG.md` est un seul fichier, réécrit par toute PR qui ajoute ou livre
une fiche. Deux PR ouvertes en même temps le réécrivent chacune : la seconde à merger entre en
conflit, à chaque fois. Depuis que le ship voyage dans la PR (ADR-0049), **chaque** PR de story le
touche. On veut que deux PR ouvertes en même temps se mergent l'une après l'autre sans conflit.

**Si tu arrives frais.** `BACKLOG.md` est l'index du backlog, **généré** depuis les fiches par
`regen-backlog.sh`. On ne l'édite jamais à la main. L'[ADR-0055](../products/mega-city/docs/adr/0055-artefacts-generes-hors-versionnage.md)
a sorti de git les autres vues générées, mais il a **gardé** celle-ci, parce qu'on la lit sur GitHub.

## Contexte / Problème

**Le symptôme, daté.** 2026-10-03 : la PR #337 (rangement de la rétro) entre en conflit sur
`BACKLOG.md` seul. Le PO : « sans déconner, ça arrive tout le temps ». Depuis le 2026-10-01,
`BACKLOG.md` a été modifié **24 fois** sur `main`, dont 18 par des PR de fiches. Chaque conflit
coûte la même recette à la main : fusionner `main`, garder un côté, régénérer, rejouer la gate,
pousser, puis attendre la CI.

```
PR A : ajoute une fiche  → réécrit BACKLOG.md ─┐
                                                ├─→ la 2e mergée est en conflit
PR B : livre une fiche   → réécrit BACKLOG.md ─┘
```

**Pourquoi ça empire.** La fiche livrée
[« La fiche d'une story arrive en done avec son merge »](done/20261002114435782_done-par-story-a-la-validation.md)
fait entrer le commit ship, donc la régénération de `BACKLOG.md`, dans **chaque** PR de story.
Deux stories en parallèle conflicteront donc toujours.

## Proposition

C'est d'abord une **décision d'architecture**, qui révise l'ADR-0055 ou l'ADR-0052. Trois pistes :

1. **Sortir `BACKLOG.md` de git**, comme les autres vues générées. Plus aucun conflit, mais on perd
   la lecture du backlog sur GitHub.
2. **Le faire régénérer par la CI après chaque merge sur `main`.** Les PR ne le touchent plus, et il
   reste lisible sur GitHub. Mais un robot écrit alors sur `main`, ce que l'ADR-0052 interdit
   aujourd'hui (« GitHub exécute le merge, rien d'autre n'écrit sur `main` »).
3. **Réduire ce qui change dans le fichier** : retirer les lignes qui bougent à chaque fiche, comme
   les compteurs. Moins de conflits, pas zéro : deux fiches ajoutées dans la même section se
   touchent encore.

Un ADR court tranche, puis le build applique la piste choisie au ship, à `ezk-backlog add` et aux
gates.

## Critères d'acceptation

- [ ] Un ADR tranche entre les trois pistes, et dit quel ADR existant il révise.
- [ ] Un test sur dépôt jetable ouvre deux branches qui ajoutent chacune une fiche, puis les fusionne
      l'une après l'autre dans `main` : aucune ne conflicte.
- [ ] La recette « Conflit sur `BACKLOG.md` » d'`ezk-backlog` est mise à jour, ou retirée si elle
      ne sert plus.

**Mesure de suivi** — sur les 10 prochaines PR de story ou de fiche, 0 conflit sur `BACKLOG.md`.

## Comment vérifier

```bash
pnpm --dir products/mega-city test:scripts
```

- Le test de fusion de deux branches de fiches passe.
- Relire l'ADR : la piste choisie et l'ADR révisé y figurent.

## Notes / décisions

- **Suite de** la fiche livrée
  [« Décider quelles vues générées ne plus committer »](done/20260830194601376_spike-degiter-vues-outillage.md),
  qui a produit l'ADR-0055 et gardé `BACKLOG.md` versionné.
- **P1 demandée par le PO** le 2026-10-03 : le conflit touche désormais chaque PR de story.
- Le juge de la rétro du 2026-10-03 n'a pas vu ce sujet : il est apparu au merge de la PR de
  rangement (#337).
