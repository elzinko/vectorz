---
title: cop1 / vectorz — Documentation index
status: living doc map (epoch 2) — les artefacts BMAD d'époque-1 sont archivés, plus source-of-truth.
---

# cop1 / vectorz — Documentation Index

> Carte du dossier `docs/` pour l'**époque 2** (dogfood mega-city + supervision cop1). Le point d'entrée du projet reste le [README](../README.md) (pitch + quickstart). Les artefacts de planification BMAD d'époque-1 (`prd`, `epics`, `architecture`, `adr-010…014`, `sprint-status.yaml`) ont été **retirés du dépôt** avec le backend pilote (E4 / [ADR-029](./adr/ADR-029-emancipation-bmad-politique-archivage.md), fiche [0039](../features/done/0039-e4-retrait-bmad.md)) — ce qui a été conservé est sous l'[archive époque-1](#epoch-1-bmad-archive).

## Onboarding & run

- [Getting Started](./GETTING_STARTED.md) — epoch-2 onboarding (mega-city + cop1 supervision).
- [Running cop1 on a project](./running-cop1-on-a-project.md) — dogfood loop: ezk-start → ezk-sprint, daemon, journal.
- [Dogfood — vérifier que ça marche](./DOGFOOD.md) — la chaîne méthode → journal → Moniteur, prouvée en 15–30 min.
- [Guide — brancher une méthode existante](./brancher-une-methode-existante.md) — compagnon lisible de l'ADR-032 (gravé 2026-07-17) : la méthode parle elle-même, les deux groupes de messages, les trois branchements (consignes / **sidecar** / observation), l'exemple BMAD pas à pas, les pièges d'archi rencontrés et leurs solutions.

## Design records

- [Index des ADR](./adr/README.md) — journal de décisions (registre complet), **source de vérité** de l'architecture époque-2.
- [Brownfield Snapshot](./brownfield-snapshot.md) — snapshot d'architecture profond du 2026-04-15 (session de confrontation pré-pivot) : **historique** — pour l'état courant, lire les ADR.

## Articles & notes de lecture

- [Capture 2026-07-13 — contrat de méthode & versions](./captures/2026-07-13-contrat-methode-et-versions.md) — pré-ADR : décisions D1–D6 (pas de hot-migration, adoption aux gates, contrat d'étape fail-safe, cop1 exige une méthode), repositionnement mega-city = implémentation de référence du contrat, dettes repérées, découpage en fiches/ADRs.
- [Article — le contrat de supervisabilité](./articles/contrat-de-supervisabilite.md) — article de fond (fiche 0025), v2 accessible : récit, tour de contrôle, 5 clauses, squelette v0, siège d'autorité, voisins. Base citable des ADRs ; publication externe différée. La [v1 détaillée](./articles/contrat-de-supervisabilite-v1.md) (positionnement source par source, lignée, glossaire) reste la référence de profondeur.
- [Notes de lecture — sources du contrat de supervisabilité](./captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md) — phase 1 de la fiche 0025 : vérification première main de Rel(AI)Build, Agent Protocol, A2A v1.0, Faramesh + 2 affirmations tierces ; corrections appliquées au prior-art.
- [Article — les fenêtres de mise à jour](./articles/fenetres-de-mise-a-jour.md) — article de fond (fiche 0026) : la clause 5 du contrat corrigée — un jalon n'est pas forcément un point stable ; l'éligibilité de mise à jour (`upgrade_ok`) est déclarée par la méthode, jamais déduite par le superviseur. Tournée première main : Temporal, Restate, Kubernetes, gh-ost, Erlang/OTP, blue-green/canary. Publication externe différée.
- [Notes de lecture — fenêtres de mise à jour](./captures/2026-07-13-notes-lecture-fenetres-mise-a-jour.md) — phase 1 de la fiche 0026 : lecture première main des 6 systèmes qui mettent à jour pendant que ça travaille ; grille « qui déclare l'éligibilité », citations vérifiées + contre-vérifiées par grep.

## Runtime artefacts (not docs)

- [`supervisor-playbook.md`](../products/cop1/supervisor-playbook.md) — **deprecated stub** ; epoch-1 BMAD playbook archived under [`docs/archive/epoch-1-bmad/`](./archive/epoch-1-bmad/README.md).
- [`cop1.config.example.yaml`](../cop1.config.example.yaml) — gabarit versionné ; le `cop1.config.yaml` réel est gitignoré, local à chaque poste.

## Epoch-1 BMAD archive

Pilot-era BMAD docs (orchestrator playbook, version audit) — **not** the vectorz dogfood path since E4 (0039):

- [`docs/archive/epoch-1-bmad/`](./archive/epoch-1-bmad/README.md) — playbook + `bmad-version-audit.md` (was at repo root / `docs/`).

## Pre-Phase-A archive

Four root-level docs that described the pre-pivot product (REST API, SQLite, old package names) were moved on 2026-04-15 to [`docs/archive/pre-phase-a/`](./archive/pre-phase-a/). Their internal links point at the old structure **by design** (frozen snapshot). See the brownfield snapshot §10.1 for the drift analysis.
