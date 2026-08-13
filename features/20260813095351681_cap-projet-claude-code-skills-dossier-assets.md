---
id: "20260813095351681"
title: Cap projet claude-code — skills en forme dossier pour porter les assets
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-13
---

# 20260813095351681 — Cap projet claude-code : skills en forme dossier (assets)

## Contexte / Problème

L'**ADR-0027** (PR #138) a livré la matérialisation des assets d'un dossier de skill
(`approaches/`, `scripts/`, …) pour les caps **forme dossier** : `claude-desktop` et
`claude-code-global` (via `skillFolderFiles`). Mais le cap **projet** `claude-code`
(`products/mega-city/src/caps/claude-code.ts`) matérialise encore les skills en
**fichier plat** `.claude/skills/<id>.md` — il ne peut donc porter **aucun** asset,
par construction.

Résultat : l'install **niveau projet** (la plus courante pour un dev qui `bind` son
repo) reste **sans assets**, alors que global et desktop les portent désormais.

## Proposition

Passer le cap projet à la **forme dossier** `.claude/skills/<id>/SKILL.md` + assets,
en réutilisant `skillFolderFiles` (prefix `.claude/skills`). Points d'attention :
- **rétro-compat** : migrer / faire coexister l'ancien fichier plat `.claude/skills/<id>.md`
  avec le nouveau dossier `.claude/skills/<id>/` (garde non-destructive, comme le global) ;
- impact sur le **layout du cap projet** (CLAUDE.md, hooks, `applyPlan`) → décision d'archi
  non triviale, à cadrer en **ADR** (suite d'ADR-0027).

## Critères d'acceptation

- [ ] Une install **projet** (`bind <profile> <dir> claude-code`) porte `approaches/` et
      les `scripts/` (avec `+x`).
- [ ] Parité prouvée avec desktop/global (mêmes assets livrés).
- [ ] Migration / coexistence fichier-plat → dossier gérée sans écraser un fichier user.
- [ ] Tests (cap + apply projet) ; gate locale verte.

## Notes / décisions

- Suite directe d'**ADR-0027** / **PR #138** (hors-périmètre assumé : « cap projet inchangé »).
- **Contingent** : une fois les `scripts/` livrés en install projet aussi, la contrainte qui
  force `ezk-backlog` à **minter ses ids inline** (« copy-mode ne livre que SKILL.md »)
  pourrait être allégée — à évaluer séparément, pas dans cette fiche.
- Recoupe [[0186]] (versioning / déploiement des skills).
