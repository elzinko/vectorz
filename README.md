# cop1 / vectorz / mega-city

> Autonomous AI-agent development with human supervision — local-first, commit-disciplined.
>
> **Comprendre la méthode en 10 min** : `pnpm ezk:map` ouvre la [carte interactive](diagrams/methode-mega-city/carte-interactive.html) (moteur / méthode / modules, onglet 🧭 « le domaine ») ; jargon traduit dans le [glossaire](docs/glossaire-jargon-ezk.md).

**Epoch 2 (current).** Dogfood on this repo uses **mega-city** skills (`ezk-backlog`, `ezk-sprint`, `ezk-archive`) plus the **cop1** supervision daemon and Moniteur. The epoch-1 BMAD orchestrator pilot was removed from prod (E4 / [ADR-029](docs/adr/ADR-029-emancipation-bmad-politique-archivage.md), fiche [0039](features/done/0039-e4-retrait-bmad.md)).

BMAD on **another** project stays supported as an optional sidecar via `cop1 init-bmad-bridge` ([ADR-032](docs/adr/ADR-032-emission-adaptateur-separable.md) — fiche [0162](features/0162-bmad-contrat-supervisabilite.md) for the full contract).

## Start here

- **Onboarding** → [`docs/GETTING_STARTED.md`](docs/GETTING_STARTED.md)
- **Supervision on a project** → [`docs/running-cop1-on-a-project.md`](docs/running-cop1-on-a-project.md)
- **Backlog & sprints (dogfood method)** → [`products/mega-city/skills/ezk-backlog/SKILL.md`](products/mega-city/skills/ezk-backlog/SKILL.md), [`ezk-sprint`](products/mega-city/skills/ezk-sprint/SKILL.md)
- **Doc index** → [`docs/index.md`](docs/index.md)
- **Brownfield snapshot** → [`docs/brownfield-snapshot.md`](docs/brownfield-snapshot.md)

## Stack

Node ≥ 20 · pnpm ≥ 9 · TypeScript 5.7 (strict + `noUncheckedIndexedAccess`) · Vitest · Biome · Claude Agent SDK.

Monorepo — cop1 packages (supervision), mega-city (skills catalog), shared tooling. See the brownfield snapshot for the package map.

## Scripts

```bash
pnpm install
pnpm build        # tsc -b across compiled packages
pnpm typecheck    # = pnpm build (tsc -b is the type-check; composite refs must emit)
pnpm test         # vitest
pnpm lint         # biome check .
pnpm lint:fix
```

Run typecheck, lint, and tests before every commit.

## License

MIT © elzinko
