---
id: development/use-project-scripts
kind: disposition
level: MUST
title: Use Project Scripts as Source of Truth
---

- MUST prioritize and maximize use of npm/pnpm scripts defined in package.json files:
  - Root project package.json
  - Sub-folders (apps, services, packages) if specific scripts are defined
- DO NOT execute underlying commands directly (turbo, eslint, docker compose) if equivalent npm/pnpm script exists
- If operational scripts exist (infra/docker/scripts/*):
  - MUST be the standard interface used by npm/pnpm scripts
  - SHOULD manage lifecycle by environment (local|ci|staging|prod)
  - SHOULD centralize setup/start/stop/logs/wait/deploy
