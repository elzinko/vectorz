---
id: "20261015133600298"
title: "Émetteur T1 : contrat @0.2 + journal par worktree (le format et l'emplacement)"
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.23.0
labels: [supervision, emetteur, multi-session, contrat]
status: ready
blocked:
pr:
evidence: none # brique émetteur ; prouvée par le lecteur + les fixtures
split_from: "20261015082118340"
created: 2026-10-15
---

# 20261015133600298 — Émetteur T1 : contrat @0.2 + journal par worktree

**En clair.** La fondation : préparer le **format** et l'**emplacement** du journal à recevoir
les données multi-sessions, **avant** d'écrire quoi que ce soit de neuf. Le lecteur apprend à
accepter les futurs champs, et chaque worktree a désormais son propre journal.

**Si tu arrives frais.** Le *contrat* est le format figé du journal (`cop1/supervisability`).
Un *worktree* = une copie de travail isolée. Détail : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D5, D7.

## Contexte / Problème

Si on écrit les nouveaux champs (identité de session, clé de chantier) sans que le lecteur les
connaisse, il émet une notice par ligne — et un évènement inconnu pendant un jalon ouvert devient
une **violation**. Et tant que les worktrees partagent un seul journal, deux sessions se bloquent.
On pose donc le format et l'emplacement d'abord.

## Proposition (ADR-079 §D5, D7)

- **Contrat `cop1/supervisability@0.2`** : le lecteur **enregistre** `session_id` (champ
  d'enveloppe) et les types `session.started` / `session.finished` dans ses listes connues
  (`KNOWN_ENVELOPE_FIELDS`, `KNOWN_EVENT_TYPES`) — **sans encore les émettre**. Fixtures `@0.1`
  mises à jour.
- **Journal par worktree par défaut** : le mode `SUPERVISION_PER_WORKTREE` devient le mode normal
  quand la supervision multi-sessions est active (chaque worktree écrit son `.supervision/runs/`).
- **`.supervision/` gitignoré sur toutes les branches** + un garde (sinon un worktree sur une
  vieille branche tracke son journal → churn, ADR-0043/0055).

## Critères d'acceptation

- [ ] Le lecteur `@0.2` accepte `session_id` et les types `session.*` **sans notice ni violation**.
- [ ] Les fixtures existantes passent toujours (aucune régression du validateur).
- [ ] Chaque worktree écrit son **propre** `.supervision/runs/` ; deux worktrees = deux journaux.
- [ ] `.supervision/` est ignoré sur **toute** branche, vérifié par un garde.

## Comment vérifier

- Rejouer les fixtures : vertes, y compris un journal `@0.2` portant `session_id` et un `session.*`.
- Lancer deux worktrees jouet → deux dossiers `.supervision/runs/` distincts.
- `git check-ignore` sur `.supervision/` depuis une branche quelconque : ignoré.

## Notes / décisions

- Découpée de [Émetteur : identité + clé + @0.2](done/20261015082118340_emetteur-identite-session-cle-chantier-contrat-v02.md) le 2026-10-15 (règle de taille : la mère touchait ~5 surfaces).
- Décision : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md).
- **Sœurs (sans chapeau)** : [identité de session](20261015133600314_emetteur-identite-de-session.md),
  [clé de chantier](20261015133600328_emetteur-cle-de-chantier.md) — `milestone: board` + `v0.23.0`.
  Celles-ci **dépendent de T1** (le format doit accepter les champs avant qu'on les écrive).
