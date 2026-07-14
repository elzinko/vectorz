---
id: testing/playwright-workflow
kind: disposition
level: SHOULD
title: Playwright Testing Workflow
enforcements:
  - type: agent-check
    agent: ezk-qa
---

Example workflow:
1. browser_navigate({ url: "http://localhost:3080" })
2. browser_resize({ width: 375, height: 812 })  // Mobile FIRST
3. browser_take_screenshot({ filename: "feature-mobile.png" })
4. browser_resize({ width: 1280, height: 800 })  // Desktop if needed
5. browser_take_screenshot({ filename: "feature-desktop.png" })
