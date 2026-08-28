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
ready:
pr:
created: 2026-08-28
---

# 20260828165644452 — Accueil du monitor : pilotage en tête, diagrammes regroupés

## En clair

La page d'accueil du site (`pnpm ezk:map`, futur `ezk:monitor`) liste **toutes les cartes à
plat**. On lit mal le menu : les vues de **pilotage** (board, plan, sessions) et les
**diagrammes d'archi** (domaine, méthode, carte LA LOI…) sont mélangés.

Deux besoins, tous deux exprimés par le PO :

1. **Mettre le pilotage en tête** — la vue qui sert à conduire le projet (board / plan +
   cockpit sessions) doit être la première chose qu'on voit.
2. **Regrouper les diagrammes d'archi** dans une **section à part**, pour que le menu se lise
   d'un coup d'œil.

## Contexte / Problème

La route `/` (livrée, PR #170, fiche [[20260825152954193]]) rend `listDiagrams()` **à plat**,
avec la carte méthode en tête. Depuis, le site a gagné le board, la vue Plan, et bientôt le
cockpit sessions — le menu plat ne hiérarchise plus rien. Demande PO (2026-08-28) : structurer
l'accueil en **sections**, pilotage d'abord.

Lien (pas doublon) avec le rename [[20260826173005368]] (`ezk:map` → `ezk:monitor`) : ce
rename change le **nom** du site ; cette fiche change l'**organisation** de son accueil. Les
deux sont indépendantes et peuvent livrer séparément.

## Proposition

POC d'abord. Compiler depuis les fichiers, ne rien saisir à la main (comme le menu actuel).

1. **Des sections dans la route `/`** au lieu d'une liste plate. Ordre proposé :
   **① Pilotage** (board / plan, cockpit sessions) → **② Diagrammes d'archi** (domaine,
   méthode, carte LA LOI, avancement…) → **③ Autres**.
2. **Une catégorie par carte.** Il faut savoir ranger chaque carte. Piste (à trancher au
   grooming) : un champ `categorie:` optionnel dans chaque `diagrams/<slug>/meta.yaml`, lu au
   **balayage de ligne** (zéro dépendance, comme le titre) ; défaut « Autres » si absent.
3. **Ne rien casser** : `pnpm ezk:map <slug>` ouvre toujours une carte en direct ; la carte
   méthode reste accessible ; « Précédent » ramène au menu.

## Critères d'acceptation

- [ ] La route `/` affiche des **sections** (pilotage / diagrammes d'archi / autres), pas une
      liste plate.
- [ ] La **section pilotage est en tête** et contient board / plan (et le cockpit sessions
      quand il existe).
- [ ] Les **diagrammes d'archi sont regroupés** dans leur propre section.
- [ ] Chaque carte est rangée par une **catégorie** dérivée des fichiers (champ `meta.yaml`),
      défaut « Autres » si non renseignée — jamais d'erreur.
- [ ] `pnpm ezk:map <slug>` ouvre toujours la carte en direct (comportement **inchangé**).
- [ ] **Zéro nouvelle dépendance** ; gate locale verte ; liens markdown OK.

## Comment vérifier

```bash
pnpm ezk:map            # la page d'accueil montre les sections, pilotage en tête
pnpm ezk:map avancement # ouverture directe d'une carte : inchangée
```

Preuve agent attendue : capture de l'accueil avec les sections (pilotage en premier,
diagrammes d'archi regroupés).

## Notes / décisions

- **Origine** : brainstorm PO 2026-08-28 (vue de pilotage). Incrément sur l'accueil livré
  [[20260825152954193]] (PR #170).
- **Périmètre** : organisation de l'accueil (sections + tri), **pas** de refonte des vues
  elles-mêmes (décision PO 2026-08-23 : réunir l'accès, ne pas fusionner les vues).
- **À trancher au grooming** : mécanisme de catégorie (`categorie:` dans `meta.yaml` vs
  convention de dossier) ; intitulés et ordre exacts des sections ; articulation avec le
  rename [[20260826173005368]].
