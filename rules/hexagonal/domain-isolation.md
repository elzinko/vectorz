---
id: hexagonal/domain-isolation
kind: disposition
level: MUST
title: Domain Must Be Isolated
enforcements:
  - type: agent-check
    agent: ezk-architect
---

- Domain (entities, business rules, use-cases) MUST be independent of frameworks
- Domain MUST NOT import from infrastructure or adapters
- Domain MUST be testable without I/O
