---
id: documentation-guidelines/human-facing-lisibility
kind: disposition
level: MUST
title: Human-Facing Artefact Lisibility
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- Scope: **every artefact a human reads** — PR description, backlog fiche, capture,
  retro write-up, product-builder checkpoint, sprint closure summary,
  **ezk-archive handoff / rapport de clôture**. Not internal scratch (`SPRINT.md`,
  draft ADR notes).
- Open with an **« En clair »** block: the essential in **≤ 3 sentences**, BEFORE detail.
- Trame: lived symptom → proposal in plain words → concrete effect for the reader.
- Internal codes and invented jargon (`R1`, `DoR`, « verrou », « borne anti-veto »…)
  are forbidden as carriers of meaning in the opening — put them in an annex/glossary
  only, and define them once.
- Write **to the human addressed**, not between agents. Prefer a short map over an
  exhaustive dossier.

### Cas corps de PR (frère structurel de `development/pr-before-after-media`)

Every PR body produced by `ezk-sprint` (étape PR) MUST be readable **with the diff
closed**, and MUST contain these three blocks (literal headings):

1. **`## Summary`** — user-facing, ≤ 5 lines: what changes and why (open « En clair »).
2. **`## Lien fiche`** — path to the backlog fiche (`features/<id>-*.md`,
   `products/<produit>/features/<id>-*.md`, or the project's equivalent).
3. **`## Comment tester`** — literal replayable commands, **or** agent-run evidence
   (screenshots / before-after) that points at existing npm/BDD scripts. Do **not**
   duplicate Gherkin from the fiche; orient and link. Target ≤ ~2 000 chars outside
   annexes (repère, not a hard cut).

Origin: retro 2026-07-18 (PO restitution unreadable) + samplerz #317 (PR body opaque
until rewrite). Measure (removability): 0 « pas compris » claims from the PO on a
human-facing artefact for 5 consecutive sprints; and on the next 3 open PRs, a third
party reading **only** the description reformulates the need in one sentence (3/3).
