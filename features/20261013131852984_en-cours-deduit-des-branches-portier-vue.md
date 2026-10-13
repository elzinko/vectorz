---
id: "20261013131852984"
title: "« En cours » se déduit des branches, dans le portier et la vue des sessions"
type: feature
priority: P2
product: mega-city
milestone: rationalisation
version: v0.16.0
labels: [sprint]
status: ready
blocked:
pr:
evidence: auto # la vue des sessions affiche « en cours » ; décidé par le diff à la PR
split_from: "20261002130235353"
created: 2026-10-13
---

# 20261013131852984 — « En cours » se déduit des branches

**En clair.** Le statut « en cours » existe dans le schéma, mais personne ne l'a jamais écrit : aucune
des 330 fiches ne l'a porté. Le portier d'`ezk-sprint`, qui s'en sert pour repérer deux sessions sur
la même story, ne voit donc rien. On ne l'écrit pas : on le **déduit**. Une story est « en cours »
tant qu'un travail non livré existe pour elle (une PR ouverte, ou une branche `feat/<id>-…` non
absorbée par `main`). L'état est calculé **à la lecture**, jamais committé.

**Si tu arrives frais.** Une *story* se construit sur une branche `feat/<id>-<slug>`. Le *portier* est
le contrôle qu'`ezk-sprint` lance à l'ouverture d'un sprint. La *vue des sessions* (`ezk:sessions`)
montre l'état vivant, calculé à la lecture (ADR-0043).

## Contexte / Problème

Constat du 2026-10-02 : sur 330 fiches, aucune n'a jamais porté `status: in-progress`. Le portier le
lit pourtant pour signaler du travail en cours ailleurs. Écrire le statut ne marche pas : sur la
branche, il est invisible des autres sessions jusqu'au merge (et faux après) ; sur `main`, il recrée
le blocage qu'ADR-0049 a supprimé. Les décisions existantes tranchent : la concurrence se gère par la
**visibilité** (ADR-0042), l'état vivant se **calcule à la lecture** (ADR-0043), et le board reste une
**fonction pure des fichiers committés** (ADR-0055).

## Proposition

Une fiche est « en cours » si trois conditions tiennent ensemble :
1. elle est encore **active** (pas dans `features/done/`) ;
2. **aucune PR mergée ou fermée** ne porte une branche `feat/<id>-…` ;
3. il existe un **travail non livré** : une PR ouverte, ou une branche `feat/<id>-…` **non absorbée**
   par `main`. Le classifieur « absorbée / réelle » d'`ezk-archive` (fiche 0076) sait déjà le dire.

Cet état est calculé **à la lecture** par le portier et la vue des sessions. Rien n'est committé. Le
board ne l'affiche pas (frontière ADR-0055). Le rapprochement fiche ↔ branche est mécanique (l'id est
dans le nom de branche), comme pour `reconcile`.

## Critères d'acceptation

- [ ] Dès qu'une branche `feat/<id>-…` non absorbée existe pour une fiche active, la fiche `<id>`
      apparaît « en cours » dans le portier et la vue des sessions, **sans aucun commit sur `main`**.
- [ ] Une seconde session qui ouvre un sprint voit la story déjà « en cours » ailleurs.
- [ ] Une branche supprimée, une PR mergée ou une PR fermée fait disparaître l'état « en cours ».
- [ ] Une branche **restée après le merge** (copie locale, ou branche absorbée tenue par un autre
      worktree) ne rend **pas** la story « en cours ».
- [ ] Le board reste une fonction pure des fichiers committés (ADR-0055) : il n'affiche pas cet état.

## Comment vérifier

- Session 1 : créer une branche `feat/<id>-essai` dans un worktree. Session 2 : lancer le portier
  (`start --dry-run`) ; il liste `<id>` en cours.
- Supprimer la branche, relancer : `<id>` n'est plus en cours.
- Merger une PR de story depuis l'UI **sans** supprimer la copie locale, relancer : plus en cours.
- `grep -l 'status: in-progress' features/*.md` reste vide : rien n'a été écrit.

## Notes / décisions

- Découpée de la fiche `20261002130235353` le 2026-10-13 (le **mécanisme**, critères 1-5). Le **sort de
  la valeur `in-progress` du schéma** (garder-calculé ou retirer) est la fiche sœur
  [Trancher le sort de in-progress](20261013131853182_sort-valeur-in-progress-schema.md), même
  version v0.16.0.
- Origine : grooming de la fiche mère « done par story » (2026-10-02), revue Codex de la PR #327
  intégrée (une PR mergée/fermée et une branche absorbée l'emportent sur une branche restante ; pas
  d'état « en cours » dans le board).
