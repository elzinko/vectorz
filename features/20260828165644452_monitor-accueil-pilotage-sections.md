---
id: "20260828165644452"
title: Accueil du monitor — regrouper les diagrammes d'archi et mettre le pilotage en tête
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [ezk-map, ux, pilotage]
status: todo
ready: 2026-08-29
pr:
created: 2026-08-28
---

# 20260828165644452 — Accueil du monitor : pilotage en tête, diagrammes regroupés

## En clair

La page d'accueil du site (`pnpm ezk:map`, futur `ezk:monitor`) liste **les 9 cartes à
plat**. On lit mal le menu : les vues de **pilotage** (board, plan, écart-plan) et les
**diagrammes d'archi** (domaine, méthode, LA LOI, qualité…) sont mélangés.

On la range en **trois sections** : **Pilotage** en tête, puis **Diagrammes d'archi**, puis
**Autres**. Chaque carte déclare sa section via un champ **`categorie:`** dans son `meta.yaml`
(décision PO du 2026-08-29). Défaut « autres » si le champ manque — rien ne casse.

## Contexte / Problème

La route `/` (livrée, PR #170, fiche [[20260825152954193]]) rend `listDiagrams()` **à plat**,
avec la carte méthode en tête (featured). Depuis, le site a gagné le board, la vue Plan,
l'écart-plan, et bientôt le cockpit sessions — le menu plat ne hiérarchise plus rien. Le
`meta.yaml` porte déjà `title:` et `type:`, mais `type` décrit la **nature** du diagramme
(board / flowchart / interactive), pas sa **section**. Demande PO (2026-08-29) : structurer
l'accueil en sections, pilotage d'abord.

Fondations présentes (vérifiées le 2026-08-29) : `src/core/ezk-map-menu.ts` (PUR :
`readMetaTitle`, `orderDiagrams`, `renderMenuHtml`), `bin/ezk-map.ts` (le bord I/O qui lit les
`meta.yaml` et sert `/`).

## Proposition

POC d'abord. Compiler depuis les fichiers, ne rien saisir à la main (comme le menu actuel).

1. **`categorie:` dans `meta.yaml`** — valeurs `pilotage | archi | autres`, lu par **balayage
   de ligne** (comme `title:`, zéro dépendance), défaut **`autres`**. Cœur pur
   `readMetaCategorie` (sœur de `readMetaTitle`).
2. **Grouper** : `groupDiagrams(items)` → sections **ordonnées** `[pilotage, archi, autres]`,
   la carte méthode gardée **en tête de sa section** (featured conservé). Une section vide est
   **omise**.
3. **`renderMenuHtml` rend des sections** (un titre `<h2>` + une grille par section) au lieu
   d'une grille plate unique. **Même design** (tokens/CSS repris).
4. **Rangement initial** (posé dans les `meta.yaml`) :
   - **pilotage** : `avancement` ;
   - **archi** : `methode-mega-city`, `domaine-mega-city`, `carte-la-loi`,
     `qualite-composants`, `qualite-composants-detail`, `qualite-deploiement`,
     `qualite-flux-emission-agregation` ;
   - **autres** : `benchmark-bmad-ezk` (garde le défaut).
5. **Ne rien casser** : `pnpm ezk:map <slug>` ouvre toujours une carte en direct ; la barre de
   navigation dans les cartes est inchangée ; « Précédent » ramène au menu.

## Critères d'acceptation

- [ ] La route `/` affiche **trois sections titrées** (Pilotage / Diagrammes d'archi / Autres),
      **Pilotage en tête**.
- [ ] Chaque carte est rangée par le champ **`categorie:`** de son `meta.yaml` ; **défaut
      « autres »** si le champ manque, **sans erreur**.
- [ ] Le board d'avancement est sous **Pilotage** ; domaine / méthode / LA LOI / qualité sous
      **Archi** ; le benchmark sous **Autres**.
- [ ] La carte méthode garde son **badge « méthode »** et reste **en tête de la section Archi**.
- [ ] Une **section sans carte est omise** (pas de titre orphelin).
- [ ] `pnpm ezk:map <slug>` ouvre toujours la carte en direct (comportement **inchangé**).
- [ ] **Zéro nouvelle dépendance** (`categorie` lu par balayage de ligne) ; rendu échappé
      (`escapeHtml`, comme les titres).
- [ ] Gate locale verte (typecheck / lint / tests) ; liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map             # l'accueil montre 3 sections, Pilotage en tête
pnpm ezk:map avancement  # ouverture directe d'une carte : inchangée
```

Preuve agent attendue : capture de l'accueil avec les trois sections (Pilotage en premier,
diagrammes d'archi regroupés).

## Notes / décisions

- **Origine** : brainstorm PO 2026-08-28. **Groomée 2026-08-29.**
- **Décisions PO (grooming 2026-08-29)** : mécanisme = champ `categorie:` dans `meta.yaml`
  (chaque carte se décrit, auto-extensible) ; sections `pilotage | archi | autres` ; méthode
  gardée featured en tête de la section Archi.
- **Périmètre** : organisation de l'accueil (sections + tri), **pas** de refonte des vues
  (décision PO 2026-08-23 : réunir l'accès, ne pas fusionner les vues).
- Incrément sur l'accueil livré [[20260825152954193]] (PR #170). Lien avec le rename
  [[20260826173005368]] (`ezk:map` → `ezk:monitor`) : **indépendant**, peut livrer séparément.
