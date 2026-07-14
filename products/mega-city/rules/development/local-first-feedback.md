---
id: development/local-first-feedback
kind: disposition
level: MUST
title: Local-First Feedback Loop
---

- Reproduce and validate changes LOCALLY before triggering CI pipelines
- Use targeted verification (focused tests) closest to the change before running full suite
- DO NOT spam CI reruns without significant changes or locally tested hypothesis
- Run smoke tests locally (start services + verify healthchecks) before push
