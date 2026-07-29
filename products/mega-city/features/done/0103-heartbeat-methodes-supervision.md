---
id: 0103
title: "Les méthodes envoient un heartbeat — le Moniteur ne crie plus « silence » à tort"
type: feature
priority: P1
epic:
depends: []
labels: [method, supervision, ux]
status: shipped
ready: 2026-07-29
pr:
created: 2026-07-29
product: mega-city
---

# 0103 — Heartbeat des méthodes (signe de vie pendant un run)

## En une phrase

Quand Claude Code travaille longtemps **sans jalon** (gate), le Moniteur doit encore
voir que le run est vivant — aujourd’hui une seule ligne `run.started` puis plus rien
fait basculer « Silence prolongé » dès qu’on met la session en pause.

## Contexte / Problème

Dogfood 2026-07-29 (vectorz) — voir issue #63 / fiche 0105.

## Livré

1. Outil MCP **`heartbeat`** (+ runtime / journal) — kit = **6 outils**.
2. Refus de `heartbeat` si un gate est ouvert (silence au jalon voulu / validateur).
3. Consignes d’émission dans `ezk-sprint`, `ezk-product-builder`, `vz-product-builder`,
   `supervision-demo` ; banc `bin/supervision-demo-run.ts` émet des heartbeats.
4. Phrase UX Moniteur : jalons ≠ chaque action Claude Code.
5. Tests : runtime + probe + MCP e2e + contrat d’émission (278 verts mega-city supervision).

## Critères d'acceptation

- [x] Kit MCP expose `heartbeat` ; journal append `type: heartbeat` sur run ouvert.
- [x] `heartbeat` refusé hors run / après `run_finished` / **pendant gate ouvert**.
- [x] Skills émettrices consignes `heartbeat` (≥2 mentions, contrat anti-récidive).
- [x] Phrase UX Moniteur (start / heartbeat / gates / fin).
- [ ] Dogfood humain post-merge : sprint réel avec heartbeats → pas de Silence pendant
      le travail ; standby sans heartbeat → Silence (comportement voulu).

## Notes / décisions

- Issue : https://github.com/elzinko/vectorz/issues/63
- Complète **0104** (analyze) et **0105** (bug P0) — 0105 reste ouvert jusqu’au dogfood.
- Relancer Claude Code après merge pour recharger les 6 outils MCP.
