---
id: development/test-philosophy
kind: disposition
level: MUST
title: Testing Philosophy
---

- Fix bugs with a test that captures them (when realistic and stable)
- Maintain clear separation:
  - Unit tests (fast) for domain
  - Integration tests for adapters
  - E2E for critical paths
- DO NOT disable tests to "go faster" without reactivation plan
- SHOULD maintain a smoke test "it starts" (even minimal) to avoid CI round-trips
