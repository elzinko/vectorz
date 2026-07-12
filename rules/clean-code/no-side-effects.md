---
id: clean-code/no-side-effects
kind: disposition
level: SHOULD
title: Avoid Side Effects
---

- Functions SHOULD not modify global state
- Functions SHOULD be predictable (same input = same output)
- If side effects are necessary, make them explicit in the function name
