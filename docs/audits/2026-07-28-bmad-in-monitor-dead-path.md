# Audit — code mort « méthode dans le moniteur » (BMAD époque 1)

**Date :** 2026-07-28 · **PR :** #62 · **Branche :** `refactor/epoch-2-harden-method`

## Contexte historique

Avant le pivot ADR-021→028, **cop1 pilotait BMAD depuis la mission-control** :
onglets Run / Rules / Connexion, `POST /api/orchestrator/run`, lecture
`sprint-status.yaml` sous `_bmad-output/`, commandes `/bmad-bmm-*`.

Aujourd'hui (époque 2) :

| Rôle | Qui |
| --- | --- |
| Méthode | **mega-city** (`ezk-*`) |
| Observation | **Moniteur** + `.supervision/runs/` + MCP supervision (ADR-028) |
| BMAD | hors dogfood ; éventuel **émetteur externe** (2058 / ADR-032) |

## Ce qui a été retiré (UI moniteur)

Surfaces **déjà démontées** (fiche 0059) mais encore dans le tree — purement mortes
pour le Moniteur, et porteuses du paradigme « méthode dans l'app » :

| Chemin | Rôle époque 1 |
| --- | --- |
| `products/cop1/packages/web/src/OrchestratorRunView.tsx` (+ test) | Lance un run orchestrateur BMAD (`/api/orchestrator/run`, SSE `orchestrator.*`) |
| `products/cop1/packages/web/src/RuleProposalsView.tsx` (+ test) | Onglet Rules / propositions |
| `products/cop1/packages/web/src/AuthPanel.tsx` (+ test) | Onglet Connexion |
| `products/cop1/packages/web/src/ProposalCard.tsx` (+ test) | Carte proposition (deps Rules) |
| CSS associée dans `index.css` | tabs, cards proposals, badges pilote |

`App.tsx` ne monte plus que `SupervisionView`.

## Ce qui est conservé (volontairement)

### Keep — Moniteur / supervision (méthode-agnostique)

- `packages/web/src/SupervisionView.tsx`
- `packages/app/src/features/supervision/`
- mega-city `src/supervision/` + test `bmad-monitor-isolation.test.ts`
- MCP supervision / journal `.supervision/runs/`

### Keep for future 2058 — adapters marqués

- `packages/app/src/features/bmad-bridge/` — header **FUTURE / 2058 + ADR-032**
  (émetteur BMAD sur projet cobaye, pas self-hosting vectorz)

### Retiré en E4 (fiche 0039, PR #62)

| Unité | Statut |
| --- | --- |
| Orchestrator CLI / service | Retiré — CLI stub → mega-city |
| HTTP pilote | `POST /api/orchestrator/*`, `GET /api/sprint/status` → 404 |
| `bmad-orchestration` / `bmad-reader` | Supprimés de sprint-core |
| Agents legacy pilot pipeline | Conservés comme stubs `@deprecated` (tests WorkflowEngine) |

## mega-city

Aucun couplage BMAD-in-monitor trouvé hors doc (`method-map.md`, skill article) et
du test d'isolation. Rien à retirer.

## Risque résiduel

1. **`workflow.useBMAD`** reste dans le schéma config (défaut `false`) pour compat YAML — sans effet runtime post-E4.
2. **Confusion opérateur** : anciennes docs externes peuvent encore mentionner `cop1 orchestrator` — les commandes stub affichent le chemin mega-city.

## Références

- [ADR-028](../adr/ADR-028-lecteur-journal-mode-moniteur.md)
- [ADR-029](../adr/ADR-029-emancipation-bmad-politique-archivage.md)
- [ADR-032](../adr/ADR-032-emission-adaptateur-separable.md)
- [Inventaire runtime](2026-07-28-bmad-runtime-inventory.md)
- [Programme](../PROGRAMME-REFONTE.md) Phase 6 / E4
