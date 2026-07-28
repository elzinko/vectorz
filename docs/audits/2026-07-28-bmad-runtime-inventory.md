# Inventaire lecteurs runtime `_bmad*` (isolation époque 2)

**Date :** 2026-07-28 · **PR :** #62 · **Mis à jour :** purge artefacts trackés
(dogfood mega-city) + `useBMAD` défaut `false`.

## Verdict dogfood

| Chemin | Lit `_bmad*` ? |
| --- | --- |
| mega-city (`ezk-sprint`, `ezk-backlog`, `ezk-product-builder`) | **Non** |
| Moniteur / `src/supervision` | **Non** (test `bmad-monitor-isolation.test.ts`) |
| Pilote cop1 (`orchestrator`, `BMADReader`, …) | **Retiré** (E4 PR #62) — CLI stubbée vers mega-city |

**BMAD n'est plus** le carburant d'avancement de ce repo. Les dossiers trackés
`_bmad*` étaient du poids mort époque 1 pour le dogfood ; purgés + gitignorés.
Historique : tag `epoch-1-bmad-final`.

## Anciens chemins (hors tree)

| Chemin | Taille approx. | Rôle |
| --- | --- | --- |
| `_bmad/` | ~236 Ko | customisation projet BMAD (non régénérable) |
| `_bmad-output/` | ~2.4 Mo | artefacts (sprint-status, planning, stories) |

## Lecteurs / writers runtime (cop1 — pilote, pas dogfood)

| Unité | Chemin typique | Mode |
| --- | --- | --- |
| `BMADReader` | `_bmad-output/implementation-artifacts` | pilote |
| `YamlSprintStatusAdapter` / `OrchestratorService` | `sprint-status.yaml` sous `_bmad-output/` | pilote |
| `DefaultBMADCommandRunner` | session BMAD | pilote |
| `FileSidecarAdapter` (iamthelaw) | `_bmad/_memory/iamthelaw-sidecar/` | pilote |
| `SupervisorContextLoader` | planning-artifacts | pilote |
| `BmadBridgeService` | `_bmad/_config/agents/*.customize.yaml` | **futur** émetteur (2058 / ADR-032) |
| Intégration `orchestrator-*.test.ts` | fixtures temp `_bmad-output/` | tests |

## Config

- `workflow.useBMAD` défaut **`false`** (`ConfigSchema.ts`).
- Moniteur : ignore ce flag.
- Pour un **pilote / cobaye BMAD** sur un *autre* projet : `useBMAD: true` +
  installation BMAD dans ce projet cible (pas dans vectorz).

## Ce qui reste (volontairement)

- **`bmad-bridge`** + `cop1 init-bmad-bridge` — design pour **BMAD-as-emitter** (fiche 2058 / ADR-032) sur un projet cobaye externe.
- Packages époque 1 `@cop1/ceremony-engine` et `@cop1/quality-intelligence` — marqués `DEPRECATED.md` ; hors dogfood mega-city.
- Fiche [2058](../../features/2058-bmad-contrat-supervisabilite.md) + ADR-032.
