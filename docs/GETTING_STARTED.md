# Getting Started with vectorz (epoch 2)

> **Status (2026-08):** Dogfood method = **mega-city** (`ezk-backlog`, `ezk-sprint`, `ezk-sprint:check`, `ezk-archive`). Supervision = **cop1** daemon + Moniteur. The epoch-1 BMAD orchestrator (`cop1 orchestrator run`) was removed from prod — those CLI commands now print an epoch-2 hint.

## Comprendre la méthode (avant de lancer)

`pnpm ezk:map` ouvre la **carte interactive** (3 étages moteur / méthode / modules, toutes les cérémonies scrum, onglet 🧭 « le domaine »). Jargon `ezk-*` traduit dans [`glossaire-jargon-ezk.md`](glossaire-jargon-ezk.md).

## Prerequisites

- Node.js >= 20
- pnpm >= 9
- Git
- Claude Code CLI (for agent sessions) with credentials (`ANTHROPIC_API_KEY` or OAuth token)

## Install + build

```bash
pnpm install
pnpm build
pnpm test
pnpm typecheck
```

## What you run today

| Layer | Role | Entry points |
|---|---|---|
| **Backlog** | Features, plan, ship | `features/` + skill `ezk-backlog` |
| **Sprint** | Build one fiche end-to-end | skill `ezk-sprint` (intake starts with `ezk-sprint:check`) |
| **Supervision** | Journal, runs, gates | `cop1 start` → Moniteur UI / API |
| **External BMAD** | Optional sidecar on another repo | `cop1 init-bmad-bridge` — not vectorz dogfood |

### 1. Backlog (ezk-backlog)

- Fiches live in `features/` (front-matter YAML = source of truth).
- Sequence in `features/PLAN.md` ; index in `features/BACKLOG.md` (regenerated).
- Read the skill: [`products/mega-city/skills/ezk-backlog/SKILL.md`](../products/mega-city/skills/ezk-backlog/SKILL.md).

### 2. Sprint intake (ezk-sprint:check → ezk-sprint)

Before a sprint, run the opening guard (read-only): worktrees, fiches `in-progress`, handoff, PLAN head.

Then `ezk-sprint` pulls the next **ready** fiche (`feat/<id>-<slug>`), builds, opens a PR, waits for CI, ships the fiche on `main`.

Skill: [`products/mega-city/skills/ezk-sprint/SKILL.md`](../products/mega-city/skills/ezk-sprint/SKILL.md).

### 3. Supervision daemon (cop1)

```bash
# From the repo root (or target project with cop1.config.yaml)
node products/cop1/packages/app/dist/cli/index.js start
node products/cop1/packages/app/dist/cli/index.js status
node products/cop1/packages/app/dist/cli/index.js stop
```

The daemon exposes health and supervision APIs consumed by Moniteor. Runs emit to `.cop1/` (journal, metrics) per the supervisability contract ([ADR-028](adr/ADR-028-lecteur-journal-mode-moniteur.md)).

### 4. Removed epoch-1 commands

These still exist as CLI stubs but **exit with an epoch-2 message** — do not document them as the main path:

- `cop1 orchestrator run`
- `cop1 sprint run` / `cop1 sprint status`
- `cop1 transcript`

## Package layout (cop1)

```
products/cop1/packages/
  shared-kernel/        — shared types, config
  observability/        — logging, metrics
  sprint-core/          — supervision adapters (hex architecture)
  llm-intelligence/     — LLM gateway
  ceremony-engine/      — ceremonies
  app/                  — CLI (start, init, init-bmad-bridge, …)
  web/                  — Moniteur (React)
```

mega-city skills and profiles live under `products/mega-city/`.

## Branching an external method (BMAD)

See [`docs/brancher-une-methode-existante.md`](brancher-une-methode-existante.md). Full BMAD supervisability contract = fiche [0162](../features/0162-bmad-contrat-supervisabilite.md) (LATER).

## Epoch-1 BMAD docs (archive only)

- Playbook + version audit → [`docs/archive/epoch-1-bmad/`](archive/epoch-1-bmad/README.md)
- E4 code removal → fiche [0039](../features/done/0039-e4-retrait-bmad.md)

## Further reading

- [`docs/running-cop1-on-a-project.md`](running-cop1-on-a-project.md) — practical supervision runbook
- [`docs/index.md`](index.md) — full doc map
- [`docs/brownfield-snapshot.md`](brownfield-snapshot.md) — system state
- [`docs/adr/README.md`](adr/README.md) — architecture decisions
