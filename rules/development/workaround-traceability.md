---
id: development/workaround-traceability
kind: disposition
level: MUST
title: Document Workarounds and Decisions
---

- DO NOT introduce silent workarounds without explanation
- When a workaround or non-obvious decision is needed, MUST add an English comment near the code explaining:
  - Context (why this exists)
  - Trade-off (what we accept / what we lose)
  - Alternatives considered (at least 1)
  - Why this choice is acceptable for now
- SHOULD create a document in choices/ describing the decision and link it from the comment

Example comment format:
```
// WORKAROUND: <short summary>
// Context: <why this exists>
// Trade-off: <what we accept / what we lose>
// Alternatives: <option A>, <option B>
// Decision record: choices/0001-short-title.md
```
