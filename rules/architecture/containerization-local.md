---
id: architecture/containerization-local
kind: disposition
level: MUST
title: Containerization & Local Execution
---

- Template MUST allow reproducible local startup (ideally "one-command")
- If Docker is used:
  - Environment configuration SHOULD be based on .env.<env> files (or equivalent) with versioned .env.template
  - Critical services SHOULD expose healthcheck endpoints used by Compose/CI
- A build-dedicated override file (e.g., docker-compose.build.yml) MAY exist, but IS NOT mandatory:
  - If single docker-compose.yml can cover "pull & run" and "build & run" via commands/variables, acceptable
  - Otherwise, an override remains a simple and readable solution
- A single reverse-proxy/ingress entry point MAY be used (TLS, single access point, routing), but IS NOT a constraint: choose the most appropriate option
