---
id: "20261008063957243"
title: "backlog version : reconnaître les étiquettes semver à 3 chiffres (v1.7.0)"
type: bug
priority: P1
product: mega-city
milestone:
version:
labels: [backlog, version]
status: idea
blocked:
pr:
created: 2026-10-08
---

# 20261008063957243 — backlog version reconnaît les tags semver à 3 chiffres

## En clair

La commande `ezk backlog version` croit qu'une version livrée n'est « pas encore étiquetée »
dès que le projet tague en semver à trois chiffres. muti sort ses versions en `v1.7.0`,
`v1.8.0` ; l'outil, lui, ne cherche que `v1.7`. Du coup une version bel et bien sortie
s'affiche « à clore », et `version close` propose de créer une étiquette en double.

## Contexte / Problème

Constaté le 2026-10-08 sur muti. La 1.7.0 est sortie (étiquette git `v1.7.0`, commit du 15/09),
mais `version list` la montre **à clore** et `version close V1.7` propose
`git tag -a v1.7 …` — une étiquette au mauvais format, et pointée sur le mauvais commit.

La cause est une seule ligne. Dans `products/mega-city/src/backlog/versions.ts` :

```ts
export const tagOf = (version: string): string => `v${version.slice(1)}`; // V1.7 → v1.7
const tagged = tags.has(tagOf(version));                                   // cherche « v1.7 » pile
```

`tags` contient bien **toutes** les étiquettes locales (`git tag -l`), dont `v1.7.0`. Mais le
test est une égalité stricte sur `v1.7` : `v1.7.0` passe à côté. Donc :

- l'état tombe en `a-clore` au lieu de `livree` (ligne 97) ;
- `version list` étiquette la ligne `(v1.7)` au lieu du vrai tag `v1.7.0` (`versions-render.ts:57`) ;
- `closeVersion` ne voit pas la version déjà sortie et ne refuse pas (il devrait dire « déjà
  livrée : v1.7.0 existe »).

Ça n'empêche aucune release — c'est l'**état affiché** des versions qui ment. Mais ça fausse le
pilotage à chaque version (le symptôme reviendra sur `V1.8`, `V1.9`…), d'où P1.

## Proposition

Faire reconnaître à l'outil qu'une version `V<maj>.<min>` est **sortie** dès qu'une étiquette
de release `v<maj>.<min>` **ou** `v<maj>.<min>.<patch>` existe. Concrètement, dans `versions.ts` :

1. Remplacer l'égalité stricte par un **matcher** : un tag satisfait la version s'il vaut
   `tagOf(version)` ou commence par `tagOf(version) + "."` suivi d'un entier. Une pré-version
   (`v1.7.0-rc.6`) ne compte **pas** (ce n'est pas la sortie).
2. Porter sur le lot l'**étiquette réellement trouvée** (`releaseTag`), au lieu de recalculer
   `tagOf`. Les messages et le rendu affichent alors le vrai tag (`v1.7.0`), pas le synthétique.
3. `closeVersion` refuse une version déjà sortie **en nommant le tag réel**.

Les états `livree` et `rouverte` (tag + fiches à faire) utilisent le même matcher.

**Non-objectif (hors de cette fiche).** Le format du tag **proposé** pour une version pas encore
sortie reste `vX.Y`. Décider si l'outil doit plutôt proposer `vX.Y.0` est une autre décision —
fiche séparée si le besoin se confirme. Ici on corrige la **reconnaissance**, pas la proposition.

## Critères d'acceptation

- [ ] Une version `V1.7` dont l'étiquette `v1.7.0` existe s'affiche `livrée (v1.7.0)` dans `version list` (plus « à clore »).
- [ ] Le matcher accepte `vX.Y` et `vX.Y.Z` (Z entier) et **ignore** les pré-versions (`vX.Y.Z-rc.N`).
- [ ] L'état `rouverte` (étiquette présente + fiches à faire) reconnaît aussi le tag à 3 chiffres.
- [ ] `version close V1.7` refuse en nommant le tag réel : « déjà livrée : l'étiquette v1.7.0 existe ».
- [ ] Les messages et le rendu affichent le tag **trouvé** (`v1.7.0`), pas le synthétique `v1.7`.
- [ ] Tests unitaires couvrant les trois cas (2 chiffres, 3 chiffres, pré-version ignorée) : `versions.test.ts` + le test du bin.

## Comment vérifier

```bash
# tests du paquet (rouge d'abord, vert après le fix)
pnpm --dir products/mega-city test -- versions

# contrôle de bout en bout sur muti (V1.7 doit passer « livrée (v1.7.0) »)
ezk --root /Users/elzinko/git/bacasable/muti backlog version | grep -i "V1.7"
```

Attendu après le fix : `version list` montre `V1.7 … livrée (v1.7.0)`, et `version close V1.7`
refuse avec « déjà livrée : l'étiquette v1.7.0 existe » au lieu de proposer `git tag -a v1.7`.

## Notes / décisions

- Fiche née du constat du 2026-10-08 (session muti) : `version close V1.7` proposait une étiquette
  `v1.7` en double alors que `v1.7.0` existait déjà. Fix confiné à `products/mega-city/src/backlog/`.
- Surfaces touchées : `versions.ts` (matcher + `releaseTag`), `versions-render.ts` (affichage du
  tag réel). Deux fichiers d'un même module, plus leurs tests — pas de décision d'archi, pas d'ADR.
