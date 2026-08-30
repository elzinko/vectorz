---
id: "20260830194601307"
title: "front-matter généré émis + validé par la lib YAML (jamais par concaténation)"
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
status: idea
ready:
pr:
created: 2026-08-30
---

## En clair

`ezk-chef extract` a produit un front-matter YAML **invalide** (title/makes/source non quotés →
un `:` ou un `#` casse le scalaire), invisible aux fixtures naïves, attrapé seulement par un
parseur YAML réel en revue. On veut que **tout générateur de fiche/recette** émette son
front-matter par la **lib YAML** (jamais par template de chaîne), et que chaque fixture de test
soit **re-parsée** par le vrai parseur.

## Symptôme (rétro 2026-08-30)

`ezk-chef extract` (#194) écrivait `title: <valeur avec :>` non quoté → `yaml.parse` échoue
(`mapping values are not allowed here`) ; `source: … #171` était tronqué au `#`. Les fixtures
de test avaient des titres « simples » (sans `:`), donc le test ne voyait rien. Seul un parseur
YAML réel, en revue, l'a attrapé.

## Proposition

- Les générateurs (`ezk-chef extract`, `ezk-backlog add`/`ship`, tout futur émetteur) émettent
  via `yaml.stringify` / `gray-matter` (déjà en dépendances), **jamais** par concaténation.
- `fiches:check --strict` (ADR-0040, déjà livré) est branché sur les artefacts générés : refuse
  tout front-matter non parseable par un parseur YAML strict, pas seulement les champs connus.
- Chaque fixture de test d'un artefact généré est **round-trip-parsée**.
- Applique la règle `rules/development/yaml-emission-via-lib.md` (créée à la même rétro).

## Critères d'acceptation

- [ ] 100 % des générateurs émettent via la lib YAML (0 concaténation de front-matter).
- [ ] 0 fixture de test en string brute (toutes round-trip-parsées).
- [ ] Un titre contenant `:` / `#` / guillemets / accents → front-matter **valide** (rouge→vert).

## Comment vérifier

```bash
pnpm --dir products/mega-city fiches:check --strict   # + un test round-trip sur un artefact généré
```

## Notes

- Rétro 2026-08-30 (consensus dev/pm/archi). Se couple à la règle R2 (`yaml-emission-via-lib`,
  méthode) et complète `rules/recipe/valid-frontmatter.md` (résultat).
