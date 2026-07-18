---
id: documentation-guidelines/proven-outbound-references
kind: disposition
level: MUST
title: Proven Outbound References
---

- Scope: outbound references inside PUBLISHED artifacts (README, guides, PR bodies,
  review verdicts) — not internal work notes (SPRINT.md, draft ADRs)
- A cited ADR/rule/document MUST have been READ in the same turn as the citation:
  reference it by id + section, with one literal quote
- A published command/config block MUST have been EXECUTED as-is in the target
  environment before merge (fallback: attach a real execution capture to the review)
- Command blocks must be self-contained: no bare command names that depend on the
  author's shell (absolute paths or explicit --dir), install steps included
- Origin: retro 2026-07-18 (false ADR citation caught by review; broken published
  MCP config caught only by an executing reviewer persona)
- Measure (removability): 0 unresolved-reference incidents over the next 5 sprints
