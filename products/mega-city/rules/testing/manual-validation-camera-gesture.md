---
id: testing/manual-validation-camera-gesture
kind: disposition
level: SHOULD
title: « Validé » ≠ « tests verts » pour une fiche caméra ou geste
enforcements:
  - type: agent-check
    agent: ezk-qa
---

> Règle **à éprouver** (SHOULD) : validée en rétro, à confirmer par l'usage.

- **Des tests verts ne valent pas validation** quand la feature dépend d'une entrée caméra ou d'un
  geste. Les tests mockent MediaPipe : ils prouvent que le code tourne, pas que le geste réel est
  reconnu.
- **Privilégier une validation automatisable** : rejeu d'une vidéo décrite et exploitable (voir la
  fiche « non-régression caméra vidéo rejouée ») ou un mock à données dynamiques. Le but est de
  sortir de « ça compile » sans dépendre d'un humain à chaque fois.
- **`validation: pending-manual` seulement si vraiment non-automatisable.** C'est le dernier
  recours, pas le défaut.
- **Pas de merge sur chemin actif** (code réellement emprunté en prod) sans un `validated-manual`
  daté. Un POC caméra « vert » mais non validé gestuellement ne part pas sur le chemin actif.
- **Mesurable :** 0 fiche caméra mergée sur chemin actif en `pending-manual` sans validation datée.
- À relier (cross-repo muti) : non-régression visuelle/geste d'un POC caméra — fiches muti
  `20260826143439888` et `20260901170100000`.
- Origine : rétrospective du 2026-09-05 (symptôme 4). Un POC caméra passait « vert » sans validation
  gestuelle réelle. Enforcement niveau 1 : l'agent `ezk-qa` (validation BDD/E2E) lit cette règle.
