---
id: 0023
title: exposer le model-tiering dans cop1.config.yaml (promesse ADR-015)
type: chore
priority: P2
product: vectorz
status: shipped
pr: "#52"
created: 2026-07-06
---

# 0023 — exposer le model-tiering dans cop1.config.yaml

## Contexte / Problème
ADR-015 (accepté 2026-06-20) promet « nouvelles règles sans changement de code (config) »,
mais le mapping vit en constante de code : DEFAULT_MODEL_TIER_CONFIG dans
`packages/sprint-core/src/features/bmad-orchestration/domain/ModelTierRouter.ts:44-50`
({create-story→opus, code-review→opus, fallback→sonnet}), câblé sans argument dans
`orchestrator.ts:277`. Le `llm_routing` de cop1.config.yaml est un concern distinct (Ollama
local). Par ailleurs mega-city introduit `Agent.model` (fiche mega-city 0028) que le cap
cop1 Phase 2 devra pouvoir mapper.

## Proposition
1. Section `model_tiering:` dans cop1.config.yaml (validée zod dans ConfigSchema), défauts
   actuels conservés en code si absente.
2. Alias uniquement (opus/sonnet/haiku) — jamais d'id de modèle épinglé (déjà le cas,
   à verrouiller par un test).
3. Documenter la distinction model_tiering (Claude SDK) vs llm_routing (Ollama local).

## Critères d'acceptation
- [ ] surcharger une règle de tiering via cop1.config.yaml sans toucher au code
- [ ] config absente → comportement actuel identique (rétro-compatible)
- [ ] test : un id de modèle complet dans la config est rejeté par le schéma

## Notes / décisions
Prépare le mapping Agent.model (mega-city) → tiering au cap cop1 Phase 2 (mega-city
fiche 0016).
