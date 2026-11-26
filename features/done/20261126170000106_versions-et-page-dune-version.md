---
id: "20261126170000106"
title: "Les pages Versions et d'une version suivent la maquette, avec le numéro proposé à versionner"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: shipped
blocked:
depends: []
pr: "local (2748fa71)"
evidence: before-after
created: 2026-11-26
---

# 20261126170000106 — Les pages Versions et d'une version suivent la maquette, avec le choix du numéro à versionner

**En clair.** La page Versions n'offre pas de liste pour choisir le numéro de la prochaine version, et la page d'une version n'a pas la forme de la maquette. On ajoute la liste de numéros à côté de « Versionner » et les objectifs en pastilles. La page d'une version devient un en-tête, des objectifs en cartes, « Qui l'a livrée » et une liste courte.

**Si tu arrives frais.** Versionner, c'est poser l'étiquette git d'une version dont tout est livré. C'est un geste irréversible du PO, jamais automatique. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/08-versions-app.png` / `08-versions-maquette.png` et `17-une-version-app.png` / `17-une-version-maquette.png`.

- `VersionsView.tsx` montre « Versionner » sans choix du numéro. La maquette propose une liste (v0.23.0, v0.22.1, v1.0.0) à côté du bouton.
- La table des versions étiquetées n'affiche pas les objectifs en pastilles.
- La page d'une version est trop longue : toute la liste des fiches s'étale.

## Proposition

**Page Versions** (donnée : `ezk board show --json`) :

1. Bandeau « À versionner » : depuis quelle version, nombre de fiches livrées, ventilation « avec un numéro / sans ».
2. **Prochaine version** : une liste de numéros proposés (patch, mineur, majeur) à côté du bouton « Versionner ». Les numéros viennent de la méthode ; si elle n'en publie pas, la liste est absente et le bouton garde le numéro courant. La commande reste en infobulle.
3. **Versions étiquetées** : version, nom, livrées, **objectifs en pastilles**, date relative.

**Page d'une version** :

1. **En-tête** : état (à clore, étiquetée), cycle de vie, contenu, nom, date d'étiquette (« pas encore »).
2. **Objectifs de cette version** en cartes : fiches ici, livrées au total.
3. **Qui l'a livrée** : lancements et sessions ; « non publié » au-delà des cinq derniers sprints.
4. **Fiches livrées** : liste courte, « Afficher plus » centré, compteur à droite ; chaque fiche s'ouvre.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [x] Le numéro que la méthode propose s'affiche à côté de « Versionner » quand elle le publie. (Amendé le 2026-11-26 en revue : la méthode publie un seul numéro, `numeroPropose` ; la liste de choix est en Hors périmètre.)
- [x] Sans numéros publiés, la liste est absente et rien n'est inventé.
- [x] La table des versions étiquetées montre les objectifs en pastilles.
- [x] La page d'une version contient les quatre blocs de la maquette dans l'ordre.
- [x] La liste de fiches d'une version affiche une page courte puis « Afficher plus » avec compteur.
- [x] Le bouton « Versionner » reste un geste confirmé par le PO ; un test vérifie qu'un clic seul ne pose pas l'étiquette.

## Comment vérifier

- Preuve avant / après (versions) : [avant](../../docs/pr-evidence/20261126170000106/versions-before.jpg) → [après](../../docs/pr-evidence/20261126170000106/versions-after.jpg)
- Preuve avant / après (une-version) : [avant](../../docs/pr-evidence/20261126170000106/une-version-before.jpg) → [après](../../docs/pr-evidence/20261126170000106/une-version-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (critère du numéro amendé, carte vide masquée)

```bash
pnpm --dir products/cop1/packages/web test -- VersionsView.test.tsx
```

- vue Versions : http://localhost:5273 → menu Versions : choisir un numéro, ouvrir v0.23.0.

## Hors périmètre

- La liste de choix de numéros (correctif, mineure, majeure) à côté de « Versionner ». Le contrat `ezk board show --json` ne publie qu'un seul numéro proposé. L'écran n'invente pas les autres (ADR-086). La liste viendra quand la méthode publiera ses candidats. Décision de revue du 2026-11-26.
- Pousser l'étiquette : geste du PO, hors écran.
- Changer la façon dont la méthode calcule les numéros.
- La gate de release (fiche Configuration).
