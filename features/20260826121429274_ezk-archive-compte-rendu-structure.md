---
id: "20260826121429274"
title: ezk-archive émet un compte-rendu de session structuré (frontmatter par sprint — PR, fiches, actions), prérequis de la vue sprints
type: feature
priority: P2
product: mega-city
version:
epic:
status: idea
ready:
pr:
created: 2026-08-26
---

# `ezk-archive` émet un compte-rendu de session structuré

## En clair

Quand une session se clôt, `ezk-archive` écrit un compte-rendu dans `docs/sessions/`. Il
est aujourd'hui **en prose libre** — lisible, mais **pas lisible par un script**. Pour que
la [vue « sprints réalisés »](20260826072532452_vue-sprints-realises-ezk-map.md) puisse
afficher, par sprint, ses PR / fiches / actions, ce compte-rendu doit porter ces données
dans un **en-tête structuré**. Cette fiche demande à `ezk-archive` de l'écrire — en plus du
récit. C'est le **pendant, côté sprints**, de la fiche
[capture rétro standard](0080-ezk-retro-compte-rendu-standard.md).

## Contexte / Problème

Constat fait au grooming de la vue sprints (2026-08-26) : les 10 comptes-rendus de
`docs/sessions/` sont **hétérogènes**, sans en-tête ; deux portent même le **titre
identique** et un autre un titre décorrélé de son nom. On ne peut **pas** en extraire des
données fiables tel quel.

Or la vue sprints a été groomée sur le périmètre **extraction structurée** (choix PO du
2026-08-26) : elle affiche, par sprint, ses PR / fiches / actions. Ça exige une **source
normée** — et le producteur de cette source, c'est `ezk-archive` (qui génère déjà le
compte-rendu à la clôture).

## Valeur

La vue sprints a enfin une source fiable. Plus largement, les comptes-rendus de session
deviennent **interrogeables** (par script), pas seulement lisibles à l'œil — un pas vers
« la méthode sait relire son propre historique ».

## Proposition (esquisse — à groomer, cadrer avec le pattern général)

Au temps de clôture, `ezk-archive` écrit une capture à **double couche** (comme la capture
rétro) :

1. **Le récit lisible** (le corps) — l'ouverture « En clair » + les sections de clôture
   déjà produites.
2. **L'en-tête extractible** (nouveauté) — un **frontmatter structuré** : méta de session
   (date · thème · périmètre) + la **liste des sprints**, chacun avec **PR** (n° + lien),
   **fiches livrées** (ids) et **actions**. C'est ce que lit la vue sprints, sans parser la
   prose.

## Périmètre

**Dans le lot (visé ready)** : le format + `ezk-archive` l'émet + un compte-rendu récent
mis au format comme exemple vérifiable.

**Hors lot** : le **rétro-fit** des anciens comptes-rendus (leur écrire un en-tête à la
main) — côté vue, ils s'affichent en **mode dégradé**.

## Décision laissée à l'étape Archi (avec recommandation)

- **Forme** : **frontmatter structuré (recommandé)** — cohérent avec la doctrine repo
  « frontmatter = source de vérité » et **symétrique** de la capture rétro.
- **Cadrage** : c'est une **instance du pattern**
  [« livrable lisible » (template + extracteur + rendu)](20260825182327490_pattern-livrable-lisible-template-extracteur-rendu.md) —
  définir ce format **avec** ce pattern, pas dans son coin.

## Dépendances

- **Prérequis de** : la [vue « sprints réalisés »](20260826072532452_vue-sprints-realises-ezk-map.md).
- **Cas d'application de** : le pattern [« livrable lisible »](20260825182327490_pattern-livrable-lisible-template-extracteur-rendu.md).
- **Miroir de** : la [capture rétro standard](0080-ezk-retro-compte-rendu-standard.md)
  (même patron « source normée + extractible », côté rétros).
- **Touche** : le skill `ezk-archive`. Interne au monorepo — **pas** de dépendance externe
  (slot DoR conditionnel non requis).

## Critères d'acceptation

- [ ] `ezk-archive` produit un compte-rendu avec un **frontmatter structuré** : méta de
      session + liste des sprints (PR · fiches livrées · actions).
- [ ] Un **compte-rendu récent** est mis au format cible, comme exemple vérifiable.
- [ ] Le frontmatter se **parse** sans ambiguïté (sprints, PR, fiches, actions extractibles).
- [ ] Le **récit lisible** (corps « En clair » + sections) est préservé.
- [ ] **Zéro** donnée saisie hors de ce que la clôture connaît déjà (le script range).

## Comment vérifier

Clôturer une session via `ezk-archive run` → le compte-rendu de `docs/sessions/` porte
**son frontmatter structuré** (sprints/PR/fiches/actions) **et** son récit ; un parse
trivial en sort les sprints — c'est ce que consommera `pnpm ezk:map sprints`.

## Notes

- **Origine** : arbitrage PO du 2026-08-26 (« rétablir la symétrie » — les rétros ont leur
  fiche-prérequis, pas les sprints).
- **Product `mega-city`**.
