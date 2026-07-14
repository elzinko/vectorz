---
id: architecture/data-persistence-mvp
kind: disposition
level: SHOULD
title: Data & Persistence (MVP Approach)
---

MVP MAY start with simple persistence (in-memory, file, mock), but:
- Data access MUST go through a port (repository interface)
- Concrete implementation (in-memory, file, DB) MUST be a replaceable adapter

Design MUST NOT impose a "real DB" or cache from the start if the product doesn't need it

Transition to a DB later SHOULD be an adapter substitution, not a domain rewrite
