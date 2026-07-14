---
id: architecture/operational-scripts
kind: disposition
level: SHOULD
title: Operational Scripts (DX & Runbooks)
---

- Template SHOULD provide operational scripts (bash or equivalent) to manage lifecycle:
  - setup, start, stop, logs, wait, deploy, clean (names adaptable)
- These scripts MUST be called by project manager scripts (e.g., npm/pnpm scripts) and constitute the standard execution interface
- Scripts SHOULD accept an environment parameter (local|ci|staging|prod) and apply corresponding config (.env.<env> or config store)
