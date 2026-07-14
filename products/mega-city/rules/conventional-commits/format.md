---
id: conventional-commits/format
kind: disposition
level: MUST
title: Conventional Commit format
enforcements:
  - type: hook
    hook:
      stage: commit-msg
      script: hooks/commit-msg.sh
---

Chaque message de commit suit **Conventional Commits v1.0.0** :
`type(scope)?: sujet` — `type` ∈ feat, fix, docs, style, refactor, perf, test,
build, ci, chore, revert. Description en minuscules, à l'impératif, sans point
final. Breaking change : `!` après type/scope, ou un footer `BREAKING CHANGE:`.
Garanti par un git hook `commit-msg` (enforcement niveau 2, bloquant).
