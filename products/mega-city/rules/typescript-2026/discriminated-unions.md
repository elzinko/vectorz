---
id: typescript-2026/discriminated-unions
kind: disposition
level: SHOULD
title: Prefer Discriminated Unions
---

Use discriminated unions for state modeling:
```typescript
type Result<T> = 
  | { success: true; data: T }
  | { success: false; error: Error };
```
