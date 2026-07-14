---
id: development/quality-guardrails
kind: disposition
level: MUST
title: Quality and Consistency Guardrails
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- Apply lint/format/type-check before push when repo uses them
- SHOULD make small and reversible changes (focused PRs/commits)
- DO NOT mix massive refactor + behavioral fix without necessity (hard to review/debug)
