---
id: "20260917123943914"
title: Outils dans la carte méthode — un type de nœud `tool` (bin/script/commande) relié aux skills
type: feature
priority: P2
product: mega-city
version: V0.1
milestone: fondation
labels: [carte]
status: idea
ready:
pr:
created: 2026-09-17
---

# Outils dans la carte méthode — un nœud `tool` relié aux skills

## En clair

Quand on ouvre la carte méthode (`pnpm ezk:map`), on voit les **skills**, les **agents**, les
**règles**, les **bundles** et les **profils**, et comment ils se composent. Mais on **ne voit pas
les outils** que la méthode utilise vraiment : les scripts `bin/*.ts`, les `.sh`, les commandes CLI
(`regen-backlog`, `avancement`, `fiches:check`…). Le PO l'a relevé le 2026-09-17 : *« on ne voit pas
les outils utilisés par la méthode dans la map »*.

Cette fiche propose d'ajouter un **6ᵉ type de nœud, `tool`**, relié aux skills/agents qui s'en
servent — pour qu'on voie, sur la carte, quel outil fait quoi et qui l'appelle.

## Contexte / Problème

Le graphe compilé (`products/mega-city/src/core/graph.ts`) modélise **5 types de nœuds** :
`rule | agent | skill | bundle | profile`, avec leurs liens de composition (`composes`, `roles`,
`competences`, `enforces`, `profile-*`…). Les **outils** ne sont pas des nœuds :

- un `bin/*.ts` ou un `*.sh` (ex. `regen-backlog.sh`, `ezk-map.ts`, `check-fiches.ts`) n'apparaît
  nulle part sur la carte ;
- une **commande** (script npm, sous-commande de skill) n'y est pas non plus.

Aujourd'hui les **commandes** sont listées par `ezk-help` (l'index des commandes), et le CLI unique
est le sujet de [`20260903134906920`](20260903134906920_cli-ezk-point-d-entree-unique.md). Mais
aucune de ces deux briques ne **relie** un outil au(x) skill(s) qui l'appelle(nt), ni ne le pose sur
la **carte** à côté des skills. Résultat : la carte dit *quelles* skills existent et *qui compose
qui*, mais pas *avec quels outils* la méthode s'exécute.

Analogie : on a le plan des **pièces** de la maison (skills/agents) et **qui communique avec qui**
(composition), mais pas les **appareils** branchés dans chaque pièce (les outils).

## Proposition (esquisse — à cadrer à l'étape Archi)

1. **Nouveau `NodeKind` : `tool`.** Un outil = un `bin/*` / `*.sh` / commande de la méthode.
2. **Nouveau lien `uses` : `skill → tool`** (et `agent → tool` si pertinent). La carte affiche
   l'outil rattaché aux skills qui l'appellent (provenance).
3. **La source des arêtes `skill↔tool`** — la vraie décision d'archi : d'où vient la relation ?
   Options à trancher :
   - **parser les `SKILL.md`** pour les références de scripts/commandes qu'ils mentionnent (dérivé,
     pas de saisie — cohérent avec « la carte dit vrai, compilée des fichiers ») ;
   - un **champ déclaré** (`tools:`/`uses:`) dans le front-matter des skills ;
   - s'adosser à un **manifeste de commandes** existant (celui d'`ezk-help`).
   Reco de départ : **dérivé** (parse), pour ne pas créer une liste à maintenir à la main.
4. **Rendu** sur la carte méthode (`diagrams/methode-mega-city/`) : les outils comme une strate/forme
   distincte, reliés aux skills.

## Critères d'acceptation (esquisse — à groomer)

- [ ] Le graphe compilé porte un type de nœud `tool` + un lien `uses` (skill/agent → tool), **dérivé**
      des fichiers (pas de liste saisie à la main).
- [ ] La carte méthode **affiche** les outils, chacun relié à au moins un skill/agent qui l'appelle.
- [ ] Un outil **orphelin** (référencé par aucun skill) est signalé, pas masqué en silence (cohérent
      avec la doctrine de provenance de la carte).
- [ ] Gate locale verte (typecheck/lint/tests) + liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map
```

Ouvrir la **carte méthode** : les outils (`regen-backlog`, `avancement`, `fiches:check`…)
apparaissent, chacun **relié** aux skills qui l'utilisent.

## Anti-doublon

- **≠ `ezk-help`** (`20260903085150321` et voisines) : `ezk-help` **liste** les commandes ; ici on les
  **pose sur la carte** et on les **relie** aux skills (mécanisme du graphe, pas un index).
- **≠ CLI `ezk`** ([`20260903134906920`](20260903134906920_cli-ezk-point-d-entree-unique.md)) : le CLI
  est le **point d'entrée** d'exécution ; cette fiche est une **facette de visualisation** de la carte.
- **S'adosse** au graphe compilé + validateur (ADR-0040) : c'est un **6ᵉ NodeKind**, pas un
  nouveau système.
- **Facette de la carte méthode** — voisine des facettes de l'ex-épic carte (`20260821163346487`,
  fondu A16) : provenance, unités de revue… « voir les outils » est une facette de plus.

## Notes

- **Origine** : retour PO du 2026-09-17 en testant `ezk:map` (« on ne voit pas les outils de la
  méthode dans la map »). Confirmé côté code : `NodeKind = rule|agent|skill|bundle|profile` — pas de
  `tool` (`products/mega-city/src/core/graph.ts`).
- **Product `mega-city`** (là où vivent le graphe, la carte et les outils `bin/`).
