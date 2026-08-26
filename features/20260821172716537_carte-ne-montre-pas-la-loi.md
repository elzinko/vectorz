---
id: "20260821172716537"
title: La carte ne montre pas LA LOI de l'intérieur (règles, bundles, profils — et qui les lit)
type: feature
priority: P1
product: mega-city
version:
epic: "20260821163346487"
status: todo
ready: 2026-08-26
pr:
created: 2026-08-21
---

# La carte cache la moitié la plus prouvable de la méthode

## En clair

Le 2026-08-21, tu as cherché sur la carte un concept pourtant déjà décidé et rangé dans
les fichiers — « des règles activables, composées par le projet » — et tu ne l'as **pas
trouvé** : « je ne retrouve pas le concept dans la map et ça m'embête ». La carte affiche
LA LOI comme **un seul bloc opaque**, alors que tout son intérieur est dans des fichiers
lisibles. Cette fiche l'**ouvre** : voir les règles, les bundles, les profils, et **qui
active quoi**.

> **Groomé le 2026-08-26 — grosse simplification.** Avant, il fallait construire un
> compilateur qui lise les `.yml` à la main. Depuis, l'[ADR-0040](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md)
> a livré `graph:compile`, qui **compile déjà toute la LOI** en un graphe typé. La carte
> n'a plus qu'à **le lire**. Statut laissé `idea` — le gate `ready` promeut.

## Contexte / Problème

Ce que la carte ne montre pas aujourd'hui, alors que c'est la partie la **plus sourçable**
de toute la méthode (du YAML et du frontmatter purs, zéro interprétation) :

- les **10 domaines de règles** (`rules/` : architecture, ci-cd, clean-code, testing,
  documentation-guidelines…) et les **59 règles** qu'ils contiennent ;
- les **12 bundles** (`bundles/*.yml` : des groupes de règles nommés) ;
- les **6 profils** (`profiles/*.yml` : qui active quoi, projet par projet) ;
- les liens **règles → agents** (11, déjà déclarés via `interactions:`) et
  **skills → règles** (à venir, quand le lien sera déclaré).

**Ce qui a changé (2026-08-26).** Le graphe compilé d'ADR-0040 modélise **déjà** tous ces
nœuds et leurs liens. Vérifié sur `.ezk/graph.compiled.json` : `rule`×59, `bundle`×12,
`profile`×6, plus les arêtes `bundle→rule`, `profile→bundle`, `profile→agent/skill`,
`rule→agent`. La chaîne **« qui active quoi »** (profil → bundle → règle ; profil →
agent/skill) **s'y lit directement**. La carte ne compile plus rien — elle lit l'objet.

## Valeur

Chercher « composition » ou « règles » sur la carte **aboutit**. Un lecteur répond « qui
active quoi ? » pour un profil donné **sans ouvrir un `.yml`**. Et comme cette zone est la
plus prouvable (générée d'un graphe déterministe), elle devient **l'étalon de fidélité**
des autres zones de la carte.

## Proposition (groomée — lire le graphe compilé)

1. **Ouvrir le bloc LA LOI** : afficher les nœuds `rule` / `bundle` / `profile` comme des
   nœuds de la carte, **lus depuis `.ezk/graph.compiled.json`** (ADR-0040) — jamais
   recopiés à la main, jamais re-parsés des `.yml`.
2. **Afficher les liens déjà présents** dans le graphe : `bundle→rule` (quelles règles
   dans un bundle), `profile→bundle` et `profile→agent/skill` (qui active quoi),
   `rule→agent` (règle qui cible un agent), `profile→profile` (héritage).
3. **Respecter la doctrine D5** : la carte **lit** l'objet compilé (généré par
   `graph:compile`), elle **ne recompile pas** au bord — fraîcheur garantie par le check
   déjà en place (CI / `ship`).
4. Chaque nœud porte sa **provenance fichier** (le `.yml`/frontmatter d'origine) : la zone
   LOI peut être la première **100 % prouvée** de la carte.

## Périmètre

**Dans le lot (visé ready)** : afficher le sous-graphe LOI (règles, bundles, profils + les
liens ci-dessus) lu du graphe compilé, avec provenance et recherche.

**Hors lot** : le lien **skills → règles** tant qu'il n'est **pas déclaré** dans les
frontmatter (le graphe ne le porte pas encore) — il apparaîtra tout seul quand il existera.

## Décision laissée à l'étape Archi (avec recommandation)

- **Source** : le **graphe compilé** d'ADR-0040 **(recommandé)** — pas de relecture directe
  des `.yml` (ce serait un 2ᵉ compilateur qui dériverait du premier).
- **Intégration** : ouvrir le bloc LOI **dans la carte existante** (`methode-mega-city`) vs
  un onglet `ezk:map` dédié — à trancher au sprint (la carte est déjà servie par `ezk-map`).

## Dépendances

- **Interne, livrée** : `graph:compile` (ADR-0040) — expose les nœuds LOI et leurs liens.
  Déjà sur `main`. **Pas** de dépendance externe (tout est dans le monorepo) — slot DoR
  conditionnel non requis.
- **Épic parent** : [Épic — La carte de la méthode : fidèle aux fichiers](20260821163346487_carte-methode-fidele-et-revue.md).

## Critères d'acceptation

- [ ] Chercher « composition » ou « règles » sur la carte **aboutit** — le concept se voit.
- [ ] Les **règles, bundles, profils** sont affichés comme nœuds, **lus du graphe compilé**
      (pas des `.yml` à la main).
- [ ] Les liens **bundle→règle**, **profil→bundle**, **profil→agent/skill**, **règle→agent**
      sont visibles et **sourcés** (provenance fichier).
- [ ] Un lecteur répond **« qui active quoi ? »** pour un profil donné sans ouvrir un `.yml`.
- [ ] **Sabotage** : ajouter un bundle dans `bundles/`, relancer `graph:compile` → il
      **apparaît** sur la carte **sans** édition de la carte.
- [ ] La carte **lit** l'objet compilé ; elle **ne recompile pas** au bord (doctrine D5).

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:compile
pnpm ezk:map
```

Avant : chercher « bundle » ou « profil » sur la carte → introuvable (c'est le manque).
Après : le sabotage du critère 5, en moins d'une minute.

## Notes

- **Symptôme fondateur** : la question « recette site produit » du 2026-08-21 — le concept
  existait, la carte ne le montrait pas.
- **MAJ 2026-08-26** : ADR-0040 dé-risque la fiche (le graphe est compilé ; la carte n'est
  plus qu'un lecteur). Chiffres constatés sur `.ezk/graph.compiled.json` : 59 règles,
  12 bundles, 6 profils, 187 liens.
