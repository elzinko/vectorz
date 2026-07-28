---
title: Vectorz — Documentation index
generated: 2026-04-15 (document-project) · mis à jour 2026-07-28 (époque 2)
status: working — époque 2 : Moniteur + mega-city ; BMAD en fin de vie.
---

# Vectorz — Documentation Index

> **Époque 2.** Commencer par le [programme de refonte](./PROGRAMME-REFONTE.md) et
> l'[audit du 2026-07-27](./audits/2026-07-27-transition-epoch-2.md).
> Le snapshot brownfield avril 2026 reste une archive utile, pas le contrat d'onboarding.

## Docs vivantes (époque 2)

- [Programme — Refonte époque 2](./PROGRAMME-REFONTE.md) — phases, checkboxes, journal
- [Audit transition 2026-07-27](./audits/2026-07-27-transition-epoch-2.md)
- [Inventaire BMAD runtime](./audits/2026-07-28-bmad-runtime-inventory.md)
- [Mapping ids backlog 0064](./audits/2026-07-28-backlog-id-map.md)
- [Getting Started](./GETTING_STARTED.md) — onboarding Vectorz (pas BMAD-first)
- [README racine](../README.md)
- [mega-city](../products/mega-city/README.md)
- [Portfolio](../PORTFOLIO.md)

## Working documents (scan historique)

- [Brownfield Snapshot](./brownfield-snapshot.md) — identity, real package map, execution flows, ADR inventory, drift ledger, open confrontation points *(archive 2026-04)*.
- [Capture 2026-07-13 — contrat de méthode & versions](./captures/2026-07-13-contrat-methode-et-versions.md) — pré-ADR : décisions D1–D6 (pas de hot-migration, adoption aux gates, contrat d'étape fail-safe, cop1 exige une méthode), repositionnement mega-city = implémentation de référence du contrat, dettes repérées, découpage en fiches/ADRs.
- [Article — le contrat de supervisabilité](./articles/contrat-de-supervisabilite.md) — article de fond (fiche 0025), v2 accessible : récit, tour de contrôle, 5 clauses, squelette v0, siège d'autorité, voisins. Base citable des ADRs ; publication externe différée. La [v1 détaillée](./articles/contrat-de-supervisabilite-v1.md) (positionnement source par source, lignée, glossaire) reste la référence de profondeur.
- [Notes de lecture — sources du contrat de supervisabilité](./captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md) — phase 1 de la fiche 0025 : vérification première main de Rel(AI)Build, Agent Protocol, A2A v1.0, Faramesh + 2 affirmations tierces ; corrections appliquées au prior-art.
- [Article — les fenêtres de mise à jour](./articles/fenetres-de-mise-a-jour.md) — article de fond (fiche 0026) : la clause 5 du contrat corrigée — un jalon n'est pas forcément un point stable ; l'éligibilité de mise à jour (`upgrade_ok`) est déclarée par la méthode, jamais déduite par le superviseur. Tournée première main : Temporal, Restate, Kubernetes, gh-ost, Erlang/OTP, blue-green/canary. Publication externe différée.
- [Notes de lecture — fenêtres de mise à jour](./captures/2026-07-13-notes-lecture-fenetres-mise-a-jour.md) — phase 1 de la fiche 0026 : lecture première main des 6 systèmes qui mettent à jour pendant que ça travaille ; grille « qui déclare l'éligibilité », citations vérifiées + contre-vérifiées par grep.
- [Guide — brancher une méthode existante](./brancher-une-methode-existante.md) — compagnon lisible de l'ADR-032 (gravé 2026-07-17) : la méthode parle elle-même, les deux groupes de messages, les trois branchements (consignes / **sidecar** / observation), l'exemple BMAD pas à pas, les pièges d'archi rencontrés et leurs solutions.
- [Running cop1 on a project](./running-cop1-on-a-project.md) — practical run guide: auth setup, the run command, safety gates (evidence / verify / review-verdict), transient `claude.status` handling, observability, reset.

## Authoritative planning artefacts

> **Époque 1 — hors tree.** Ancien corpus `_bmad-output/` (prd, epics, architecture,
> planning-ADRs, sprint-status…). Purge 2026-07-28 (dogfood mega-city sans BMAD).
> **Source :** tag git `epoch-1-bmad-final`. Inventaire :
> [`audits/2026-07-28-bmad-runtime-inventory.md`](./audits/2026-07-28-bmad-runtime-inventory.md).

```bash
git show epoch-1-bmad-final:_bmad-output/planning-artifacts/architecture.md | less
```

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
