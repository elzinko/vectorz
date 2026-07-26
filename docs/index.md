---
title: cop1 — Documentation index
generated: 2026-04-15 (document-project, adapted single-artefact mode)
status: working — the deep artefact is `brownfield-snapshot.md`; this index is a shortcut.
---

# cop1 — Documentation Index

> **Read first.** `docs/brownfield-snapshot.md` is the working deep document generated on 2026-04-15 to support an architecture confrontation session. Start there. Everything else here either feeds into it or is the authoritative source it summarizes.

## Working documents (this scan)

- [Brownfield Snapshot](./brownfield-snapshot.md) — identity, real package map, execution flows, ADR inventory, drift ledger, open confrontation points.
- [Capture 2026-07-13 — contrat de méthode & versions](./captures/2026-07-13-contrat-methode-et-versions.md) — pré-ADR : décisions D1–D6 (pas de hot-migration, adoption aux gates, contrat d'étape fail-safe, cop1 exige une méthode), repositionnement mega-city = implémentation de référence du contrat, dettes repérées, découpage en fiches/ADRs.
- [Article — le contrat de supervisabilité](./articles/contrat-de-supervisabilite.md) — article de fond (fiche 0025), v2 accessible : récit, tour de contrôle, 5 clauses, squelette v0, siège d'autorité, voisins. Base citable des ADRs ; publication externe différée. La [v1 détaillée](./articles/contrat-de-supervisabilite-v1.md) (positionnement source par source, lignée, glossaire) reste la référence de profondeur.
- [Notes de lecture — sources du contrat de supervisabilité](./captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md) — phase 1 de la fiche 0025 : vérification première main de Rel(AI)Build, Agent Protocol, A2A v1.0, Faramesh + 2 affirmations tierces ; corrections appliquées au prior-art.
- [Article — les fenêtres de mise à jour](./articles/fenetres-de-mise-a-jour.md) — article de fond (fiche 0026) : la clause 5 du contrat corrigée — un jalon n'est pas forcément un point stable ; l'éligibilité de mise à jour (`upgrade_ok`) est déclarée par la méthode, jamais déduite par le superviseur. Tournée première main : Temporal, Restate, Kubernetes, gh-ost, Erlang/OTP, blue-green/canary. Publication externe différée.
- [Notes de lecture — fenêtres de mise à jour](./captures/2026-07-13-notes-lecture-fenetres-mise-a-jour.md) — phase 1 de la fiche 0026 : lecture première main des 6 systèmes qui mettent à jour pendant que ça travaille ; grille « qui déclare l'éligibilité », citations vérifiées + contre-vérifiées par grep.
- [Guide — brancher une méthode existante](./brancher-une-methode-existante.md) — compagnon lisible de l'ADR-032 (gravé 2026-07-17) : la méthode parle elle-même, les deux groupes de messages, les trois branchements (consignes / **sidecar** / observation), l'exemple BMAD pas à pas, les pièges d'archi rencontrés et leurs solutions.
- [Getting Started](./GETTING_STARTED.md) — current user-facing contract (V1-light as of 2026-04-14).
- [Running cop1 on a project](./running-cop1-on-a-project.md) — practical run guide: auth setup, the run command, safety gates (evidence / verify / review-verdict), transient `claude.status` handling, observability, reset.

## Authoritative planning artefacts

All live under `_bmad-output/planning-artifacts/`. Treat these as source-of-truth over any surface docs at the repo root.

### Product
- [`prd.md`](../_bmad-output/planning-artifacts/prd.md) — 823 L, edited through 2026-04-14. CA1–CA16, 139 active FRs, NFR1–34.
- [`epics.md`](../_bmad-output/planning-artifacts/epics.md) — 2645 L, epic/story catalog (E1–E12, EA1–EA11).
- [`ux-design-brief.md`](../_bmad-output/planning-artifacts/ux-design-brief.md) — UI horizon (Sprint 10+).

### Architecture
- [`architecture.md`](../_bmad-output/planning-artifacts/architecture.md) — 1608 L. Main decisions doc. For the current state, read §ADR-006 onwards.
- [`adr-010-iamthelaw-integration-consultation.md`](../_bmad-output/planning-artifacts/adr-010-iamthelaw-integration-consultation.md)
- [`adr-011-cop1-distribution-and-autonomous-orchestration.md`](../_bmad-output/planning-artifacts/adr-011-cop1-distribution-and-autonomous-orchestration.md)
- [`adr-012-multi-turn-bmad-interaction.md`](../_bmad-output/planning-artifacts/adr-012-multi-turn-bmad-interaction.md) — Agent SDK + LLM Supervisor.
- [`adr-013-orchestrator-sprintrunner-separation.md`](../_bmad-output/planning-artifacts/adr-013-orchestrator-sprintrunner-separation.md) — 525 L. EA10 seam.
- [`adr-014-supervisor-tool-interface.md`](../_bmad-output/planning-artifacts/adr-014-supervisor-tool-interface.md) — 1097 L. In-process MCP 6-tool catalog. **Most novel piece.**

### Sprint Change Proposals (chronological)

Listed in the snapshot §9. Latest two worth keeping warm:
- `sprint-change-proposal-2026-04-14.md` (absent du dépôt — jamais commité) — PRD ↔ epics sync, EA4↔EA5 dep cycle break, EA11 reframe, NFR26–34 mapping, +E5-S13.
- [`sprint-change-proposal-2026-04-14-readiness-fixes.md`](../_bmad-output/planning-artifacts/sprint-change-proposal-2026-04-14-readiness-fixes.md) — copy-paste epic patches.

### Implementation state
- [`sprint-status.yaml`](../_bmad-output/implementation-artifacts/sprint-status.yaml) — BMAD-owned, source-of-truth for story statuses (ADR-009).
- [`epic-ea10-ea11-retro-2026-04-14.md`](../_bmad-output/implementation-artifacts/epic-ea10-ea11-retro-2026-04-14.md) — most recent retro. Closes V1-light. Reveals V1.1 gaps.
- [`implementation-readiness-report-2026-04-14.md`](../_bmad-output/planning-artifacts/implementation-readiness-report-2026-04-14.md) — post-SCP readiness check.
- [`supervisor-playbook-format.md`](../_bmad-output/planning-artifacts/supervisor-playbook-format.md) — playbook schema.
- [`supervisor-playbook-reference.md`](../_bmad-output/planning-artifacts/supervisor-playbook-reference.md) — canonical reference playbook.

## Runtime artefacts (not docs)
- [`supervisor-playbook.md`](../products/cop1/supervisor-playbook.md) — the minimal playbook the orchestrator loads by default.
- [`cop1.config.example.yaml`](../cop1.config.example.yaml) — gabarit versionné ; le `cop1.config.yaml` réel est gitignoré, local à chaque poste. Runtime config (pre-pivot, mostly dormant — see snapshot §10.4).

## Pre-Phase-A archive

Four root-level docs that described the pre-pivot product (REST API, SQLite, old package names) were moved on 2026-04-15 to [`docs/archive/pre-phase-a/`](./archive/pre-phase-a/). `README.md` was rewritten to point here. See snapshot §10.1 for the drift analysis.

## What is NOT generated

The standard `document-project` workflow would normally emit `api-contracts.md`, `data-models.md`, `deployment-guide.md`, `integration-architecture.md`, and per-part architecture files. They are deliberately omitted here:
- No HTTP API surface today (REST planned Sprint 10+, see FR135 re-tagged).
- No database — persistence is file-based YAML + JSONL + markdown (see snapshot §6.3).
- No deployment target — local CLI, distribution deferred to EA8.
- Single-part project — integration is internal, already covered by the snapshot §5 flows.

When any of those surfaces becomes real, generate them then — not now.
