---
id: 0185
title: ezk-archive — croiser branches RÉELLES et PRs ouvertes (ne plus proposer d'ouvrir une PR déjà ouverte)
type: feature
priority: P1
product: mega-city
status: shipped
ready: 2026-08-08
pr: "#117"
created: 2026-08-08
---

# 0185 — ezk-archive : croiser branches RÉELLES ↔ PRs ouvertes

## Contexte / Problème

À la clôture / au triage d'une branche locale « RÉELLE », l'agent peut recommander
**d'ouvrir une PR** alors qu'**une autre session** a déjà ouvert la PR sur cette
tête (cas vécu 2026-08-08 : `docs/features-0183-0184-reporting` + PR #116).

Causes :

1. le portier liste les PRs ouvertes **et** les branches RÉELLES **en silos** — pas de
   jointure `headRefName` ↔ branche ;
2. si `gh` est indisponible (`P2 UNKNOWN`), le chat peut quand même proposer un merge /
   une nouvelle PR sans le dire clairement.

Ce n'est **pas** un problème de « mémoire inter-sessions » magique : c'est un **trou
de preuve** dans le portier + un garde-fou manquant côté skill/agent.

## Proposition

1. **Portier (`check.sh`)** — pour chaque branche RÉELLE, si une PR ouverte a le même
   `headRefName`, annoter le fait gate : `pr=#N` (et le rendu humain `→ PR #N`).
   Ne plus laisser l'humain/agent croire que « ouvrir une PR » est l'action par défaut.
2. **Skill + agent** — règle explicite : ne jamais proposer d'ouvrir une PR sur une
   branche déjà annotée `pr=#N` ; si `P2 UNKNOWN` (gh KO), **interdire** la reco
   « ouvrir une PR » et demander une vérif humaine / `gh pr list`.
3. **Test** — injection `EZK_ARCHIVE_TEST_PRS` (JSON) pour prouver la jointure sans
   réseau GitHub (hermétique CI).

Hors scope : détection de worktrees Cursor / conversations parallèles (pas de source
de vérité fiable) ; `reconcile` backlog (déjà ADR-0018).

## Critères d'acceptation

- [x] Une branche RÉELLE dont le nom = `headRefName` d'une PR ouverte apparaît avec
      `pr=#N` dans le gate et `→ PR #N` dans `--full`
- [x] Sans PR correspondante, le comportement actuel (REAL sans `pr=`) est inchangé
- [x] `P2 UNKNOWN` / note gh KO : le skill/agent interdit de proposer « ouvrir une PR »
- [x] Test hermétique vert (`EZK_ARCHIVE_TEST_PRS`) dans `test:scripts`
- [x] Gate locale verte

## Notes / décisions

- **2026-08-08** — déclenché après archive qui a raté #116 (gh UNKNOWN en sandbox +
  oubli `gh pr list` au triage conversationnel).
- Injection test : `EZK_ARCHIVE_TEST=1` **et** `EZK_ARCHIVE_TEST_PRS` (TSV
  `head\tnum\ttitle`) — la variable de données seule est **ignorée** (anti-backdoor).
  Chemin live : `gh … --jq` embarqué, **pas** de `jq` système.
