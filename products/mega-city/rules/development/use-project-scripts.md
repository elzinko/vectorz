---
id: development/use-project-scripts
kind: disposition
level: MUST
title: Use Project Scripts as Source of Truth
---

- MUST prioritize and maximize use of npm/pnpm scripts defined in package.json files:
  - Root project package.json
  - Sub-folders (apps, services, packages) if specific scripts are defined
- DO NOT execute underlying commands directly (turbo, eslint, docker compose) if equivalent npm/pnpm script exists
- If operational scripts exist (infra/docker/scripts/*):
  - MUST be the standard interface used by npm/pnpm scripts
  - SHOULD manage lifecycle by environment (local|ci|staging|prod)
  - SHOULD centralize setup/start/stop/logs/wait/deploy

## Commands must be CWD-independent

Any command written for someone else to run — PR body, fiche "how to verify / how to launch", README — MUST work from **anywhere inside the repo**, not only from a specific directory.

- DO NOT prefix with a bare `cd <subdir> &&` (e.g. `cd apps/desktop && …`): it breaks the moment the reader is already in that subdir, in a nested folder, or in a git worktree — the normal case, not an edge case.
- PREFER the workspace-script form, which needs no `cd`: `pnpm --filter <workspace> run <script>` (equivalently the npm/yarn workspace form). It resolves the same package from any folder of the repo.
  - This applies to **launch/preview** commands (starting the app to test by hand) as much as to tests/lint/build. Launching the app to test manually is the primary "test" for most humans.
- WHEN a specific working directory is genuinely required (a bespoke `scripts/*.sh`), **change into** the anchored directory first — do not merely locate the file by path: `cd "$(git rev-parse --show-toplevel)" && bash scripts/<name>.sh` (or `.../<path> && …`). Merely running `bash "$(git rev-parse --show-toplevel)/scripts/<name>.sh"` finds the script but still inherits the caller's CWD, so any relative path the script reads resolves against the wrong directory. `git rev-parse --show-toplevel` resolves the **current worktree's** root, so it stays correct across worktrees.
- A bespoke script SHOULD also anchor its own working directory (e.g. `cd "$(git rev-parse --show-toplevel)"` near its top), so it behaves the same however it is invoked — belt and suspenders with the caller-side anchor above.
- Honest limit — this means "anywhere **inside** the repo", not literally anywhere on the machine: from outside the repo, package managers cannot locate the workspace, and an absolute path is not shareable across machines. State launch commands as run from within the repo.

Rationale: the invocation must not encode a fragile assumption about the reader's shell state; the project's own scripts are the portable, CWD-independent interface to it.
