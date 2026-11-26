---
id: "20261126170000112"
title: "La cloche d'alertes de l'en-tête montre une alerte par élément, chacune fermable"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: ready
blocked:
depends: ["20261114131612944"]
pr:
evidence: before-after
created: 2026-11-26
---

# 20261126170000112 — La cloche d'alertes de l'en-tête montre une alerte par élément, chacune fermable

**En clair.** L'en-tête n'a pas de cloche. On l'ajoute avec une alerte par élément et un panneau déroulant. Tant que la méthode ne publie pas les alertes, la cloche affiche « non publié ».

**Si tu arrives frais.** Une alerte est un élément qui demande ta décision : fiche bloquée, idée à groomer, rétro due, version à versionner. La méthode doit publier cette liste ; l'écran ne la calcule pas. La maquette est la référence d'écran choisie par le PO. Mission control, l'écran de cop1, affiche ce que la méthode publie et n'invente aucune donnée (ADR-086). Un champ non publié s'affiche « non publié » ou « non mesuré », jamais « 0 ».

## Contexte / Problème

Captures : `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz--claude-worktrees-ezk-product-build-autonomy-060fc6/0ef4b5dc-2e5b-4cec-82b4-3558acb565ab/scratchpad/comparaison/01-projets-maquette.png` (la cloche est en haut à droite de la maquette).

- Aujourd'hui l'en-tête n'a aucune alerte.
- La maquette montre un compteur, un panneau, et pour chaque alerte un type, un projet, un titre, un texte et une croix.
- La donnée vient de [`ezk now --json` publie les alertes de la cloche](20261114131612944_ezk-now-json-alertes-de-la-cloche.md), pas encore livrée.

## Proposition

1. **Cloche** à droite de l'en-tête avec compteur.
2. **Panneau déroulant** : titre « Alertes », « une par élément », « i ».
3. **Une alerte par élément** : type (fiche bloquée, idée à groomer, rétro due, version à poser, question de session, sprint sans rétro), projet, titre, texte.
4. **Fermable** : chaque alerte a une croix ; la fermeture est mémorisée (comment, voir la fiche du contrat).
5. **Tant que le contrat manque** : la cloche affiche « non publié » et aucun compteur.

Règles d'écran à respecter : boutons en mots avec la commande en infobulle, « i » au survol plutôt que du texte long, un seul « i » par ligne de réglage, « Afficher plus » centré avec le compteur à droite, pas de bouton sans besoin avéré, étapes « idée · prête · en sprint · en revue · livrée », « Objectifs » et « lancement » à l'écran.

## Critères d'acceptation

- [ ] La cloche affiche un compteur égal au nombre d'alertes publiées.
- [ ] Chaque alerte est une ligne avec son type, son titre et son texte.
- [ ] Une alerte fermée disparaît et ne revient pas après rechargement.
- [ ] Sans contrat publié, la cloche affiche « non publié » et aucun chiffre.
- [ ] Aucune alerte n'est calculée côté écran.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web test -- Alerts.test.tsx
```

- vue Projets : http://localhost:5273 → menu Projets : cliquer la cloche, fermer une alerte.

## Hors périmètre

- Écrire le contrat `ezk now --json` : c'est la fiche dont celle-ci dépend.
- Notifications hors de l'écran.
- Alertes par e-mail.
