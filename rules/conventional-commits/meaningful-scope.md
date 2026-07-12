---
id: conventional-commits/meaningful-scope
kind: disposition
level: SHOULD
title: Scope names a real area of the codebase
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- The (scope) SHOULD name a real area (auth, api, ui, billing...)
- Avoid vague scopes: "stuff", "misc", "update"
