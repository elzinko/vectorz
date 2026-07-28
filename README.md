# Vectorz

> Monorepo époque 2 — **Moniteur** (supervision) + méthode **mega-city** (`ezk-*`).
> *Pendant que tu construis, le siège observe.*

Umbrella qui héberge :

| Produit | Chemin | Rôle |
| --- | --- | --- |
| **cop1** | `products/cop1/` | Control plane / mission-control — mode **moniteur** nominal (ADR-028) |
| **mega-city** | `products/mega-city/` | Méthode ezk-\* (skills, agents, profils, backlog) |

**Dogfood :** mega-city + `ezk-backlog` / `ezk-sprint` + Moniteur — **sans BMAD**.
BMAD époque 1 est hors tree (tag `epoch-1-bmad-final`) ; un éventuel BMAD *émetteur*
sur un autre projet est une feature future ([2058](features/2058-bmad-contrat-supervisabilite.md)).
Voir [programme de refonte](docs/PROGRAMME-REFONTE.md) · [ADR-029](docs/adr/ADR-029-emancipation-bmad-politique-archivage.md).

## Status

**Époque 2 en durcissement** — doctrine claire (Moniteur + mega-city), graphe encore
hybride (dette de transition). Voir l'audit :

- **Audit** → [`docs/audits/2026-07-27-transition-epoch-2.md`](docs/audits/2026-07-27-transition-epoch-2.md)
- **Programme vivant** → [`docs/PROGRAMME-REFONTE.md`](docs/PROGRAMME-REFONTE.md)

## Start here

- **Méthode mega-city** → [`products/mega-city/README.md`](products/mega-city/README.md)
- **Profils (bind daily)** → [`products/mega-city/profiles/README.md`](products/mega-city/profiles/README.md)
- **Portfolio transverse** → [`PORTFOLIO.md`](PORTFOLIO.md)
- **ADRs** → [`docs/adr/`](docs/adr/)
- **Index docs** → [`docs/index.md`](docs/index.md)

## Stack

Node ≥ 20 · pnpm ≥ 9 · TypeScript 5.7 (strict) · Vitest · Biome · Claude Agent SDK.

Monorepo pnpm — packages sous `products/cop1/packages/*` + `products/mega-city`.

## Scripts

```bash
pnpm install
pnpm build        # tsc -b across compiled packages
pnpm typecheck    # = pnpm build
pnpm test         # vitest
pnpm lint         # biome check .
pnpm lint:fix
```

**CI :** [`.github/workflows/ci.yml`](.github/workflows/ci.yml) — lint · build · test
sur `main` et chaque PR.

## License

MIT © elzinko
