---
id: ux/no-layout-shift
kind: disposition
level: SHOULD
title: Réserver l'espace des éléments optionnels
enforcements:
  - type: prompt
---

Un élément d'interface qui apparaît ou disparaît **de lui-même** — détection,
chargement, état réseau, polling — ne doit pas changer la taille de son parent.
On réserve sa place à l'avance : le reste ne bouge pas au moment où l'info s'affiche.

Techniques : `min-height` / `min-width` sur le conteneur qui accueille du contenu
variable ; `visibility: hidden` plutôt que `display: none` (garde la place) ;
dimensions explicites (`width`/`height` ou `aspect-ratio`) sur images et médias ;
squelette de même gabarit pendant un chargement.

**Exception encadrée.** Si l'apparition suit une **action explicite de l'utilisateur**
— déplier un accordéon, « voir plus », ajouter une ligne — pousser le contenu est
permis : le mouvement est attendu, l'utilisateur vient d'agir. Le critère est le
déclencheur : déclenché tout seul → on réserve la place ; déclenché par un clic → on
peut pousser.

Enforcement `prompt` : le modèle applique la règle en concevant l'UI. À promouvoir en
`agent-check` par l'agent `ezk-ux` quand il existera (ADR-0026) — suivi par la fiche
`20260829140259165`.
