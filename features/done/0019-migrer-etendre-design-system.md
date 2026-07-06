---
id: 0019
title: migrer + étendre ezk-design-system (design system UI/UX consultable + requêtable)
type: feature
priority: P1
status: shipped
pr: local (squash-merge)
created: 2026-06-27
---

## Contexte / Problème
`ezk-design-system` (claude-skills) couvre déjà tokens, variants (intentions×tailles), un
styleguide vivant `/design` et un mode enforcement — mais lui manquent **Slot**, **Pattern**,
**Breakpoint**, le vocabulaire nommé explicitement, et une forme **requêtable**. C'est le
1ᵉʳ skill *étendu* migré dans mega-city (cf. [`docs/adr/0006`](../docs/adr/0006-absorber-claude-skills-catalogue2.md)).

## Proposition
Migrer le skill dans `skills/` et l'étendre — **couches 1+2** (concepts + playbook + enforcement),
**agnostique techno**. Sortie « les deux + requêtable » : (a) doc/règles que l'agent applique,
(b) `/design` browsable humain, (c) **index requêtable** (lister les patterns, les variants d'un
composant, les breakpoints…). Le choix des **outils** concrets selon la stack est **délégué**
(couture, pas de hardcode) → fiche 0020.

## Critères d'acceptation
- [ ] vocabulaire complet documenté ET applicable : Token, Variant, Slot, Pattern, Breakpoint
- [ ] `/design` reste « vivant » (lu en runtime) + un index requêtable des éléments
- [ ] enforcement conservé : l'agent lit le design system avant toute UI
- [ ] agnostique techno : une **couture** demande la stack et délègue le choix d'outils (→ 0020)
- [ ] migré dans `skills/` ; l'original claude-skills reste intact (strangler-fig)

## Notes
- **Dépend de 0017** (cap global `~/.claude`) pour être déployable dans le Claude Code quotidien.
- Délègue à **0020** (stack → toolchain) le choix d'outils par techno.
- Version ambitieuse : l'enforcement (tokens-only, composer-avant-créer) pourrait devenir des **règles iamthelaw**.
