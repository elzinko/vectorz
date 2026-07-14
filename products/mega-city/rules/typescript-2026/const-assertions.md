---
id: typescript-2026/const-assertions
kind: disposition
level: SHOULD
title: Use const assertions
---

Prefer `as const` for literal types:
```typescript
const STATUSES = ['pending', 'done'] as const;
type Status = typeof STATUSES[number];
```
