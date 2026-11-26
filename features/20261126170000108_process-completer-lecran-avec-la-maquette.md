---
id: "20261126170000108"
title: "L'écran Process montre « En clair », les fiches par statut, les étapes, qui appelle qui, livrer une version et l'équipe"
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

# 20261126170000108 — L'écran Process montre « En clair », les fiches par statut, les étapes, qui appelle qui, livrer une version et l'équipe

**En clair.** L'écran Process a déjà son schéma en ligne mais pas le reste de la maquette. On y ajoute le bloc « En clair », cinq tuiles de fiches par statut, les étapes de chaque compétence, qui appelle qui, livrer une version et l'équipe. Le kanban sous le schéma disparaît.

**Si tu arrives frais.** Une compétence est un skill de la méthode (backlog, sprint, rétro…). Une étape est une case de son déroulé. Le schéma en ligne est déjà livré. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/09-process-app.png` / `09-process-maquette.png`.

- `ProcessView.tsx` montre le schéma, puis un kanban des fiches. Il manque tout le reste de la maquette.
- Donnée : `ezk process show --json` (contrat `board-process`). Ce qu'il ne publie pas, l'écran l'écrit « non publié ».

## Proposition

Blocs dans l'ordre de la maquette :

1. **En clair** : phrase fixe courte avec « i » (fiche, sprint, loi).
2. **Mes fiches par statut** : cinq tuiles idée · prête · en sprint · en revue · livrée avec leur compteur (`ezk board show --json`). Elles remplacent le kanban.
3. **Le schéma** : inchangé.
4. **Étapes de chaque compétence** : une rangée par skill ; chaque étape ouvre un détail (jouée par, lance, moment émis, effet sur la fiche, règles appliquées, dernier passage). « Dernier passage » dit « non tracé » tant que le journal ne l'écrit pas.
5. **Qui appelle qui** : liens entre compétences ; agents dans plusieurs étapes ; commandes partagées. Une commande ne s'affiche pas comme bouton.
6. **Livrer une version** : cinq étapes, avec « Réglé dans Configuration → ».
7. **Équipe** : agent, rôle, niveau (performant, standard, économe), réglé par.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [ ] Les cinq tuiles de statut affichent des compteurs issus du contrat ; le kanban sous le schéma n'existe plus.
- [ ] Le bloc « En clair » tient en quelques phrases et un « i ».
- [ ] Chaque compétence a sa rangée d'étapes ; une étape ouvre son détail.
- [ ] « Qui appelle qui » montre compétences, agents et commandes dans les trois tableaux de la maquette.
- [ ] « Livrer une version » liste cinq étapes et renvoie à Configuration.
- [ ] « Équipe » montre un niveau en français par agent ; une donnée manquante s'écrit « non publié ».

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web test -- ProcessView.test.tsx
```

- vue Process : http://localhost:5273 → menu Process : lire les sept blocs, ouvrir l'étape « Revue adverse ».

## Hors périmètre

- Rendre les étapes configurables (autre fiche).
- Écrire le journal des appels d'agent (non tracés aujourd'hui).
- Le zoom du schéma, déjà livré.
