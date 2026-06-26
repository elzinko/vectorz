---
id: 0001
title: lawgiver bind — cap claude-code (MVP déterministe)
type: feature
priority: P0
status: todo
pr:
created: 2026-06-26
---

## Contexte / Problème
Prouver que « charger d'un coup » marche. C'est le cœur déterministe (ADR-0001).

## Proposition
`bind <profile> <projet>` : `expand(profile)` (extends + dédup, pure data) → matérialise via le cap claude-code :
`.claude/agents/*`, `.claude/skills/*`, `.iamthelaw/ENTRY.md`, `.git/hooks/*`, réf dans `CLAUDE.md`.

## Critères d'acceptation
- [ ] `expand(mobile)` résout bundles (mobile→base) + agents + skills, dédupliqué
- [ ] `bind` écrit un `.claude/` cohérent sur un projet jouet
- [ ] 100 % déterministe (aucun appel LLM dans le chemin d'écriture), testé
- [ ] langage libre : bash+py (cf. link-project.sh) ou TS

## Notes
Convergence de `link-project.sh` (skills/agents) + `iamthelaw setup claude` (règles/hooks).
