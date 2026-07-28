# Getting Started — Vectorz (époque 2)

> Monorepo **Vectorz** : Moniteur (cop1) + méthode **mega-city** (`ezk-*`).
> Le chemin nominal n'est **plus** BMAD (ADR-029).

## Prérequis

- Node.js ≥ 20 · pnpm ≥ 9 · Git
- Claude Code (pour la méthode ezk-*)
- Optionnel : mission-control / daemon cop1 pour le Moniteur

## Install

```bash
pnpm install
pnpm build        # packages cop1 compilés
pnpm test         # vitest monorepo
pnpm lint
```

**CI :** `.github/workflows/ci.yml` (lint · build · test).

## Layout

```
products/
  cop1/           — control plane / mission-control (mode moniteur ADR-028)
  mega-city/      — méthode ezk-* (skills, agents, profils, lawgiver)
features/         — backlog UNIQUE (champ product: — fiche 0064)
docs/             — ADRs, audits, programme de refonte
```

(`_bmad*` n'est plus dans l'arbre — historique au tag `epoch-1-bmad-final`.)

## Chemin nominal — méthode

1. Lire [`products/mega-city/README.md`](../products/mega-city/README.md)
2. Binder le profil **daily** (curated) :
   `pnpm --dir products/mega-city exec tsx bin/lawgiver.ts bind-global daily --link`
3. Travailler avec `ezk-product-builder` / `ezk-sprint` (3 chemins : trivial/standard/lourd)
4. Clôturer avec `/ezk-archive` (défaut = `check`)

## Chemin nominal — Moniteur

1. Brancher l'émetteur : `pnpm --dir products/mega-city supervision:link .`
2. Daemon / web mission-control (packages `app` + `web` sous cop1)
3. Les runs vivent dans `.supervision/runs/` (gitignoré)

## Docs vivantes

- [Programme refonte](./PROGRAMME-REFONTE.md)
- [Dogfood avant merge](./DOGFOOD.md) (smoke mécanique + checklist humaine)
- [Audit transition 2026-07-27](./audits/2026-07-27-transition-epoch-2.md)
- [Inventaire BMAD](./audits/2026-07-28-bmad-runtime-inventory.md)
- [ADRs](./adr/)
- [Portfolio](../PORTFOLIO.md)

## Ancien onboarding BMAD

Conservé dans l'historique git (tag `epoch-1-bmad-final`, ancien `_bmad-output/`).
Ne pas suivre pour un setup neuf. BMAD n'est plus le chemin d'avancement de ce repo
(éventuel futur : émetteur supervisé sur un projet cobaye — fiche 2058).
