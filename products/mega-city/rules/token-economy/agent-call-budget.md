---
id: token-economy/agent-call-budget
kind: disposition
level: SHOULD
title: Count cost in agent calls, not in task length
---

- Every sub-agent call carries ~85k tokens of fixed context (measured, run V0.1-V0.4): budget CALLS, not lines
- Per work item: the agent that leads it, at most ONE adversarial review (shared across 2-3 small patches) and one readiness check (grouped across N items; none when an item is already `ready`)
- Never launch an explorer agent for a search `grep` can answer — a loosely bounded explorer cost ~370k
- Hand over the artefact, not the hunt: paste the item into the prompt, give the patch path, ask for a verdict in a few lines
- Never skip the review to save tokens; skip only what does not bite on the work (BDD/TDD/E2E agents for prose)
- Keep delivery (`ship`) and generated views out of each item's PR; report consumption per item (target: ≤ 200k)
