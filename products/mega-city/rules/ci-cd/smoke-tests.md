---
id: ci-cd/smoke-tests
kind: disposition
level: SHOULD
title: Smoke Tests in CI
---

CI SHOULD execute a smoke/startup test (proof that "it boots"):
- Start the application (docker or dev mode)
- Wait for availability (healthchecks)
- Verify some essential endpoints

E2E tests MAY be executed:
- In the same job after build + startup, OR
- In a separate job (if duration/cost is higher)
