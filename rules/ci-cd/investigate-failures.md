---
id: ci-cd/investigate-failures
kind: disposition
level: MUST
title: Investigate CI Build Failures
---

When a CI build fails:
- MUST use GitHub MCP to examine logs and failure details
- MUST attempt to reproduce the problem LOCALLY first using npm/pnpm commands from package.json files (root and sub-folders)
- MUST use the same commands executed in CI to ensure reproducibility
- DO NOT rerun CI build without attempting local reproduction, unless the problem is clearly CI-environment specific only
- SHOULD document differences between local and CI environment if problem cannot be reproduced locally
