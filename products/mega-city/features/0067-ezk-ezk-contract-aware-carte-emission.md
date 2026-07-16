---
id: 0067
title: ezk-ezk contract-aware — génère un skill/agent + sa carte d'émission séparée (conforme au contrat)
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0067 — ezk-ezk contract-aware (skill + carte d'émission)

## Contexte / Problème

Créer des skills/agents c'est bien, mais ceux **de la méthode** doivent pouvoir **émettre les
événements** du contrat de supervisabilité (sinon l'app moniteur ne voit rien). `ezk-ezk` crée
déjà des skills depuis une session — mais **rien ne garantit qu'ils soient conformes** (qu'ils
émettent). Il manque un `ezk-ezk` **contract-aware**.

> **Proposition produite par la cérémonie `ezk-retro`** (dry-run 2026-07-16, lentilles
> architecte + QA + PM). **Dépend de l'ADR-032** (le pattern d'émission séparable).

## Proposition

`ezk-ezk` contract-aware **ne doit PAS instrumenter le corps du skill** (ça couplerait la
logique au contrat) mais **générer la carte d'émission comme artefact SÉPARÉ** à côté du skill
(cf. ADR-032) :

- Sortie = `SKILL.md` (**0 référence au contrat**) **+** `emission-map.<fmt>` (le mapping
  *moment observable → event du contrat*).
- **Critère de succès mesurable** : le skill généré ne contient **aucune** référence au contrat
  **ET** sa carte d'émission **valide contre le schéma du contrat** (lint vert).
- **Test « golden events »** (compose 0066) : pour chaque scénario Gherkin, la trace
  `events.jsonl` produite **matche une fixture de référence** (types + ordre, payload en
  subset-match), en dry-run **sans effet de bord réel**.

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- **Ordre** (validé par la lentille PM) : **ADR-032 (le pattern) → 0067 (la fabrique)** —
  trancher le pattern d'émission AVANT de l'implémenter évite de coder deux fois l'émission.
- Compose `ezk-ezk`. Dépend de **ADR-032** (vectorz). Lié 0066 (test golden events).
  Origine : cérémonie `ezk-retro` (dry-run 2026-07-16).
