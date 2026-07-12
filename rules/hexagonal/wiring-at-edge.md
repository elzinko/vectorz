---
id: hexagonal/wiring-at-edge
kind: disposition
level: SHOULD
title: Wiring at the Edge
---

- Assembly of ports/adapters SHOULD happen at application entry point
- Dependency injection configured at startup, not in domain
- Configuration reading SHOULD NOT happen in domain
