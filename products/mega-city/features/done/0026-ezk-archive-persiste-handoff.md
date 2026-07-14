---
id: 0026
title: ezk-archive persiste la note de handoff dans .claude/handoff.md
type: feature
priority: P2
version:
status: shipped
pr: local (squash-merge)
created: 2026-07-06
---

## Contexte / Problème
La note de handoff d'ezk-archive n'était qu'**affichée dans le chat** → perdue si
l'utilisateur ne pensait pas à la copier. Rien ne survivait de façon fiable entre deux
sessions, ce qui va à l'encontre de la raison d'être du skill (« ne rien perdre »).

## Proposition
`run`/`close` **écrit** la note en tête de `.claude/handoff.md` (racine du repo,
gitignoré) : **append-only**, entrée la plus récente en premier, plusieurs sessions
parallèles peuvent chacune ajouter la leur sans conflit. Avant d'ajouter, `run`
**purge les entrées entièrement résolues** (croise les PR/branches mentionnées avec
la liste live du check) ; une entrée partiellement pending est conservée telle quelle.
`scripts/check.sh` (read-only) détecte le fichier et liste les refs à croiser.

## Critères d'acceptation
- [x] `run` écrit/append la note dans `.claude/handoff.md` (nouvelle entrée en tête)
- [x] purge des entrées **entièrement** résolues ; conserve les partiellement pending
- [x] `.claude/handoff.md` gitignoré (éphémère personnel, jamais committé)
- [x] `check.sh` (strictement read-only) détecte le fichier + liste les refs à croiser

## Notes
- Implémenté par `3dc21d7` (+ gitignore `6ce26f7`), livré sur la branche
  `feat/design-system-extend`, **réconcilié sur `main`** avec la fiche 0019.
- **Fiche créée rétroactivement** (rattrapage backlog) : la feature a été livrée sans
  fiche ; ajoutée ici pour la traçabilité (1 feature = 1 fiche).
- Même famille qu'`ezk-archive` (hygiène de clôture) ; ne déborde pas sur le scrum/sprint.
