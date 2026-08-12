# Running cop1 on a project (epoch 2)

How to supervise agent work on a target project with **cop1 + mega-city**, not the removed
BMAD orchestrator pilot. Updated 2026-08 (fiche 0182).

## 1. Prerequisites

- **Built tree** — `pnpm install && pnpm build` at the repo root.
- **Claude auth** — credentials for Claude Code / Agent SDK (`ANTHROPIC_API_KEY` or OAuth).
- **Backlog on `main`** — `features/` committed on the default branch (see `ezk-backlog`).
- **Optional** — `cop1.config.yaml` in the project (from `cop1 init`).

### Auth setup

cop1 does **not** auto-load `.env`. Export tokens into the shell before runs:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
# or
export CLAUDE_CODE_OAUTH_TOKEN=sk-ant-oat01-...
claude -p "say OK"   # must succeed before any agent session
```

## 2. Typical dogfood loop (vectorz)

1. **`ezk-start`** — opening guard: dirty tree, worktrees, fiches `in-progress`, handoff, PLAN head.
2. **`ezk-sprint`** — pick next ready fiche from `PLAN.md`, branch `feat/<id>-<slug>`, implement, PR, CI, ship fiche.
3. **`cop1 start`** — run the supervision daemon while the Moniteor watches runs/journal.
4. **`ezk-archive`** — close the session (handoff, optional session log in `docs/sessions/`).

Backlog rules: one fiche = one PR ; ship = separate docs PR after merge (`ezk-backlog ship`).

## 3. Start the supervision daemon

```bash
node products/cop1/packages/app/dist/cli/index.js start
# optional: --port 4242
```

- Health: `cop1 health` (JSON)
- Lifecycle: `cop1 status`, `cop1 stop`
- Supervision API: Moniteor / `GET /api/supervision/runs` (see [ADR-028](adr/ADR-028-lecteur-journal-mode-moniteur.md))

Artifacts under `.cop1/` (journal, metrics, history) follow the supervisability contract — the method emits; cop1 observes and gates.

## 4. What keeps "done" honest (epoch 2)

| Gate | Where |
|---|---|
| Definition of Ready | `ezk-backlog ready <id>` before a fiche is tirable |
| Sprint coherence | `ezk-start` alert before parallel sprints |
| Code quality | CI on each feature PR (lint · build · test) |
| Supervision | Journal messages + Moniteor run state |
| Ship | Fiche → `features/done/` only after merge + explicit `ship` |

The removed BMAD runner gates (evidence / verify / review-verdict on `sprint-status.yaml`) applied to epoch 1 only. Story state now lives in fiche front-matter + git.

## 5. External project with BMAD (not vectorz dogfood)

Use the sidecar installer — **do not** follow the archived playbook as the main path:

```bash
cop1 init-bmad-bridge
```

Guide: [`brancher-une-methode-existante.md`](brancher-une-methode-existante.md). Full contract: fiche [0162](../features/0162-bmad-contrat-supervisabilite.md).

Archived epoch-1 playbook: [`docs/archive/epoch-1-bmad/supervisor-playbook.md`](archive/epoch-1-bmad/supervisor-playbook.md).

## 6. Observe a run

- **Moniteor** — open the web UI (when running) for runs, journal tail, gates.
- **Journal** — `.cop1/events.jsonl` (and related tracks per project config).
- **Backlog state** — `features/BACKLOG.md`, `features/PLAN.md`.

`cop1 transcript` was epoch-1 only — removed; use journal + session archive instead.

## 7. Reset a disposable test bed

```bash
git checkout -- . && git clean -fdq
rm -rf .cop1
```

## 8. Removed commands (epoch 1)

If invoked, these print an epoch-2 hint and exit non-zero:

- `cop1 orchestrator run --epic …`
- `cop1 sprint run` / `cop1 sprint status`

Use `ezk-sprint` and fiche front-matter instead.
