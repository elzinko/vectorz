---
id: "20261126170000104"
title: "Les pages Sprints et d'un sprint suivent la maquette"
type: feature
priority: P2
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

# 20261126170000104 — Les pages Sprints et d'un sprint suivent la maquette

**En clair.** La liste des Sprints montre des noms bruts sans filtre ni badge, et la page d'un sprint n'a pas les blocs de la maquette. On refait la liste, avec le but du sprint, un badge, et la mention rétro. La page d'un sprint reçoit ses cinq blocs.

**Si tu arrives frais.** Un sprint est un lot de fiches construit puis scellé par un compte rendu. La maquette titre « Sprint N — but » quand le but est publié. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/06-sprints-app.png` / `06-sprints-maquette.png` (liste) et `15-un-sprint-app.png` / `15-un-sprint-maquette.png` (page).

- La liste actuelle (`SprintsView.tsx`) n'a ni filtre ni recherche, ni lien vers la session, ni indication de rétro.
- La page d'un sprint n'existe pas sous la forme de la maquette : en-tête d'une ligne, puis Fiches livrées, Session, Compte rendu, Dans le journal, Rétro.

## Proposition

**Liste** (donnée : comptes rendus de sprint publiés par la méthode, `ezk board show --json`) :

1. Ligne : « Sprint N — but » si le but est publié, sinon le nom ; date, durée, fiches, « session main » en lien ; badge ok ou attention ; « rétro » ou « sans rétro ».
2. Filtres : type, état (tous, ok, attention), période (aujourd'hui, 7 jours, tout) ; recherche.
3. « Afficher plus » centré, compteur « 55 sprints » à droite.

**Page d'un sprint** :

1. **En-tête d'une ligne** : dates, durée, taille du lot, incrément, session, blocages, jetons (« non mesuré » si absent), objectif.
2. **Fiches livrées** : titre, priorité, objectif, étape, intégration.
3. **Session** : lien vers la page de la session ; « récit pas encore écrit » si absent.
4. **Compte rendu** : lot scellé, durée, jetons, retouches de PR, étapes, chemin du fichier (le bouton « Ouvrir » est retiré en revue, voir Hors périmètre).
5. **Dans le journal** : lignes horodatées (lancement, fin de sprint, reprise, fin du lancement).
6. **Rétro** : état, « Précédente » ; le bouton « Lancer une rétro » ne figure que si un geste existe côté méthode.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

- [x] La liste affiche « Sprint N — but » quand le but est publié et le nom sinon.
- [x] Les filtres type, état, période et la recherche réduisent la liste ; « Afficher plus » ajoute des lignes avec un compteur à droite.
- [x] Chaque ligne indique badge ok/attention, rétro ou sans rétro, et un lien vers sa session.
- [x] La page d'un sprint contient les six blocs dans l'ordre de la maquette.
- [x] Une durée ou des jetons non publiés s'affichent « non mesuré », jamais « 0 ».
- [x] Le bouton « Lancer une rétro » est absent tant que la méthode n'offre pas ce geste.
- [x] Un test couvre un sprint sans but, sans session et sans rétro.

## Comment vérifier

- Preuve avant / après (sprints) : [avant](../docs/pr-evidence/20261126170000104/sprints-before.jpg) → [après](../docs/pr-evidence/20261126170000104/sprints-after.jpg)
- Preuve avant / après (un-sprint) : [avant](../docs/pr-evidence/20261126170000104/un-sprint-before.jpg) → [après](../docs/pr-evidence/20261126170000104/un-sprint-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (lien de session branché, bouton Ouvrir mort retiré)

```bash
pnpm --dir products/cop1/packages/web test -- SprintsView.test.tsx
```

- vue Sprints : http://localhost:5273 → menu Sprints : ouvrir « Sprint 32 », vérifier les six blocs.

## Hors périmètre

- Le bouton « Ouvrir » du compte rendu. Mission control n'a pas encore de page qui lit un fichier Markdown (la page « Un fichier » de la maquette n'est pas portée). Un bouton sans cible serait du code mort. Décision de revue du 2026-11-26. Le lien vers la session ouvre la page Sessions.
- Écrire les comptes rendus ou publier un but : c'est la méthode qui publie.
- Lancer une rétro depuis l'écran (voir fiche des rétros).
- Les jetons réels : tant que non mesurés, « non mesuré ».
