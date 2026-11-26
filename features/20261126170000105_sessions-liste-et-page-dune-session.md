---
id: "20261126170000105"
title: "Les pages Sessions et d'une session suivent la maquette, sans faux zéro"
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

# 20261126170000105 — Les pages Sessions et d'une session suivent la maquette, sans faux zéro

**En clair.** La liste des sessions ne sépare pas ce qui est en cours de ce qui est clos, et la page d'une session ne raconte pas son déroulé. On refait la liste avec ses filtres. La page d'une session montre ses lancements, son fil en clair, ses sprints, son récit en sections et les fiches citées.

**Si tu arrives frais.** Une session est un temps de travail d'une branche. Un lancement est une exécution de la méthode dans la session. L'écran écrit « lancement », jamais « run ». La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/07-sessions-app.png` / `07-sessions-maquette.png` et `16-une-session-app.png` / `16-une-session-maquette.png`.

- Aujourd'hui la liste (`SessionsView.tsx`) ne distingue pas « en cours » et « closes » et n'offre ni période, ni branche, ni recherche.
- Un champ non publié (durée, branche) peut s'afficher « 0 » : la maquette l'écrit « non publiée ».

## Proposition

**Liste** (donnée : `ezk board show --json`, sessions et récits committés) :

1. Bloc « En cours » : titre, depuis quand, branche, sprints, nombre de lancements, dernier terminé.
2. Bloc « Closes » avec compteur ; filtres période (7 jours, tout) et branche (toutes, main, feat/…) ; recherche.
3. Une ligne : « titre · dates · branche · N lancements · N sprints ». Un nombre inconnu s'écrit « non publié », jamais « 0 ».
4. « Afficher plus » centré, compteur « 1 en cours · 29 closes » à droite.

**Page d'une session** :

1. En-tête : dates, durée et branche (« non publiée » si absentes), fiches citées, PR (« aucune, flux local »).
2. **Ses lancements** : liste datée, issue (succès), fins de sprint, questions posées.
3. **Fil en clair** : moments qui comptent, du plus ancien au plus récent.
4. **Ses sprints** : les plus récents d'abord, « N montrés » ; lien vers chaque sprint.
5. **Le récit** rendu en sections (pas de Markdown brut).
6. **Les fiches citées** avec un lien vers chaque fiche.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [ ] La liste sépare « En cours » et « Closes » et applique les filtres période, branche et la recherche.
- [ ] Chaque ligne suit « titre · dates · branche · N lancements · N sprints » ; une donnée absente s'écrit « non publié ».
- [ ] Aucune valeur « 0 » n'est affichée pour un champ que la méthode ne publie pas ; un test le prouve.
- [ ] La page d'une session contient les cinq blocs demandés dans l'ordre.
- [ ] Le récit s'affiche en sections, sans caractères Markdown bruts.
- [ ] Le détail d'un lancement s'ouvre depuis la liste de ses lancements (comportement actuel conservé).

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web test -- SessionsView.test.tsx
```

- vue Sessions : http://localhost:5273 → menu Sessions : ouvrir la session du 2 au 4 nov., relire ses cinq blocs.

## Hors périmètre

- Mesurer des durées ou des jetons que la méthode ne publie pas.
- Les étapes fines des lancements (décision d'architecture en suspens).
- Archiver ou clore une session depuis l'écran.
