# E2E manuels reproductibles

> Déplacé de `docs/e2e/` vers `docs/tests/` le 2026-10-11 (fiche 20261007154842780) : ce sont des
> **tests**, pas du process. Conservés (déplacés, pas supprimés) car la couverture auto `cobaye:smoke`
> n'exerce avec certitude que le Moniteur (0041), pas tout le scénario auth (0003).


| Doc | Sujet | Fiche |
|-----|--------|-------|
| [moniteur-smoke.md](./moniteur-smoke.md) | Banc cobaye + Moniteur (Pareto) | 0041 |
| [auth-panel.md](./auth-panel.md) | Auth daemon `/api/auth/check` | 0003 |

Automatisé : `pnpm cobaye:smoke` (racine vectorz).
