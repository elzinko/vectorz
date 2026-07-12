---
id: ci-cd/artifact-strategy
kind: disposition
level: SHOULD
title: Build Artifact Strategy
---

If images are built, strategy SHOULD support:
- Immutable tag (commit SHA)
- Optionally a "latest" tag (or equivalent)
- Deployment path that REUSES these artifacts (no rebuild on target, unless explicit choice)
