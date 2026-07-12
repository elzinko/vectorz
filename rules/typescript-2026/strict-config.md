---
id: typescript-2026/strict-config
kind: disposition
level: MUST
title: Strict Configuration
enforcements:
  - type: hook
    hook:
      stage: pre-commit
      script: hooks/pre-commit.sh
---

Enable all strict options in tsconfig.json:
- strict: true
- noUncheckedIndexedAccess: true
- exactOptionalPropertyTypes: true
- noImplicitOverride: true
