---
id: "20261117141828103"
title: "Retirer les anciens verbes de coupe : close --tag, --seal-versions, ezk run versions et le gel"
type: refactor
priority: P1
product: mega-city
milestone: board
version:
labels: [release, nettoyage]
status: idea
blocked:
depends: ["20261114131613689"]
pr:
evidence: none # des verbes retirés, aucun écran modifié
created: 2026-11-17
---

# 20261117141828103 — Retirer les anciens verbes de coupe : close --tag, --seal-versions, ezk run versions et le gel

**En clair.** Quand le verbe unique `ezk backlog version tag` existera, trois anciens chemins pour poser
une version feront doublon : `version close --tag`, le réglage `--seal-versions` du pilote autonome et
`ezk run versions`. Le gel des versions (`freeze`) est aussi retiré par l'ADR-0088. On les supprime, on
met les compétences à jour, et la passe de release qui contrôlait la version passe sur le nouveau verbe.

**Si tu arrives frais.** Une *coupe* pose l'étiquette de version sur ce qui a été livré depuis la
précédente. La *gate de release* (`ezk release <v>`) enchaîne des passes ; la passe `dod-mecanique`
lance aujourd'hui `backlog version check <v>`.

## Contexte / Problème

- Découpée le 17 novembre de [`ezk backlog version tag <v>` : un seul verbe pour la coupe](20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md),
  qui dépassait la taille d'un sprint.
- À retirer : `close <v> --tag` (`products/mega-city/bin/backlog-version.ts`), `--seal-versions`
  (`products/mega-city/bin/run-context.ts`), `ezk run versions` (`products/mega-city/bin/run-versions.ts`,
  manifeste `products/mega-city/ezk-manifest.yml`), les verbes `freeze` / `unfreeze` et `freezeTagOf`
  (`src/backlog/versions.ts`).
- L'ADR-0088 §2.5 remplace la passe `dod-mecanique` par `backlog version tag <v> --dry-run` ; §8 retire le gel.

## Proposition

Supprimer ces verbes et leur code, sans code mort. `ezk-product-build` décrit le nouveau geste à la
place de `--seal-versions` et de la boucle multi-versions. La passe `dod-mecanique` lance le dry-run du
nouveau verbe.

## Critères d'acceptation

- [ ] `close --tag`, `--seal-versions`, `ezk run versions`, `freeze` et `unfreeze` ne sont plus ni dans
      le code, ni dans le manifeste, ni dans les compétences ; `ezk help` ne les cite plus.
- [ ] La passe `dod-mecanique` de `ezk release` lance `backlog version tag <v> --dry-run`.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
grep -rn -E 'seal-versions|run versions|version freeze|unfreeze|close --tag' "$ROOT/products/mega-city/bin" \
  "$ROOT/products/mega-city/src" "$ROOT/products/mega-city/skills" "$ROOT/products/mega-city/ezk-manifest.yml" | wc -l   # 0
pnpm --dir products/mega-city gate
```

## Notes / décisions

- Découpage décidé par ezk-pm le 17 novembre, par délégation du PO : construire le verbe d'abord, ce
  retrait ensuite.
- Risque : un lancement autonome qui passait `--seal-versions` change de comportement ; la compétence
  dit le nouveau geste.
