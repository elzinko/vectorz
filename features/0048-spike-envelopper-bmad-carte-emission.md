---
id: 0048
title: Spike — envelopper BMAD avec une carte d'émission (prouver la séparabilité émission/logique)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0048 — Spike : envelopper BMAD avec une carte d'émission

## Contexte / Problème

Le PO l'a formulé comme « un sujet important » : peut-on **séparer** la logique d'un
skill/agent de l'**émission** de ses événements, au point de rendre **BMAD conforme au
contrat de supervisabilité sans le réécrire** ? L'ADR-032 pose le **pattern** (émission =
adaptateur séparable) ; ce **spike le prouve empiriquement** avant d'investir davantage.

> **Proposition produite par la cérémonie `ezk-retro`** (dry-run 2026-07-16, lentille architecte).

## Proposition

Écrire **UNE carte d'émission** pour BMAD, couvrant **≥3 moments observables** au bord
(`run.started`, `gate.reached`, `escalation`), sans toucher au corps de BMAD.

- **Critère de succès (mesurable)** : l'app moniteur (**aveugle à la méthode**) reçoit **≥3
  événements conformes** au contrat gelé (2026-07-13), avec **0 ligne de source BMAD modifiée**.
- Si ça marche → la séparabilité (ADR-032) est prouvée, et le **pont BMAD** existe **avant son
  retrait E4** (fiche 0039). Si ça coince → on apprend où l'émission ne peut PAS se découpler
  (résultat tout aussi utile).

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- **Spike** (exploration à résultat mesurable), pas une feature de prod. Valide l'hypothèse de
  l'**ADR-032**. Compose le contrat de supervisabilité (capture `2026-07-13`, D12 : « l'émission
  est un adaptateur jetable » ; shim superviseur admis comme pont BMAD).
- Lié : ADR-032, fiche 0039 (retrait BMAD), subtree 0067 (ezk-ezk contract-aware).
  Origine : cérémonie `ezk-retro` (dry-run 2026-07-16).
