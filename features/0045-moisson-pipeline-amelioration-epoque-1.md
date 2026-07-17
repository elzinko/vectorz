---
id: 0045
title: Moisson du pipeline d'amélioration d'époque 1 (Epics 9+12) — extraire la sémantique avant qu'elle ne se disperse
type: chore
priority: P2 # arbitrée 2026-07-17 (review) : P2 — seule la part quality-intelligence/ceremony-engine/_bmad-output est menacée par L5/E4 ; contrainte d'ordre conservée (AC4)
status: todo
pr:
created: 2026-07-16
---

# 0045 — Moisson du pipeline d'amélioration d'époque 1 (avant résorption L5 pour la part menacée)

## Contexte / Problème

Le pipeline d'amélioration d'époque 1 dort dans PLUSIEURS packages — cartographie
corrigée par la passe de réfutation :

- **sprint-core** (`products/cop1/packages/sprint-core/src/features/`) :
  `improvement-persistence/application/ImprovementPersistenceService.ts` (statuts
  `pending_review|approved|rejected|applied`, `.cop1/improvement-decisions.jsonl`),
  `rule-auto-apply/application/RuleAutoApplyService.ts` (`RULE_TYPES`),
  `improvement-review/` — **hors du lot L5 (0024/0034) et hors des 4 unités E4
  d'ADR-029** : cette part n'est PAS menacée à court terme ;
- **quality-intelligence** (`RetroQualityMetricsService`, `improvementScore`) et
  **ceremony-engine** (`ImprovementReviewSession`) — **sur la liste L5** ;
- **`_bmad-output`** (PRD, epics) — concerné par E4.

Si la destruction L5/E4 précède la moisson de la part menacée, sa sémantique éprouvée
disparaît et devra être réinventée pour le contrat d'améliorabilité (ADR-030 proposé).
**Motif d'urgence recalibré** : l'antériorité au lot L5 est **souhaitable** pour la part
quality-intelligence/ceremony-engine/`_bmad-output` — ce n'est pas un sauvetage in
extremis global, et le rang final face à la démo 0030 in-progress est un arbitrage PO.

## Proposition

Extraire en **document de conception uniquement** (zéro ligne de code reprise — même
logique qu'ADR-029 Décision 2 pour les planning-ADRs) vers la spec du contrat :

- types `ImprovementProposal` et statuts `pending_review|approved|rejected|applied`
  (sprint-core/improvement-persistence, `.cop1/improvement-decisions.jsonl`) ;
- `RULE_TYPES` restreints à l'auto-application (sprint-core/rule-auto-apply) ;
- la session de revue (sprint-core/improvement-review, ceremony-engine
  ImprovementReviewSession) ;
- FR59 (auto-approbation à échéance 48 h avec veto, signalée au morning report) —
  consignée comme **option de décision PO différée**, jamais adoptée d'office ;
- FR61 (approbation explicite des modifs de règles agents) ;
- quorum re-analysis (**FR103/FR104**) ;
- `improvementScore` (quality-intelligence/RetroQualityMetricsService) — à refonder sur
  outcomes métier, pas sur seuils rituels.

Sources : `products/cop1/packages/sprint-core` (improvement-persistence, rule-auto-apply,
improvement-review), `quality-intelligence`, `ceremony-engine`, `_bmad-output` —
rattachement PRD corrigé : **Epics 9 + 12** (FR56-62 côté Rules Engine/E9 ; FR102-108,
FR46, FR60 côté Improvement Review/E12).

## Critères d'acceptation

- [ ] Un document de conception versionné recense la sémantique ci-dessus avec pointeurs vers les sources d'origine, ancrés sur un **SHA de commit relevé au moment de la moisson** (le tag `epoch-1-bmad-final` n'existe pas encore — il sera posé juste avant E4, ADR-029 ; le noter dans le document)
- [ ] Les sources incluent explicitement les chemins sprint-core (improvement-persistence, rule-auto-apply, improvement-review)
- [ ] Zéro code repris ; zéro dépendance créée vers les packages moribonds
- [ ] La part quality-intelligence/ceremony-engine/`_bmad-output` est moissonnée AVANT le lot L5 et E4 (vérifiable dans l'ordre des PRs) — pour la part sprint-core, pas de contrainte d'ordre (échéance éventuelle = arbitrage PO)
- [ ] FR59 y figure comme option parking (décision PO), pas comme mécanisme du contrat

## Notes / décisions

- Convergence unanime des 3 concepts du concours (2026-07-16) sur le principe de la moisson ; cartographie des sources et calibrage d'urgence corrigés par la passe de réfutation.
- Le code meurt (historique git + SHA d'ancrage, puis tag `epoch-1-bmad-final` à sa pose, le conservent), les concepts entrent au contrat.