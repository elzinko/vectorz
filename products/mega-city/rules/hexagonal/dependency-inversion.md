---
id: hexagonal/dependency-inversion
kind: disposition
level: MUST
title: Invert Dependencies via Ports
---

- External dependencies (DB, HTTP, providers) MUST be inverted via ports (interfaces)
- Ports are defined in domain/application layer
- Adapters implement ports and live in infrastructure
