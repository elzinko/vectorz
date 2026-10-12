---
id: "20261012231419185"
title: "Board : la coque + la vue d'ensemble (métriques, entonnoir, versions dans le process)"
type: feature
priority: P1
product: cop1
milestone: board
version: v0.17.0
labels: [dashboard, board, ux, vue-ensemble]
status: idea
blocked:
pr:
evidence: before-after
created: 2026-10-13
---

# 20261012231419185 — Board : la coque + la vue d'ensemble

**En clair.** C'est le squelette du board unifié : l'en-tête, la navigation par projet, le sélecteur de projet, et la première page. La vue d'ensemble montre, pour un projet, les métriques « depuis le début », l'entonnoir du pipeline, et un tableau « Versions dans le process » (une ligne par version, la version en run surlignée, un bouton « Lancer » ou « Voir le run »).

**Si tu arrives frais.** Le board est la webapp cop1 qui remplace les trois tableaux de bord éparpillés. Une *version* est un lot de fiches ; un *run* est une session de la méthode.

## Contexte / Problème

Tranche de la refonte dashboard. C'est la fondation : les autres vues se branchent sur cette coque.

## Proposition

Périmètre de cette tranche :
- en-tête (marque, sélecteur de projet par modale, recherche, bouton ⚙ vers la config outil) ;
- navigation de gauche (par projet) + section « méthode » (process) ;
- vue d'ensemble : métriques « depuis le début », entonnoir, tableau des versions avec ligne « en run » surlignée et boutons « Lancer » / « Voir le run ».

Hors périmètre : le contenu des autres onglets (chacun sa tranche).

## Critères d'acceptation

> À affiner au grooming.

- [ ] L'écran réel reprend la coque et la vue d'ensemble de la maquette.
- [ ] Le tableau des versions surligne la version en run et offre le bon bouton selon l'état.
- [ ] Une seule vérité par projet (pas de métrique contradictoire).

## Comment vérifier

> À définir au grooming : comparaison écran ↔ maquette ; `pnpm --dir products/cop1/packages/web build`.

## Notes / décisions

- Design de référence : [Unifier les tableaux de bord](20261007135620590_refondre-vue-supervision-moniteur-lisible.md).
- Maquette : [docs/maquettes/board-ezk-dashboard.html](../docs/maquettes/board-ezk-dashboard.html).
- Décision : [ADR-039](../docs/adr/ADR-039-board-unifie-run-moments-fiches-deux-portees-config.md).
