---
id: "20260823121712781"
title: "Atterrissage atomique du ship — la fiche rangée dans la PR, les vues régénérées post-merge"
type: feature
priority: P1
product: mega-city
status: todo
ready:
pr:
created: 2026-08-23
---

# Atterrissage atomique du ship — le merge ne doit plus faire rater le « done »

## En clair

Quand une PR est mergée, le code atterrit sur `main` mais **personne ne passe la fiche en `shipped`
ni ne la range dans `done/`** : c'est un geste séparé (`ship`) qu'on oublie, ou — depuis un worktree —
qu'on **ne peut pas** committer sur `main`. On décide (ADR-0047) de **ranger la fiche dans la PR
elle-même**, et de **régénérer les vues sur `main` après le merge**. Cette fiche porte la **moitié
post-merge** : le déclencheur qui régénère les vues et rattrape les oublis.

## Contexte / Problème

- Le `status` d'une fiche est un **cache** de l'état *merged* de sa PR (ADR-0018). Merge du code et
  `ship` sont **deux actes** ; rien ne les couple.
- `ezk-backlog reconcile` croise déjà PR mergées ↔ fiches et **propose** les `ship` oubliés — mais il
  faut **penser à le lancer** (manuel).
- **Récurrence datée (session muti 2026-09-01/02)** : PR #171 mergée, `ship` de `20260830194321545`
  jamais atterri (bloqué worktree→`main`, fini « en vol » sur une branche non poussée). Le code sur
  `main`, la fiche restée `todo`. Ce n'est donc pas seulement « on oublie » : **une session en worktree
  ne *peut pas* committer le ship sur `main`**.
- Symptôme antérieur (échange PO 2026-08-23) : « parfois je squash-merge sur GitHub et on rate les
  `ship` ».

## Proposition (cadrée par ADR-0047)

Le modèle a **trois briques** ; cette fiche implémente la 2 et la 3.

1. **Ship dans la PR** *(porté par `ezk-sprint` étape 10 + `ezk-backlog ship`, hors de cette fiche)* :
   `git mv` vers `done/` + `status: shipped` + `pr: #N` comme **dernier commit de la branche**, après
   le GO de revue. Le squash-merge fait atterrir code + statut **atomiquement**.
2. **Déclencheur post-merge des vues** *(cœur de cette fiche)* : un hook/petit job sur `main` qui, après
   chaque merge, **régénère `BACKLOG.md` + les cartes** depuis les front-matter. Les vues **ne
   voyagent pas** dans les PR (fichiers touchés par chaque fiche → conflits systématiques). Pure
   re-dérivation, sérialisée sur `main`, **sans conflit**.
3. **`reconcile` = filet** : couvre le seul cas restant — un merge **100 % hors flux** (UI GitHub sans
   le commit de ship). Il **propose**, `ship` exécute (invariant ADR-0018).

## Critères d'acceptation (à groomer)

- [ ] Après un merge, les **vues** (`BACKLOG.md` + cartes) sont **régénérées sur `main`** sans geste
      manuel ni conflit inter-PR.
- [ ] Un merge fait **hors flux** (UI GitHub, sans commit de ship) est **détecté** et **proposé** au
      `ship` sans lancement manuel.
- [ ] Le contrôle **propose**, ne bascule **rien** seul (ADR-0018).
- [ ] Silencieux/inoffensif quand il n'y a rien à réconcilier / régénérer.
- [ ] Point d'ancrage tranché au grooming : hook post-merge local, ou job CI sur `main` ?

## Comment vérifier

- Merger une PR qui **range déjà la fiche** (brique 1) → sur `main`, les vues se régénèrent seules,
  la fiche apparaît en `done/`, aucun conflit d'index.
- Merger une PR **sans** commit de ship (UI GitHub) → la fiche correspondante est **signalée à
  shipper** sans lancement manuel.

## Notes / voisins

- **ADR-0047** — le cadre : ship dans la PR (brique 1) ; vues régénérées post-merge (brique 2, ici) ;
  reconcile filet (brique 3).
- Voisins : [[0185]] (ezk-archive croise branches réelles ↔ PR ouvertes), [[20260812100109940]]
  (sync des vues de planning au `ship`), `ezk-backlog reconcile` (la brique composée).
- **Non ready** — à groomer (point d'ancrage du déclencheur : hook local ou CI ?).
