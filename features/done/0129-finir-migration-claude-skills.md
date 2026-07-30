---
id: 0129
title: Migration claude-skills → mega-city — finir le strangler-fig (skills + agents restants → switchover)
type: chore
priority: P1
product: mega-city
version:
status: shipped
pr: local (squash-merge)
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

État (**terminé** — switchover fait le 2026-07-04) :
- `mega-city/skills/` : **les 12 migrés** (ezk-design-system inclus). Loader OK
  (sous-dossiers `skills/<name>/SKILL.md` + fallback nom de dossier + `readAgent` accepte `name`).
- `mega-city/agents/` : ezk-architect, ezk-qa, ezk-reviewer, ezk-steward, ezk-tdd (**tous**).
- **Switchover fait** : `bind-global global --link` (profil dédié `global`, pas `base`) →
  `~/.claude/{skills,agents}` symlinke vers mega-city. A nécessité de compléter le mode link
  pour qu'il symlinke AUSSI les agents (**fiche 0025**, trou de 0018).
- **claude-skills gelé** (bandeau README lecture seule, PR #32 mergée).

## Proposition — checklist jusqu'au switchover

**Skills restants (8)** — copier `SKILL.md` (+ helpers) dans `skills/`, adapter les refs :
- [x] **ezk-backlog** — version claude-skills #31 (add dédoublonnant + regroupement + `version` +
  cadrage brainstorm). **Satisfait la fiche 0022** → 0022 shippée au passage.
- [x] ezk-sprint  · [x] ezk-ci  · [x] ezk-preview  · [x] ezk-device  · [x] ezk-apk
- [x] ezk-npm-scripts
- [x] **ezk-design-system** — migré (copie fidèle SKILL.md + BRIEF.md) ; l'« étendre » reste la fiche 0019.

**Agents restants (4)** — copier `<agent>.md` dans `agents/` :
- [x] ezk-architect · [x] ezk-tdd · [x] ezk-qa · [x] ezk-steward

**Switchover** (une fois le contenu migré) :
- [x] `bind-global global --link` écrit `~/.claude/{skills,agents}` en **mode link** → `~/.claude`
  pointe vers mega-city (plus vers claude-skills). Profil dédié `global` (base reste minimal).
  A demandé de compléter le mode link côté **agents** (fiche **0025**).
- [x] **Geler `claude-skills`** : bandeau README « migré vers mega-city, lecture seule » (PR #32 mergée).

## Critères d'acceptation

- [x] Les 8 skills + 4 agents restants présents dans `mega-city/{skills,agents}` (12 skills + 5 agents au total).
- [x] `bind-global global` installe l'ensemble (skills **et** agents) en mode link ; un `git pull` mega-city met à jour `~/.claude`.
- [x] `claude-skills` gelé (note read-only) ; aucune skill n'y est plus éditée.
- [x] Fiche 0022 fermée (satisfaite par la migration d'ezk-backlog v#31) — déjà shippée.

## Notes / décisions

Dépend d'ADR-0006. **Hors-scope ici** : intégration cop1 (fiche **0016** cap cop1, gated sur cop1
ADR-021) ; migration des rulesets iamthelaw (fiche **0006**). Ordre suggéré : d'abord les skills
feuilles (ezk-ci, ezk-npm-scripts, ezk-preview), puis les gros (ezk-sprint, ezk-backlog), puis les
agents, puis le switchover. `ezk-backlog` : la version de référence est celle de **claude-skills PR #31**.
