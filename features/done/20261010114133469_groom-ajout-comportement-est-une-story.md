---
id: "20261010114133469"
title: "Au grooming : un ajout de comportement en cours de sprint est une story ou reçoit un critère"
type: feature
priority: P2
product: mega-city
milestone:
version: v0.16.0
labels: [ezk-backlog, grooming, dor]
status: shipped
pr: "local 56f9b984"
evidence: none # convention + gate, pas d'écran
created: 2026-10-10
---

# 20261010114133469 — Un ajout de comportement en cours de sprint est une story ou reçoit un critère

**En clair.** Quand le PO ajoute un comportement en cours de sprint (ex. les « filtres » greffés sur la
vue process), il n'est pas traité comme une story : il n'a **pas de critère d'acceptation**, donc rien
ne le teste, et un bug passe jusqu'à la revue adverse. On veut que le gate `ready`/`groom` rappelle :
tout ajout de comportement est **une story** ou **reçoit au moins un critère** avant le ship.

**Si tu arrives frais.** Le *grooming* fait mûrir une fiche vers « prête » (critères observables).
Une *story* est une fiche = une unité de travail.

## Contexte / Problème

- Vécu au sprint « vue process » (2026-10-10) : l'enrichissement « filtres », demandé en cours de
  sprint, n'a eu aucun critère. Le bug « recherche sur une colonne tronquée » n'a été attrapé **que**
  par la revue adverse.
- Le juge de cohérence de la rétro a renvoyé ce cas au **grooming** (pas au ship) : la règle
  `development/acceptance-criteria-before-merge` exige déjà le critère **dans** la PR ; le trou, c'est
  de ne pas avoir reconnu l'ajout comme une story.
- Issu de la rétro du 2026-10-10 (capture
  [2026-10-10-retro-vue-process-worktree-silences](../../docs/captures/2026-10-10-retro-vue-process-worktree-silences.md)),
  proposition 12.

## Proposition

Le gate `ready`/`groom` d'`ezk-backlog` porte un rappel court : « un ajout de comportement = une story
ou un critère ». Pas un nouveau moteur — une ligne de la liste de contrôle, appuyée sur la règle
existante `acceptance-criteria-before-merge`.

## Critères d'acceptation

- [ ] Le gate `ready`/`groom` nomme ce rappel quand une fiche grossit d'un comportement sans critère.
- [ ] Sur les 3 prochains sprints, 0 enrichissement livré sans au moins un critère coché.

## Comment vérifier

Relecture : sur les 3 prochains sprints à enrichissement en cours de route, chaque ajout porte un
critère coché avant le ship (constat daté dans la capture de rétro suivante).

## Notes

Mesure (retrait) : 0 enrichissement livré sans critère sur 3 sprints.
