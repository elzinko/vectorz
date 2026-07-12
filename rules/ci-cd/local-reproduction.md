---
id: ci-cd/local-reproduction
kind: disposition
level: MUST
title: Local Reproduction Commands
enforcements:
  - type: hook
    hook:
      stage: pre-push
      script: hooks/pre-push.sh
---

- MUST consult root package.json to identify available scripts
- MUST consult package.json in sub-folders (apps, services, packages) for specific commands
- MUST use npm/pnpm scripts defined in these files rather than executing underlying commands directly
- SHOULD check CI workflow (.github/workflows/*.yml) to understand exactly which commands are executed
