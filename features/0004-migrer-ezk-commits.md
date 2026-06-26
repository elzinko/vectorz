---
id: 0004
title: migrer ezk-commits vers skills/
type: chore
priority: P1
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Valider que le corpus skills host-agnostique tient sur un vrai skill.

## Proposition
Importer `ezk-commits` depuis `claude-skills` dans `skills/`, sans casser l'original (strangler-fig).

## Critères d'acceptation
- [ ] `ezk-commits` présent dans `skills/` et bindable via un profil
- [ ] `claude-skills` reste intact
