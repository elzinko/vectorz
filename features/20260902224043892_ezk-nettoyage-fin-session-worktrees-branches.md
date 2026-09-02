---
id: "20260902224043892"
title: "Nettoyage de fin de session — worktrees, branches, ship, reconcile : automatiser le ménage manuel répété"
type: chore
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-09-03
---

# 20260902224043892 — Nettoyage de fin de session : le ménage manuel répété

## En clair

À chaque fin de session, il faut ranger à la main : supprimer les branches mergées, retirer
les worktrees devenus inutiles, marquer les fiches livrées, et réconcilier ce qui a été mergé
hors du flux. C'est **répétitif, fastidieux et fait au jugement à chaque fois**. On veut une
**capacité de nettoyage** qui fasse le ménage sûr **toute seule**, quand c'est sûr, sans
toucher aux sessions encore vivantes.

## Contexte / Problème

Quand plusieurs sessions tournent en parallèle (worktrees), la fin de session laisse un tas
de traces à ranger, et personne ne les range en un geste :

- des **branches locales** mergées par squash qui restent (git les voit « non mergées ») ;
- des **worktrees** de sessions terminées qui traînent ;
- des **fiches livrées** encore marquées `todo` (le `ship` n'a pas été appelé, ou il vit sur
  la branche d'une autre session) ;
- un **`reconcile` à lancer à la main** pour rattraper les merges faits hors du flux.

Le ménage se fait donc **à la main, session après session**, avec à chaque fois le même
arbitrage : « celle-là est à moi et mergée, je supprime ; celle-là est tenue par une autre
session, je ne touche pas ; ce ship est en vol ailleurs, je le laisse ». C'est du travail
cognitif répété qui devrait être outillé.

**Preuve concrète (session muti calibrage, 2026-09-01/02).** Une seule session a dû, à la
main : merger 2 PR, supprimer 5 branches en vérifiant une par une qu'elles n'étaient ni
tenues par un worktree ni celles d'une session vivante, constater qu'un `ship` de sa propre
fiche vivait sur la branche non poussée d'une autre session, et laisser le `reconcile` pour
« plus tard ». Le handoff a même dû noter : « ménage différé — NE PAS exécuter depuis une
session d'archivage, worktrees d'autres sessions potentiellement actifs ». Ce « différé »
permanent **est** le trou : le ménage sûr n'a pas de moment ni d'outil dédié.

## Ce qui existe déjà (cette fiche est l'ombrelle, pas un doublon)

Des pièces sont posées, mais éparses — aucune ne fait le **ménage cohérent de bout en bout** :

- [[0076]] (**shippée**) — *classe* les branches absorbées vs réelles aux deux chemins de
  merge. Elle sait dire « supprimable », mais la **suppression effective + les worktrees +
  les sessions concurrentes** restent hors de son geste.
- [[20260823121712781]] (todo) — `reconcile` systématique après un squash-merge hors flux.
  C'est **un** des sous-problèmes (les fiches livrées restées `todo`).
- [[0189]] (idea) — le handoff doit survivre aux sessions éphémères. Voisin : la trace de
  session, pas le ménage.
- [[0002]], [[0009]] (done) — durcissement des appels `git worktree`. Brique bas niveau.
- [[20260812104022237]] (idea) — tracer la session/branche responsable d'une PR.

Le manque : **une capacité qui compose ces pièces** en un ménage sûr, déclenché au bon
moment, qui distingue « à moi et fini » de « tenu par une session vivante » et **agit** sur
le premier sans toucher au second.

## Piste (à explorer — non tranché, c'est une idée)

À départager au grooming avec l'architecte :

- **Où ça vit** : une extension d'`ezk-archive` (le ménage EST une clôture) ? une nouvelle
  capacité `ezk-cleanup` ? un cap composé (reconcile + ship + branch-prune + worktree-prune) ?
- **Le prédicat de sûreté** : « sûr de supprimer » = branche mergée (ou absorbée par 0076)
  **ET** non tenue par un worktree **ET** pas la branche d'une session encore active. Comment
  détecter « session active » de façon fiable (heartbeat de supervision ? worktree présent ?) ?
- **Le déclencheur** : à la clôture d'une session ? un balayage périodique « quand tout est
  calme » (aucune session active) ? une commande explicite `nettoie tout ce qui est sûr` ?
- **La cascade** : `reconcile` → `ship` les fiches rattrapées → supprimer les branches
  absorbées (local + remote) → retirer les worktrees prunables. Chaque étape déterministe,
  le script range (ADR-0001), l'humain arbitre les cas réels.

## Critères d'acceptation

- [ ] À définir au grooming (l'idée n'est pas mûre — cf. « Piste »).

## Comment vérifier

- [ ] À définir au grooming.

## Notes / décisions

- **Idée capturée** (Thomas, 2026-09-03) en clôture de la session muti calibrage, sur la
  friction vécue du ménage manuel multi-session.
- **Anti-doublon fait** : ombrelle assumée au-dessus de [[0076]] / [[20260823121712781]] /
  [[0189]] — à fusionner avec l'une d'elles si le grooming juge que le périmètre s'y réduit.
- **Priorité P2 posée par défaut** pour une idée (hors flux P0→P3) — à confirmer/déplacer par
  le PO au grooming.
- Recoupe la mémoire projet `ezk-worktree-friction` (frictions ezk en worktree) — matière de
  cadrage disponible.
