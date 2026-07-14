---
id: architecture/repo-structure
kind: disposition
level: MUST
title: Repository Structure (Conceptual)
---

Codebase MUST separate conceptually:
- Applications (entrypoints / delivery)
- Runtime services (API/worker)
- Shared libraries (reusable, pure)
- Infrastructure (execution/deployment)

For JS/TS monorepo (workspaces), structure SHOULD be:
- apps/ (UI, backoffice, CLI, etc.)
- services/ (API, workers)
- packages/ (domain, shared libs)
- infra/ (docker, provisioning IaC, scripts)

If not JS/TS monorepo, structure MAY differ, but MUST preserve these 4 concepts (even if names change)
