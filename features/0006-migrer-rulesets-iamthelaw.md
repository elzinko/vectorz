---
id: 0006
title: migrer les rulesets iamthelaw vers rules/ + bundles/
type: chore
priority: P2
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Les 10 rulesets `iamthelaw` existants doivent rejoindre le catalogue LOI, à ton rythme.

## Proposition
Atomiser chaque ruleset en `rules/` (markdown + frontmatter kind/level/enforcements), regroupés en `bundles/`.

## Critères d'acceptation
- [ ] au moins clean-code, conventional-commits, ci-cd migrés
- [ ] `iamthelaw` d'origine intact
