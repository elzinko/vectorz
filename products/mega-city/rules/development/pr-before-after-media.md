---
id: development/pr-before-after-media
kind: disposition
level: MUST
title: Before/After Media in PR Description
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- Every PR that delivers a **user-visible** feature or bugfix MUST include a short **before / after** proof **as links in the PR description** (GitHub body)
- Preferred: screenshots (bug or état avant → correction or état après), linked so they render inline in the PR
- Allowed: a short, cheap screen recording (or GIF) when a still image cannot show the issue (animation, timing, navigation flow) — also linked from the PR body
- The media MUST make the problem and the fix understandable **without reading the whole diff**
- Hosting: upload to the PR (GitHub-hosted image URLs), or commit light assets on the branch (e.g. `docs/pr-evidence/<id>-before.png`) and link them in the body — prefer links over burying binaries without a body reference
- Exception: pure chore / docs / infra with **no** user-visible UI change → mark `N.A.` in the PR validation matrix with a one-line reason

Rationale: PO and async reviewers need a visual signal; text-only PRs are insufficient for UX bugs and map/admin flows.
