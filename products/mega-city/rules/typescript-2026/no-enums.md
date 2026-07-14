---
id: typescript-2026/no-enums
kind: disposition
level: MAY
title: Avoid Enums
---

- Consider using `as const` objects instead of enums
- Enums have runtime overhead and quirky behavior
- Exception: Numeric enums for bit flags are acceptable
