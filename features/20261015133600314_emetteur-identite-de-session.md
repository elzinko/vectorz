---
id: "20261015133600314"
title: "Émetteur T2 : l'identité de session (le « qui » sur chaque évènement)"
type: feature
priority: P1
product: mega-city
milestone: board
version: v0.23.0
labels: [supervision, emetteur, multi-session]
status: ready
blocked:
pr:
evidence: none # brique émetteur ; prouvée par le journal + le validateur
split_from: "20261015082118340"
created: 2026-10-15
---

# 20261015133600314 — Émetteur T2 : l'identité de session

**En clair.** Chaque note du journal doit dire **qui** l'a écrite : la session. On lui donne un
identifiant stable et un libellé lisible (sa branche), portés sur chaque évènement, pour que le
board distingue les ouvriers d'un coup d'œil.

**Si tu arrives frais.** Une *session* = un LLM sur un worktree. L'*enveloppe* est l'en-tête
commun de chaque évènement. Détail : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) §D6, D10.

## Contexte / Problème

Le runtime est **sans mémoire** (un redémarrage MCP = nouvelle instance) et le journal est
par-run : une session, qui couvre plusieurs runs, n'a pas de domicile naturel. Il faut un substrat
par session et un id porté par l'enveloppe. La fin de session n'a pas de déclencheur fiable (le
process MCP est tué par l'hôte) → best-effort, le board l'infère.

## Proposition (ADR-079 §D6, D10) — dépend de T1 (@0.2 accepte déjà `session_id`/`session.*`)

- **`session_id` dans l'enveloppe** de chaque évènement, frappé par l'émetteur ; un fichier
  `<worktree>/.supervision/session.json` le **fige une fois** (survit à un redémarrage du process).
- **`session.started` / `session.finished`** best-effort ; `run.started` reste la **1re ligne**
  de chaque journal de run ; les `session.*` ne sont **jamais** émis pendant un jalon ouvert.
- **Branche lue en pur file-system** via `<gitdir>/HEAD` (réutiliser la résolution gitdir de
  `project-root.ts`, sans lancer `git`) ; repli HEAD détachée → nom de worktree.

## Critères d'acceptation

- [ ] Chaque évènement porte `session_id` dans son enveloppe ; `session.json` fige l'id (un
      redémarrage du process ne change pas le `session_id` de la session).
- [ ] La branche est obtenue **sans lancer `git`**, y compris dans un worktree lié (`.git` fichier)
      et en HEAD détachée (repli nom de worktree).
- [ ] `run.started` reste la 1re ligne ; **aucun** `session.*` n'est écrit pendant un jalon ouvert.

## Comment vérifier

- Deux sessions jouet (worktrees distincts) → chaque journal porte **son** `session_id`.
- Redémarrer l'émetteur en cours de session → **même** `session_id` (relu de `session.json`).
- `grep` la branche : lue depuis `<gitdir>/HEAD` ; forcer une HEAD détachée → repli worktree.

## Notes / décisions

- Découpée de [Émetteur : identité + clé + @0.2](done/20261015082118340_emetteur-identite-session-cle-chantier-contrat-v02.md) le 2026-10-15.
- Décision : [ADR-079](../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md).
- **Dépend de** [T1 contrat @0.2 + journal par worktree](20261015133600298_emetteur-contrat-v02-journal-par-worktree.md).
  **Sœur** : [clé de chantier](20261015133600328_emetteur-cle-de-chantier.md) — `milestone: board` + `v0.23.0`.
