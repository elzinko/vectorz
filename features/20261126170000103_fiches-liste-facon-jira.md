---
id: "20261126170000103"
title: "La page Fiches est une liste filtrable façon Jira, le kanban reste sous une icône"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-26
---

# 20261126170000103 — La page Fiches est une liste filtrable façon Jira, le kanban reste sous une icône

**En clair.** La page Fiches n'a qu'un kanban en colonnes, sans recherche ni filtre, et il met en tête 43 idées. On ajoute la liste de la maquette avec ses colonnes, ses filtres et ses puces. Le kanban reste accessible par l'icône Colonnes.

**Si tu arrives frais.** Une « fiche » est une unité de travail du backlog. Les étapes sont idée, prête, en sprint, en revue, livrée. Les fiches parkées (mises de côté) et closes sont masquées par défaut. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/05-fiches-app.png` et `05-fiches-maquette.png`.

- L'app affiche trois colonnes (Idées, Prêtes, En cours, Livrées) et un seul sélecteur « Lot ». Aucune recherche, aucun filtre par objectif ou priorité.
- La maquette montre une liste d'une ligne par fiche, « 34 affichées sur 399 », des filtres en menus et des puces actives.
- Les fiches bloquées n'ont pas de colonne « Bloquée » : le motif est invisible.

## Proposition

**Liste** (donnée : `ezk board show --json`, motif de blocage en français : `ezk backlog show --json` ; si le motif est publié en un mot, l'écran garde le mot et l'écrit « motif brut »).

1. **Colonnes** : fiche (titre complet au survol), étape, priorité, objectif, version, bloquée, avis, menu « ⋯ ».
2. **Recherche** par titre. **Filtres en menus** : Étape, Drapeau, Objectif, Version, Priorité.
3. **Puces** des filtres actifs, chacune fermable, plus un bouton « Tout effacer ». Compteur « 34 affichées sur 399 ».
4. **Défaut** : parkées et closes masquées, avec leurs deux puces « parkée : masquée » et « close : masquée ».
5. **Bouton « Groomer »** sur les idées libres seulement (non bloquées). Commande en infobulle.
6. **Pouces d'avis** sur les livrées : le PO note la fiche ; la valeur vient du contrat quand il existe, sinon les pouces restent inactifs (« avis non publié »).
7. **Menu « ⋯ »** : Marquer prête, Parker, Lever le blocage, Ouvrir la fiche. Chaque entrée n'apparaît que si la méthode offre le geste ; sinon elle manque, elle n'est pas simulée.
8. **Colonnes (kanban)** : l'icône bascule vers le kanban actuel, inchangé.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [ ] La page ouvre en liste avec les colonnes fiche, étape, priorité, objectif, version, bloquée, avis.
- [ ] La recherche et les cinq filtres réduisent la liste ; les puces actives apparaissent et « Tout effacer » les retire.
- [ ] Parkées et closes sont masquées par défaut, avec leur puce ; les retirer les rend visibles.
- [ ] « Groomer » n'apparaît que sur une idée non bloquée ; les pouces n'apparaissent que sur une livrée.
- [ ] Le compteur dit « X affichées sur Y » et reste exact après filtrage.
- [ ] L'icône Colonnes ouvre le kanban actuel sans perte de fonction.
- [ ] Un test couvre filtre + recherche + masquage par défaut sur un jeu de fiches mêlant étapes et drapeaux.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web test -- FichesView.test.tsx
```

- vue Fiches : http://localhost:5273 → menu Fiches : filtrer sur Étape = idée, effacer, basculer sur Colonnes.

## Hors périmètre

- Les gestes eux-mêmes (groomer, parker, lever un blocage) : le menu ne les expose que s'ils existent déjà côté méthode.
- La page d'une fiche (FicheModal).
- Un contrat d'avis nouveau.
