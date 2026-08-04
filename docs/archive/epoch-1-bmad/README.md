---
title: Archive — epoch-1 BMAD pilot docs
archived: 2026-08-05
reason: >-
  E4 (fiche 0039, ADR-029) removed BMAD from the cop1 prod graph. These documents
  described the V1-light BMAD orchestrator pilot (playbook format, version audit).
  Dogfood on vectorz now uses mega-city (ezk-backlog / ezk-sprint). BMAD on an
  external project remains optional via `cop1 init-bmad-bridge` (ADR-032 ; fiche 0162).
---

# Epoch-1 BMAD archive

Moved here by fiche **0182** (E4 bis doc cleanup). Do not follow these for vectorz dogfood.

| File | Was | Describes |
|---|---|---|
| `bmad-version-audit.md` | `docs/bmad-version-audit.md` | Gap audit BMAD 6.0.0-Beta.8 vs upstream 6.3.0 (2026-04-15). |
| `supervisor-playbook.md` | `products/cop1/supervisor-playbook.md` | Minimal BMAD playbook loaded by the removed `cop1 orchestrator run`. |

**Current equivalents**

- **Onboarding (epoch 2)** → [`docs/GETTING_STARTED.md`](../../GETTING_STARTED.md)
- **Run supervision on a project** → [`docs/running-cop1-on-a-project.md`](../../running-cop1-on-a-project.md)
- **Branch an external method (e.g. BMAD)** → [`docs/brancher-une-methode-existante.md`](../../brancher-une-methode-existante.md)
- **E4 code removal** → fiche [0039](../../../features/done/0039-e4-retrait-bmad.md), [ADR-029](../../adr/ADR-029-emancipation-bmad-politique-archivage.md)
