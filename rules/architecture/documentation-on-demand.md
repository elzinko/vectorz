---
id: architecture/documentation-on-demand
kind: disposition
level: MUST
title: Documentation (On-Demand Only)
---

- Documentation MUST be generated ONLY when explicitly requested by the user
- When documentation is requested, it MUST be created in the docs/ directory
- DO NOT create documentation files (.md) proactively without explicit user request
- Exception: README.md files at package/module level for library usage are acceptable
