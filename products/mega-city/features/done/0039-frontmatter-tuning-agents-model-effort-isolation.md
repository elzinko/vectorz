---
id: 0039
title: frontmatter tuning des agents — model, effort, isolation
type: chore
priority: P1
status: shipped
pr: local (squash-merge)
created: 2026-07-06
---

## Contexte / Problème
Tous les agents héritent du modèle de la session : l'architecte réfléchit avec le même
cerveau que le steward. Claude Code supporte `model:` (alias sonnet/opus/haiku/fable,
`inherit` par défaut — un id inconnu est ignoré avec repli, donc **alias uniquement, jamais
d'id épinglé**), `effort:`, `isolation: worktree`, `skills:` (préchargement). Le domaine
(`docs/domain.ts`) ignore ces champs.

## Proposition
1. Frontmatters (coût d'une erreur, pas prestige du rôle) :
   - ezk-architect : `model: opus`, `effort: high`
   - ezk-pm (fiche 0036) : `model: opus`, `effort: high`
   - ezk-reviewer : `model: opus`, `effort: high` (gate à veto)
   - ezk-qa : `model: sonnet`, `effort: medium`
   - ezk-tdd (→ ezk-dev, fiche 0045) : `model: sonnet`, `effort: medium`, `isolation: worktree`
   - ezk-steward : `model: sonnet`, `effort: low`
2. `docs/domain.ts` : `Agent.model?: string` / `Agent.effort?: string` (data composable,
   les caps la matérialisent).
3. Matérialiser `competences[]` → champ natif `skills:` au bind (couture déjà alignée des
   deux côtés).

## Critères d'acceptation
- [ ] les 6 agents portent model/effort (alias uniquement) ; ezk-dev porte isolation
- [ ] bind `--link` : les champs arrivent dans ~/.claude (vérifier au moins un agent)
- [ ] domain.ts et le loader connaissent model/effort sans casser les 93 tests
- [ ] aucun id de modèle épinglé (`grep -E 'model: *claude-' agents/` = 0 — le motif exclut les faux positifs type « claude-skills » dans la prose)

## Notes
Le mode copy jette aujourd'hui les frontmatters (bug caps, chip du 2026-07-05) — en
`--link` (bind global actuel) c'est effectif immédiatement. Le cap cop1 Phase 2 pourra
mapper `Agent.model` sur le ModelTierRouter (cop1 fiche 0023).
