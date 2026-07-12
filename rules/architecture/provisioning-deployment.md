---
id: architecture/provisioning-deployment
kind: disposition
level: SHOULD
title: Provisioning / Deployment (Generic)
---

- A staging environment SHOULD be provisioned via IaC (tool of choice) to avoid drift
- Config and secrets SHOULD be centralized (secret manager / parameter store), with stable naming convention (e.g., /<project>/<env>/*)
- Deployment SHOULD avoid manual SSH:
  - Prefer an authenticated remote execution mechanism (agent, session manager, runner, etc.)
  - And idempotent scripts
