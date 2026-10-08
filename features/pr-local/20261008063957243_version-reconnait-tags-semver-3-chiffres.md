> 🗎 Rendu de la fiche [features/20261008063957243_version-reconnait-tags-semver-3-chiffres.md](../done/20261008063957243_version-reconnait-tags-semver-3-chiffres.md)

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

**Décision PO du 2026-10-08 : semver strict.** La méthode se standardise sur un seul format de
release, le semver à trois composantes `vX.Y.Z`. Une version `V<maj>.<min>` est **sortie** dès
qu'une étiquette `v<maj>.<min>.<patch>` existe — un tag nu `vX.Y` ne suffit **plus**. Concrètement,
dans `versions.ts` :

1. Un **matcher** `releaseTagFor` : un tag satisfait la version si c'est un semver à trois
   composantes `vA.B.C` (sans pré-version) dont les composantes de la version sont le **préfixe**
   (`V1.7` ↔ `v1.7.0`, `v1.7.5` ; `V0.3.1` ↔ `v0.3.1`). Les pré-versions (`v1.7.0-rc.6`) et les
   tags nus (`v1.7`) ne comptent pas. Plusieurs patchs : on rend le plus haut.
2. Porter sur le lot l'**étiquette réellement trouvée** (`releaseTag`). Les messages et le rendu
   affichent le vrai tag (`v1.7.0`), pas un synthétique.
3. Par **cohérence**, `close` **propose** aussi du semver (`proposedTagOf` : `V1.8` → `v1.8.0`).
   Sans ça, l'outil proposerait un tag `v1.8` qu'il refuserait ensuite de reconnaître — un piège.
4. `closeVersion` refuse une version déjà sortie **en nommant le tag réel**.

Les états `livree` et `rouverte` (tag + fiches à faire) utilisent le même matcher.

**Conséquence assumée.** vectorz tague ses versions en deux chiffres (`v0.1`…`v0.6`). En semver
strict, ces six versions passeront « à clore » tant qu'elles ne sont pas re-taguées en semver
(`v0.1.0`…). Le re-tagage de vectorz est un **suivi séparé**, hors de cette fiche.

## Critères d'acceptation

- [ ] Une version `V1.7` dont l'étiquette `v1.7.0` existe s'affiche `livrée (v1.7.0)` dans `version list` (plus « à clore »).
- [ ] Le matcher accepte **seulement** le semver `vX.Y.Z` (Z entier), **refuse** le tag nu `vX.Y` et les pré-versions (`vX.Y.Z-rc.N`).
- [ ] L'état `rouverte` (étiquette présente + fiches à faire) reconnaît le tag semver.
- [ ] `version close V1.7` refuse en nommant le tag réel : « déjà livrée : l'étiquette v1.7.0 existe ».
- [ ] `version close` sur une version non sortie **propose** du semver (`v1.8.0`), pas `v1.8`.
- [ ] Les messages et le rendu affichent le tag **trouvé** (`v1.7.0`), pas un synthétique.
- [ ] Tests couvrant : semver accepté, tag nu refusé, pré-version ignorée, proposition semver — `versions.test.ts` + le test du bin.

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
- Décision PO 2026-10-08 : **semver strict** (un seul format `vX.Y.Z`), plutôt que « tolérer les
  deux formes ». Conséquence acceptée : vectorz (`v0.1`..`v0.6`) devra être re-tagué en semver —
  **suivi séparé** à ouvrir.
- Surfaces touchées : `versions.ts` (`releaseTagFor` semver strict + `proposedTagOf` + `releaseTag`
  sur le lot), `versions-render.ts` (tag réel). Deux fichiers d'un module, plus leurs tests — pas
  d'ADR.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ (isolée; flake de charge connu fiche 20261001133500727) |
| Typecheck | ✅ |
| Tests | ✅ 257 (16 fichiers) |
| Revue adverse | ⏳ re-revue semver strict |
| Before/after (UI) | N.A. — code .ts seul |
