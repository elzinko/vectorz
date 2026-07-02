---
id: 0024
title: Migration claude-skills → mega-city — finir le strangler-fig (skills + agents restants → switchover)
type: chore
priority: P1
version:
status: todo
pr:
created: 2026-07-03
---

# 0024 — Finir la migration claude-skills → mega-city (strangler-fig)

## Contexte / Problème

ADR-0006 a décidé d'absorber `claude-skills` comme **Catalogue 2** en strangler-fig. **L'infra est
désormais prête** : `cap global ~/.claude` (fiche 0017 ✅) + `mode link vs copy` (fiche 0018 ✅) →
`bind --global <profile>` installe skills+agents en **symlink live** (comme le faisait `install.sh`).

Mais la migration du **contenu** est ~33 % faite (4 skills, 1 agent) et il **n'existe pas de vue
d'ensemble** de ce qui reste. Cette fiche est le **tracker** jusqu'au switchover. Les fiches
per-skill (ex. 0019 ezk-design-system) restent la maille d'exécution ; celle-ci est l'ombrelle.

État au 2026-07-03 :
- Migrés dans `mega-city/skills/` : ezk-archive, ezk-commits, ezk-ezk, ezk-product-builder.
- Migré dans `mega-city/agents/` : ezk-reviewer.

## Proposition — checklist jusqu'au switchover

**Skills restants (8)** — copier `SKILL.md` (+ helpers) dans `skills/`, adapter les refs :
- [ ] **ezk-backlog** — ⚠️ **porter la version claude-skills PR #31** (add dédoublonnant +
  regroupement + champ `version` + cadrage brainstorm d'une fiche vague). Ça **satisfait la
  fiche 0022** (« proposer un brainstorm pour façonner une fiche vague ») → fermer 0022 au passage.
- [ ] ezk-sprint  · [ ] ezk-ci  · [ ] ezk-preview  · [ ] ezk-device  · [ ] ezk-apk
- [ ] ezk-npm-scripts
- [ ] ezk-design-system → **déjà tracké par la fiche 0019** (migrer + étendre).

**Agents restants (4)** — copier `<agent>.md` dans `agents/` :
- [ ] ezk-architect · [ ] ezk-tdd · [ ] ezk-qa · [ ] ezk-steward

**Switchover** (une fois le contenu migré) :
- [ ] `bind --global <profile>` écrit `~/.claude/{skills,agents}` en **mode link** → `~/.claude`
  pointe vers mega-city (plus vers claude-skills).
- [ ] **Geler `claude-skills`** : README « migré vers mega-city, lecture seule », plus d'ajout.

## Critères d'acceptation

- [ ] Les 8 skills + 4 agents restants présents dans `mega-city/{skills,agents}`.
- [ ] `bind --global` installe l'ensemble en mode link ; un `git pull` mega-city met à jour `~/.claude`.
- [ ] `claude-skills` gelé (note read-only) ; aucune skill n'y est plus éditée.
- [ ] Fiche 0022 fermée (satisfaite par la migration d'ezk-backlog v#31).

## Notes / décisions

Dépend d'ADR-0006. **Hors-scope ici** : intégration cop1 (fiche **0016** cap cop1, gated sur cop1
ADR-021) ; migration des rulesets iamthelaw (fiche **0006**). Ordre suggéré : d'abord les skills
feuilles (ezk-ci, ezk-npm-scripts, ezk-preview), puis les gros (ezk-sprint, ezk-backlog), puis les
agents, puis le switchover. `ezk-backlog` : la version de référence est celle de **claude-skills PR #31**.
