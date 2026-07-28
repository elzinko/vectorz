---
id: 0036
product: vectorz
title: Purge du code mort prouvé + rescope 0022 AC3 (sous-ensemble sûr de L8)
type: chore
priority: P1
epic: 0034
status: shipped
pr: "#13"
created: 2026-07-15
---

# 0036 — Purge du code mort prouvé

## Contexte / Problème

Amont validé par panel adverse (2026-07-15). La « dette actée non résorbée » parasite
chaque revue. Ce lot ne prend que le **sous-ensemble 100 % sûr, sans aucune orientation
produit** (extrait du lot L8 de [0034](../0034-mise-a-plat-post-pivot.md)). Il **ne touche
PAS** `_bmad/`, `_bmad-output/`, ni le flag `useBMAD` : ceux-là sont runtime-atteignables
et relèvent d'arbitrages humains (0034 D6/D9) — voir Notes.

## Proposition

1. **[S1] Supprimer `TokenBudgetService` + `YamlBudgetStore`** + leurs 2 tests + les 2
   exports barrel (`sprint-core/src/index.ts:321-322`). Vérifié : référencés seulement par
   leur propre export et leurs tests, **zéro instanciation en prod** ; le kill-switch réel
   passe par `RunBudget`/`StoryBudget` (OrchestratorService), acté ADR-017.
   *Rationale corrigée* : l'event `llm.call.completed` **n'est pas mort** (émis par
   `LLMGateway.ts:73`, `ClaudeCliAdapter.ts:49`) — c'est le **service abonné** qui est
   dormant.
2. **[S2] Supprimer `docker-compose.yml` racine** — vestige dont tout le contenu utile
   est commenté (ne restent que `version:` et `services:` vides ; mode nuit Ollama,
   ADR-005 suspendu). **Énoncer** que cela rend ADR-005 de-facto caduc.
3. **[S3] Supprimer `scripts/ea13-real-run.sh`** ET mettre à jour le commentaire de
   `integration-tests/orchestrator-real-run.test.ts:21` qui le cite comme tracker de
   couverture non-CI (sinon il pointe dans le vide).
4. **Rescoper la fiche [0022](../0022-observabilite-mission-control-donnees-deja-collectees.md)**
   : retirer/reformuler l'AC « ventilation budget par agent » — mort-né, il s'adosse au
   YAML de `TokenBudgetService` jamais écrit en prod (donc = re-collecte, pas de
   l'affichage, ce que 0022 promet).

## Critères d'acceptation

- [ ] `grep -rnE "TokenBudgetService|YamlBudgetStore" products/cop1/packages/*/src` = zéro (24 occurrences aujourd'hui)
- [ ] `docker-compose.yml` et `scripts/ea13-real-run.sh` supprimés
- [ ] Le commentaire de `orchestrator-real-run.test.ts` ne cite plus `ea13-real-run.sh`
- [ ] `pnpm build` + suite de tests verts après suppression
- [ ] 0022 ne contient plus d'AC dépendant d'une collecte inexistante

## Notes / décisions

**Hors périmètre (relève d'E4 / ADR-029, ne PAS toucher ici)** : `useBMAD=false` + agents
legacy `PMAgent/QAAgent/DevAgent` (branche runtime `PipelineStepFactory.ts:54`, testée) ;
`_bmad/` (27 fichiers = customisations projet gardées **exprès** par `.gitignore`, lues au
runtime par `BmadBridgeService.ts` + garde pré-flight `orchestrator.ts:246`) ;
`_bmad-output/` (`sprint-status.yaml` lu par `YamlSprintStatusAdapter.ts:18`, ~20 liens
docs). L'émancipation est **actée** (ADR-029, D6/D9 tranchées) : ces trois partent en
**E4, après le gate E3** — pas dans ce lot de purge.
