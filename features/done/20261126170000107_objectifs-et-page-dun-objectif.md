---
id: "20261126170000107"
title: "Les pages Objectifs et d'un objectif suivent la maquette, avec progression et filtre « en cours »"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: shipped
blocked:
depends: []
pr: "local (b10695aa)"
evidence: before-after
created: 2026-11-26
---

# 20261126170000107 — Les pages Objectifs et d'un objectif suivent la maquette, avec progression et filtre « en cours »

**En clair.** La page Objectifs n'a ni recherche ni filtre, et son avancement ne se lit pas d'un coup d'œil. On ajoute recherche, filtres, barre de progression et filtre « en cours » par défaut. La page d'un objectif suit la maquette.

**Si tu arrives frais.** Un objectif est le mot d'écran du champ `milestone:` d'une fiche. Il regroupe des fiches qui portent un même but. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/04-objectifs-app.png` / `04-objectifs-maquette.png` et `18-un-objectif-app.png` / `18-un-objectif-maquette.png`.

- `ObjectifsView.tsx` liste tous les objectifs, sans filtre ni barre de progression.
- La maquette montre 13 objectifs « dans l'ordre du plan » et ne garde par défaut que ceux « en cours ».
- Les objectifs sans nom publié affichent « nom non publié ».

## Proposition

**Page Objectifs** (donnée : `ezk board show --json`) :

1. Titre « Objectifs », compteur « 13 · dans l'ordre du plan », « i ».
2. Recherche ; filtres État, Version, Bloquées ; puces actives ; « Tout effacer ». **Défaut : « en cours »**.
3. Colonnes : plan, objectif, nom, **barre de progression livrées / total**, actives (idées, bloquées avec raisons), versions portées, menu « ⋯ ».
4. Menu « ⋯ » : Groomer ses fiches, Voir ses fiches, Ouvrir l'objectif ; chaque entrée seulement si le geste existe.
5. « Afficher plus » centré, compteur à droite.

**Page d'un objectif** :

1. En-tête : avancement, « à faire », versions portées avec leurs nombres, « livrées sans numéro », place dans le plan.
2. **Fiches à faire** : titre, priorité, étape, motif de blocage.
3. **Fiches livrées** : liste courte, « Afficher plus ».
4. Bouton « Groomer l'objectif » seulement si le geste existe côté méthode.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

- [x] Le filtre État vaut « en cours » à l'ouverture, et sa puce se retire.
- [x] La recherche et les filtres État, Version, Bloquées réduisent la liste.
- [x] Chaque ligne montre une barre livrées / total ; un test vérifie 45 / 49 → proportion exacte.
- [x] Un nom d'objectif non publié s'affiche « nom non publié ».
- [x] La page d'un objectif contient en-tête, fiches à faire, fiches livrées dans l'ordre de la maquette.
- [x] Aucune entrée du menu « ⋯ » ne simule un geste que la méthode n'offre pas.

## Comment vérifier

- Preuve avant / après (objectifs) : [avant](../../docs/pr-evidence/20261126170000107/objectifs-before.jpg) → [après](../../docs/pr-evidence/20261126170000107/objectifs-after.jpg)
- Preuve avant / après (un-objectif) : [avant](../../docs/pr-evidence/20261126170000107/un-objectif-before.jpg) → [après](../../docs/pr-evidence/20261126170000107/un-objectif-after.jpg)
- Revue adverse : ezk-reviewer GO (aucun geste absent simulé)

```bash
pnpm --dir products/cop1/packages/web test -- ObjectifsView.test.tsx
```

- vue Objectifs : http://localhost:5273 → menu Objectifs : retirer « en cours », ouvrir « board ».

## Hors périmètre

- Réordonner le plan ou créer un objectif depuis l'écran.
- Les dépendances entre objectifs (différées par un panel).
- Un contrat nouveau : l'écran lit le contrat existant.
