---
id: 0004
title: migrer ezk-commits vers skills/
type: chore
priority: P1
status: shipped
pr: local (squash-merge)
created: 2026-06-26
---

## Contexte / Problème
Valider que le corpus skills host-agnostique tient sur un vrai skill. Premier pas concret
de l'absorption de `claude-skills` comme Catalogue 2 (cf. [`docs/adr/0006`](../../docs/adr/0006-absorber-claude-skills-catalogue2.md)).

## Proposition
Importer `ezk-commits` depuis `claude-skills` dans `skills/`, sans casser l'original (strangler-fig).

## Critères d'acceptation
- [ ] `ezk-commits` présent dans `skills/` et bindable via un profil
- [ ] `claude-skills` reste intact

## Notes
Rattaché à ADR-0006 (absorber claude-skills). Voir aussi 0017 (cap global ~/.claude) et
0018 (mode link/copy), prérequis au débranchement de `claude-skills`.
