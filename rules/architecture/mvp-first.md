---
id: architecture/mvp-first
kind: disposition
level: MUST
title: MVP-First Product Intent
enforcements:
  - type: agent-check
    agent: ezk-architect
---

- Design MUST aim for the simplest possible MVP (time-to-first-feature) while preserving evolvability
- Design MUST NOT over-optimize for unproven constraints (load, high availability, microservices, distributed cache, etc.)
- If a technical constraint can be abstracted/deferred without endangering product trajectory, it MUST be deferred (accelerate development)
