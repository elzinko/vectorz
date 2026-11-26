---
id: "20261126170000102"
title: "Les pages Projets et Vue d'ensemble montrent une carte par projet, comme la maquette"
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

# 20261126170000102 — Les pages Projets et Vue d'ensemble montrent une carte par projet, comme la maquette

**En clair.** La page Projets et la Vue d'ensemble n'ont ni les compteurs depuis le début, ni les trois tuiles de fiches, ni les trois vignettes Dernier objectif, Dernier sprint, Dernière rétro. On construit cette carte. La Vue d'ensemble y ajoute « Objectifs en cours », et on retire l'Entonnoir et la table des versions.

**Si tu arrives frais.** « Projets » est l'accueil de tous les projets. « Vue d'ensemble » est la page d'un seul projet. Les deux montrent la même carte de projet. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/01-projets-app.png` / `01-projets-maquette.png` et `03-vue-ensemble-app.png` / `03-vue-ensemble-maquette.png`.

- Aujourd'hui `FleetView.tsx` et `OverviewView.tsx` montrent un entonnoir, une table « Versions dans le process » et des sessions. La maquette ne montre rien de cela.
- La maquette pose une carte par projet : nom, « i », version, puis trois blocs.
- Pour muti, plusieurs champs ne sont pas publiés : la maquette les écrit « non publié » au lieu de zéros.

## Proposition

**Carte de projet** (identique sur Projets et sur Vue d'ensemble) :

1. **En-tête** : nom du projet, « i », pastille de la dernière version étiquetée.
2. **Depuis le début** : livrées, sprints, rétros. Sources : `ezk board show --json` (livrées), comptes rendus de sprint publiés (sprints), `ezk retro captures --json` (rétros, **sans contrat versionné** aujourd'hui : « non publié » si absent). Un compteur non publié affiche « — », jamais « 0 ».
3. **Trois tuiles** depuis la dernière version : fiches prêtes, bloquées, livrées. Source : `ezk board show --json`.
4. **Trois vignettes** : Dernier objectif (nom, date, nombre de fiches, état « atteint »), Dernier sprint (« Sprint N — but » si publié, sinon le nom ; date, durée, fiches, sessions ; badge ok/attention), Dernière rétro (titre, date, propositions, décisions du PO). Sans donnée : « non publié » et la raison en un mot (« muti n'écrit pas de comptes rendus »).
5. **Vue d'ensemble seulement** : bloc « Objectifs en cours » (nom, livrées / total, « en cours ») et lien « Tous les objectifs (N) → ».
6. **Retirés** : l'Entonnoir, la table « Versions dans le process », et toute session sur ces deux pages.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

- [x] La page Projets montre une carte par projet avec En-tête, Depuis le début, trois tuiles et trois vignettes.
- [x] La Vue d'ensemble montre la même carte pour le projet choisi, puis « Objectifs en cours » avec un lien vers la page Objectifs.
- [x] L'Entonnoir et la table « Versions dans le process » ne figurent plus ; aucune session n'apparaît sur ces pages.
- [x] Un champ que la méthode ne publie pas affiche « non publié » ou « — » ; un test avec un projet sans comptes rendus vérifie qu'aucun « 0 » n'est inventé.
- [x] Les trois tuiles comptent depuis la dernière version étiquetée, et le libellé nomme cette version.
- [x] Les tests existants de l'Entonnoir sont supprimés avec lui (pas de code mort).

## Comment vérifier

- Preuve avant / après (projets) : [avant](../docs/pr-evidence/20261126170000102/projets-before.jpg) → [après](../docs/pr-evidence/20261126170000102/projets-after.jpg)
- Preuve avant / après (vue-ensemble) : [avant](../docs/pr-evidence/20261126170000102/vue-ensemble-before.jpg) → [après](../docs/pr-evidence/20261126170000102/vue-ensemble-after.jpg)
- Revue adverse : ezk-reviewer GO après correctif (faux zéro sprints/rétros, titre du dernier objectif)

```bash
pnpm --dir products/cop1/packages/web test -- FleetView.test.tsx
pnpm --dir products/cop1/packages/web test -- OverviewView.test.tsx
```

- vue Projets : http://localhost:5273 → menu Projets puis vue Vue d'ensemble : http://localhost:5273 → menu Vue d'ensemble : comparer avec la maquette.

## Hors périmètre

- Le contrat des rétros (fiche des rétros) : ici la vignette lit ce qui existe et dit « non publié » sinon.
- La cloche, les pages Objectifs, Sprints et Rétros elles-mêmes.
- Toute action nouvelle sur la carte.
