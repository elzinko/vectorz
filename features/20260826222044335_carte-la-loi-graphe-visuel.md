---
id: "20260826222044335"
title: Carte LA LOI — dessiner le graphe (arêtes visuelles), pas seulement des listes au clic
type: feature
priority: P2
product: mega-city
version:
epic: "20260821163346487"
status: idea
ready:
pr:
created: 2026-08-27
---

## En clair

La carte « LA LOI » (livrée par la fiche [20260821172716537](20260821172716537_carte-ne-montre-pas-la-loi.md), PR #179) montre les règles, bundles et profils en **colonnes**, et leurs liens en **listes** (au clic sur un nœud, dans un panneau latéral). Elle ne **dessine** pas encore les liens comme des **traits** entre les nœuds, à la manière de `diagrams/methode-mega-city/carte-interactive.html`. Cette fiche = passer de « listes au clic » à un **graphe visuel** (nœuds reliés par des arêtes).

## Contexte / Problème

Retour PO du 2026-08-27 (relecture de la PR #179) : « on ne voit pas les liens entre les bundles et les règles ». Les liens **existent** (corrects, sourcés, testés — `bundle→règle`, `profil→bundle`, `profil→agent/skill`, `règle→agent`), mais ne sont rendus qu'en listes. Un lecteur attend de **voir** les connexions, comme sur la carte interactive de la méthode.

## Proposition

Rendre le sous-graphe LA LOI en **graphe dessiné** (nœuds + arêtes) en plus des colonnes :
- Réutiliser `extractLoi` / `whoActivates` / `enforcingAgents` / `bundleRules` de `products/mega-city/src/core/loi-view.ts` (source unique, déjà testée) — ne rien réimplémenter.
- Toujours **lire** `.ezk/graph.compiled.json` au runtime (doctrine D5, ADR-0041) — pas de recompilation au bord.
- Choisir le rendu (SVG maison, ou la techno de `carte-interactive.html`) à l'étape archi.

## Critères d'acceptation

- [ ] Les arêtes `bundle→règle`, `profil→bundle`, `profil→agent/skill`, `règle→agent` sont **dessinées** entre les nœuds (pas seulement en listes).
- [ ] Cliquer/survoler un nœud met en évidence ses arêtes (lisibilité).
- [ ] Toujours sourcé du graphe compilé ; le sabotage (ajouter un bundle → `graph:compile`) reste vert.
- [ ] Reste lisible malgré 59 règles (regroupement / filtrage, pas un plat de spaghettis) — appliquer la règle de lisibilité des diagrammes.

## Comment vérifier

```bash
pnpm --dir products/mega-city graph:compile
pnpm --dir products/mega-city exec tsx bin/ezk-map.ts carte-la-loi
# Les liens apparaissent comme des traits entre les vignettes, pas seulement en listes au clic.
```

## Notes

- Suite directe de [20260821172716537](20260821172716537_carte-ne-montre-pas-la-loi.md) (PR #179) et d'[ADR-0041](../products/mega-city/docs/adr/0041-carte-la-loi-lecteur-runtime-graphe-compile.md).
- Le **panneau de détail collant** (voir le détail au clic) a déjà été livré dans la PR #179 — il ne reste que le **graphe dessiné** ici.
