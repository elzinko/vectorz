---
id: "20261126170000111"
title: "La page Recettes est une liste compacte avec recherche, filtres et état en français"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: shipped
blocked:
depends: []
pr: "local (0010afbe)"
evidence: before-after
created: 2026-11-26
---

# 20261126170000111 — La page Recettes est une liste compacte avec recherche, filtres et état en français

**En clair.** La page Recettes est trop longue et n'a ni recherche ni filtre. On adopte la liste compacte de la maquette. L'état se lit prête ou brouillon, avec « Ajoutée » ou « Incomplète ».

**Si tu arrives frais.** Une recette est un savoir-faire réutilisable décrit dans le catalogue de la méthode. « Ajoutée » veut dire que le projet l'a reprise. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/12-recettes-app.png` / `12-recettes-maquette.png`.

- `RecipesView.tsx` affiche de longues cartes sans recherche.
- Donnée : `ezk recipes --json` (contrat `recipes`).
- La maquette montre un bouton « Ajouter » sur les recettes non ajoutées. **Aucune action d'ajout n'est connue côté méthode** : ne pas l'inventer.

## Proposition

1. Titre « Recettes disponibles », compteur « 16 · 3 ajoutées », « i ».
2. Recherche ; filtres toutes, prêtes, ajoutées.
3. Ligne : titre, résumé tronqué, état en français (prête, brouillon), « Ajoutée » ou « Incomplète ».
4. « Afficher plus » centré avec compteur.
5. **Bouton « Ajouter »** : présent seulement si une action existe déjà côté méthode. Sinon absent ; la fiche le dit et ne l'invente pas.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [x] La liste est compacte et affiche titre, résumé tronqué, état et marque.
- [x] Recherche et filtres toutes, prêtes, ajoutées fonctionnent.
- [x] L'état s'écrit prête ou brouillon, jamais en anglais.
- [x] « Afficher plus » ajoute des lignes ; le compteur est à droite.
- [x] Aucun bouton « Ajouter » n'apparaît tant que la méthode n'offre pas le geste.

## Comment vérifier

- Preuve avant / après (recettes) : [avant](../../docs/pr-evidence/20261126170000111/recettes-before.jpg) → [après](../../docs/pr-evidence/20261126170000111/recettes-after.jpg)
- Revue adverse : ezk-reviewer GO (bouton Ajouter absent faute de geste ; fiches 114 et 115 créées pour lui)

```bash
pnpm --dir products/cop1/packages/web test -- RecipesView.test.tsx
```

- vue Recettes : http://localhost:5273 → menu Recettes : filtrer sur « ajoutées ».

## Hors périmètre

- Créer ou éditer une recette depuis l'écran.
- Un geste « Ajouter » nouveau.
- Le contrat `recipes`, inchangé.
