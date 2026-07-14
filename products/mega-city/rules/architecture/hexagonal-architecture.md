---
id: architecture/hexagonal-architecture
kind: disposition
level: MUST
title: Hexagonal Architecture (Ports & Adapters)
---

Domain (entities, business rules, use-cases) MUST be:
- Independent of frameworks
- Testable without I/O
- Stable facing adapter changes

External dependencies (persistence, HTTP, providers, third-party systems) MUST be inverted via ports (interfaces) defined in domain/application layer

Adapters (HTTP/controllers, DB repositories, external clients) MUST live in infrastructure layer

Wiring (assembly ports/adapters, injection, config reading) MUST happen at the edge (service/app entrypoint), not in domain

Shared libraries (packages/* or equivalent) MUST NOT read environment variables directly; configuration MUST come from apps/services
