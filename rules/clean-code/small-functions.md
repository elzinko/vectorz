---
id: clean-code/small-functions
kind: disposition
level: SHOULD
title: Keep Functions Small
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- Functions SHOULD do one thing and do it well
- Functions SHOULD be under 20 lines when possible
- Extract logic into well-named helper functions
- If a function needs a comment to explain what it does, extract it
