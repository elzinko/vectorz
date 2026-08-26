---
id: "20260826072532452"
title: Vue « sprints réalisés » dans ezk:map — chaque sprint et son détail (PR, fiches, actions), extrait des comptes-rendus
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

# Vue « sprints réalisés » dans `ezk:map`

## En clair

Une sous-page de `ezk:map` pour **revoir les sprints déjà faits**, seul ou en groupe
(un product-build). Pour chaque sprint, on voit **ce qu'il a livré** : ses PR, ses
fiches, ses actions. Pour que la vue puisse afficher ce détail, il y a **un prérequis** :
que chaque compte-rendu de session porte ces informations **sous une forme lisible par
un script**. Aujourd'hui ils sont en prose libre, et deux d'entre eux portent même le
même titre — donc rien de fiable à extraire tel quel.

> **Groomé le 2026-08-26.** Périmètre arrêté avec le PO : **extraction structurée par
> sprint** (option riche), pas un simple index de liens. Statut laissé en `idea` — c'est
> le gate `ready` qui la promeut quand tu la tires.

## Contexte / Problème

Un sprint réalisé est aujourd'hui éparpillé : son récit en prose dans `docs/sessions/`,
ses fiches passées dans `features/done/`, ses lignes barrées dans `PLAN.md`. Aucune
porte d'entrée unique pour « relire le sprint X ».

Et les récits **ne se ressemblent pas** :

- Les **récents** (produits par `ezk-archive`) sont riches : titre, la liste des sprints,
  les liens PR, parfois une mini-rétro. Exemple : `2026-08-26-product-build-4-sprints.md`
  (4 sprints, PR #171/#173/#174/#175).
- Les **anciens**, écrits à la main, sont pauvres et sans structure fixe. Aucun
  frontmatter. Deux fichiers portent le **titre identique** `# Sprint — 0191…` ; un
  troisième a un titre décorrélé de son nom.

**Conséquence directe** : extraire « les PR de tel sprint » par lecture du texte serait
**fragile** — ça marcherait sur les récents et casserait sur les anciens. La version
riche demandée exige donc d'abord **une donnée structurée dans les comptes-rendus**.

Enfin, ce besoin **n'est pas neuf** : c'est le lot que la fiche livrée
[[20260823124042842]] avait volontairement réservé (« la frise des sprints »), le panel
adverse craignant un « 4ᵉ système scrum ». Le garde-fou reste : **on ne fabrique aucun
objet sprint saisi à la main** — la donnée naît là où le sprint se clôt (dans le
compte-rendu produit par `ezk-archive`).

## Valeur

Une porte d'entrée unique pour **voir, par sprint, ce qui a été livré**, sans fouiller
trois endroits. Sert à : se remémorer, **rendre compte**, **préparer une rétro** (quels
sprints, quelles actions), et **alimenter la revue des fiches** (fiche pouce
[[20260826072532622]], qui agit sur le board).

## Proposition (groomée — extraction structurée)

Deux temps, à confirmer par l'étape Archi du sprint :

**1a — La source structurée (le prérequis).** `ezk-archive`, qui produit déjà le
compte-rendu à la clôture, y ajoute un **frontmatter structuré** : la liste des sprints
de la session, chacun avec **PR** (numéro + lien), **fiches livrées** (ids) et **actions
mesurables**. Le corps reste le **récit lisible** — la donnée vit en tête, le récit
dessous (même doctrine que les fiches du backlog : « frontmatter = source de vérité »).

**1b — La vue.** Un onglet `pnpm ezk:map sprints`, sur le **patron d'onglet existant**
(cœur pur `src/core/…-data.ts` + chargeur `src/loaders/…` + `bin/regen-sprints-data.ts`
qui écrit + test d'invariant « régénéré ≡ disque », exactement comme `avancement`). La
page affiche, **par groupe puis par sprint** : ses PR (liens), ses fiches (liens), ses
actions. Un compte-rendu multi-sprints est un **groupe** ; un compte-rendu seul, un
sprint isolé.

**Repli pour les anciens.** Un compte-rendu **sans** frontmatter s'affiche en **mode
dégradé** — date + titre + lien vers le fichier — sans casser la vue. **Pas de
réécriture obligatoire** de l'historique.

## Périmètre

**Dans le lot (visé ready)** : 1a (le format + `ezk-archive` l'émet) et 1b (la vue lit
et affiche), le mode dégradé pour les anciens, le test d'invariant.

**Hors lot (gated — décision après usage)** :
- La **frise temporelle** / diagramme du process avec les fiches posées sur les étapes
  (déjà réservé par [[20260823124042842]]).
- Le **rétro-fit** des anciens comptes-rendus (leur écrire un frontmatter à la main).

## Décisions laissées à l'étape Archi (avec recommandation)

1. **Forme de la donnée** : frontmatter YAML dans le compte-rendu **(recommandé)** vs
   parsing du corps en prose (fragile — écarté par le constat ci-dessus).
2. **Producteur** : la convention s'ancre dans **`ezk-archive`** (recommandé — il est
   déjà le générateur des comptes-rendus).
3. **Découpage** : 1a (la source) **a désormais sa fiche sœur** —
   [`ezk-archive` émet un compte-rendu structuré](20260826121429274_ezk-archive-compte-rendu-structure.md)
   (créée le 2026-08-26, arbitrage symétrie). Cette vue (1b) la **consomme**.
4. **Anciens comptes-rendus** : mode dégradé **(recommandé)** vs rétro-fit.

## Dépendances

- **Interne, dans le monorepo** : `ezk-archive` (skill présent) — producteur du format
  structuré. Pas de dépendance **externe** (hors monorepo, service, secret) : la source
  `docs/sessions/` et l'outil `ezk-archive` sont dans le repo. Le slot DoR « dépendance
  externe constatée » ne s'applique donc pas.
- **Voisines** : la vue rétros [[20260826072532537]] suit **le même patron** (vue
  structurée ← format normé ; symétrie : sprints ↔ `docs/sessions/`, rétros ↔
  `docs/captures/`) ; la fiche pouce [[20260826072532622]] consomme le board ; parente
  [[20260823124042842]] (lot gated).

## Critères d'acceptation

- [ ] `ezk-archive` produit un compte-rendu avec un **frontmatter structuré** : liste des
      sprints, chacun avec PR, fiches livrées, actions mesurables (preuve : le prochain
      compte-rendu de clôture le porte).
- [ ] `pnpm ezk:map sprints` affiche, **par groupe puis par sprint**, ses PR (liens),
      fiches (liens) et actions.
- [ ] Un compte-rendu **multi-sprints** apparaît comme un **groupe** ; un compte-rendu
      seul, comme un sprint isolé.
- [ ] Les données sortent d'un **script** (`bin/regen-sprints-data.ts`) lisant les
      frontmatters ; un **test d'invariant** rougit si un compte-rendu change sans regen.
- [ ] Un ancien compte-rendu **sans frontmatter** s'affiche en **mode dégradé**
      (date + titre + lien) **sans casser** la vue.
- [ ] **Zéro** donnée saisie à la main dans la vue ; aucun objet « sprint » hors des
      comptes-rendus (garde-fou panel respecté).
- [ ] Gate locale verte (typecheck/lint/tests) + liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map sprints
```

1. **Clôturer une session** via `ezk-archive` → le compte-rendu sort **avec** son
   frontmatter structuré ; `pnpm ezk:map sprints` liste ce sprint **avec** ses PR /
   fiches / actions.
2. **Ajouter un vieux fichier** sans frontmatter dans `docs/sessions/` → il apparaît en
   **mode dégradé**, la vue tient.
3. **Modifier un compte-rendu** sans régénérer → le **test d'invariant rougit**.

## Notes

- **Suite du lot gated** de [[20260823124042842]] (board livré, frise réservée) —
  dé-gating déclenché par le retour PO du 2026-08-26.
- **Choix PO 2026-08-26** : extraction structurée par sprint (option riche), et non un
  simple index de liens.
- **Briques réutilisables** (patron `avancement`) : `bin/ezk-map.ts` (onglets),
  `src/core/avancement-data.ts` + `bin/regen-avancement.ts` (patron « données d'onglet »
  compilées + invariant), `src/loaders/fiches.ts` (modèle de chargeur).
- **Product `mega-city`** : là où vivent la map, les scripts `bin/`, les cœurs `src/`.
