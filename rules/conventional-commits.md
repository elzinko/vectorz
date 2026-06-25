---
id: conventional-commits/format
level: MUST
enforcements:
  - type: hook
    hook: { stage: commit-msg, script: hooks/commit-msg.sh }
---

Chaque message de commit suit **Conventional Commits v1.0.0** :
`type(scope): sujet` (feat, fix, chore, docs, refactor, test…). Garanti par un
git hook `commit-msg` (enforcement niveau 2, bloquant).
