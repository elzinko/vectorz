---
id: "20261012231419211"
title: "Board : l'activité par run → moments → fiches, et la modale fiche"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, supervision, runs]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-10-13
---

# 20261012231419211 — Board : activité par run → moments → fiches

**En clair.** C'est le cœur du modèle. Les listes d'activité (dans Cadrage et dans Développement) affichent des **runs**, nommés par leur vraie session, avec des pastilles d'étapes réelles — jamais de texte inventé. Cliquer un run montre ses **moments** (grooming, sprint, rétro…) ; chaque moment montre les **fiches** traitées et leur transition de statut. Cliquer une fiche ouvre une grande modale, avec un lien vers sa page complète.

**Si tu arrives frais.** Un *run* est une session de la méthode ; il contient des *moments* (étapes) ; chaque moment traite des *fiches*. On regarde un run par lentille : côté cadrage dans Cadrage, côté sprints dans Développement.

## Contexte / Problème

Tranche de la refonte dashboard. Aujourd'hui les listes mélangent des gates et du texte résumé inventé. On passe à des **affichages déterministes** tirés du journal.

## Proposition

Périmètre :
- tables d'activité « runs » (une par lentille : cadrage, dev), déterministes (nom de run + moments réels + temps compact) ;
- détail d'un run : la liste de ses moments, chacun avec ses fiches et leur transition ;
- modale fiche : résumé + lien vers la page de la fiche.

## Critères d'acceptation

> À affiner au grooming.

- [ ] Chaque ligne d'activité porte un **nom de run réel** et des **pastilles de moments réels** — aucun texte inventé.
- [ ] On descend run → moments → fiches ; chaque fiche montre sa transition de statut.
- [ ] Un clic sur une fiche ouvre la modale avec lien vers sa page.

## Comment vérifier

> À définir au grooming : comparaison écran ↔ maquette ; parcours filmé run → moment → fiche.

## Notes / décisions

- **Dépend du socle** : le journal doit enregistrer les moments par run et par fiche. Socle **livré** : [catalogue des moments](done/20261004101755756_contrat-bus-catalogue-moments.md).
- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-039](../docs/adr/ADR-039-board-unifie-run-moments-fiches-deux-portees-config.md).
