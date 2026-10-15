---
id: "20261015082118340"
title: "Émetteur : identité de session, clé de chantier, et contrat @0.2"
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.23.0
labels: [supervision, emetteur, multi-session, contrat]
status: idea
blocked:
pr:
evidence: none # brique émetteur, pas d'écran ; prouvée par journal + validateur
created: 2026-10-15
---

# 20261015082118340 — Émetteur : identité de session + clé de chantier + contrat @0.2

**En clair.** C'est la brique de base : faire en sorte que chaque note écrite dans le journal
dise **qui** l'a écrite (la session) et **pour quel chantier** (la clé de travail). Sans ça,
rien d'autre ne tient. On ajoute aussi un petit fichier d'identité par worktree et on monte le
contrat du journal en `@0.2`.

**Si tu arrives frais.** Le *journal* est le fichier où la méthode note ce qu'elle fait. Une
*session* = un LLM sur un worktree. Un *chantier* (run) = un travail de méthode. Détail et
justification dans [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md).

## Contexte / Problème

Aujourd'hui une note de journal ne porte qu'un `run_id` opaque, unique par session. Impossible
de dire qui a écrit quoi, ni de réunir deux sessions d'un même chantier. L'émetteur est le seul
écrivain du journal (ADR-035) : c'est donc ici que l'identité doit naître.

## Proposition (ADR-079 §D2, D6, D7, D10)

- **`session_id` dans l'enveloppe** de chaque évènement, frappé par l'émetteur ; un fichier
  `<worktree>/.supervision/session.json` le fige une fois (le runtime est sans mémoire).
- **Clé de chantier** dans le **payload de `run.started`**, construite depuis `version` (+
  `milestone`) — jamais un champ rempli à la main. `run_id` reste frappé/horodaté par l'émetteur.
- **`session.started` / `session.finished`** best-effort ; `run.started` reste la 1re ligne de
  chaque journal ; les `session.*` ne sont **pas** émis pendant un jalon ouvert.
- **Branche lue en pur FS** via `<gitdir>/HEAD` (réutiliser la résolution de `project-root.ts`) ;
  repli HEAD détachée → nom de worktree. Aucune dépendance Claude.
- **Contrat `cop1/supervisability@0.2`** : le lecteur **enregistre** `session_id` et les types
  `session.*` (sinon notices/violation) ; fixtures `@0.1` mises à jour.
- **`.supervision/` gitignoré sur toutes les branches** + un garde (sinon churn, ADR-0043/0055).

## Critères d'acceptation

- [ ] Chaque évènement porte `session_id` (enveloppe) et la clé de chantier est lisible dans
      `run.started` ; `run_id` reste per-session horodaté.
- [ ] La branche est obtenue sans lancer `git`, y compris dans un worktree lié et en HEAD détachée.
- [ ] Le lecteur `@0.2` accepte `session_id` + `session.*` sans notice ni violation ; les fixtures
      existantes passent toujours.
- [ ] Aucun `session.*` n'est écrit pendant un jalon ouvert.
- [ ] `.supervision/` est ignoré sur toute branche ; un garde le vérifie.

## Comment vérifier

- Lancer deux sessions jouet (worktrees distincts) ; chaque journal porte son `session_id` et la
  même clé de chantier quand elles réalisent la même version.
- `grep` la branche dans un worktree lié : l'émetteur la lit depuis `<gitdir>/HEAD`.
- Le validateur de journal passe au vert sur un journal `@0.2` ; rejoue les fixtures.

## Notes / décisions

- Décision : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) (Accepté,
  modèle B). Fiche de design : [runs et sessions concurrents](20261014122044421_board-runs-concurrents-identite-lisible.md).
- **Sœurs (sans chapeau)** : read-model, découverte, chronologie+accueil, étape d'accueil —
  liées par `milestone: board` + `v0.23.0`. Découpage en fin d'ADR-079.
- **Taille** : touche plusieurs surfaces (enveloppe, cycle de vie, contrat, gitignore) — **à
  découper au grooming** si elle ne tient pas dans un sprint.
