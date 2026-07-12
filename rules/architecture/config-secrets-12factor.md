---
id: architecture/config-secrets-12factor
kind: disposition
level: MUST
title: Configuration, Secrets, and 12-Factor
---

- Runtime configuration MUST be provided via environment variables (or equivalent runtime mechanism)
- Secrets MUST NOT be committed; a configuration template MUST exist (without secrets)
- Secrets SHOULD be distinguished (e.g., SECRET_ prefix) to facilitate:
  - Encrypted storage (secret manager / parameter store)
  - Audit and rotation
- Logs MUST output to stdout/stderr, and be exploitable in local/CI/prod (readable or structured format)
