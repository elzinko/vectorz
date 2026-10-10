---
id: testing/confinement-contract-at-boundary
kind: disposition
level: SHOULD
title: Une fonction de confinement est testée à sa frontière RÉELLE, pas seulement en pur
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **En clair.** Une fonction de **sécurité ou de confinement** (résolution de chemin, accès,
  permission) doit être testée au **point d'entrée réel** qui l'invoque (le serveur, l'adaptateur),
  pas seulement sur la fonction pure. Et sa **doc doit citer la frontière qu'elle garantit** — ni
  plus, ni moins.
- **Symptôme fondateur** (rétro du 2026-10-10) : `resolveFichePath` annonçait « sous la racine…
  jamais ailleurs » mais confinait au **projet**, pas au dossier `features/`. La vraie frontière
  vivait côté serveur, **non testée**. La doc promettait plus que le code ne tenait ; seule la revue
  adverse l'a vu.
- **La règle.** Toute PR qui touche une fonction de confinement joint **≥ 3 tests négatifs au point
  d'entrée réel** (`../`, chemin absolu, lien symbolique hors dossier) — pas seulement sur la
  fonction. Le commentaire de la fonction **nomme sa frontière réelle**, et les tests la vérifient.
- **Mesure (removability).** Sur les 3 prochains sprints, 0 écart entre la doc d'une fonction de
  confinement et son comportement relevé en revue. Retrait quand l'écart ne réapparaît plus.

Origine : rétro du 2026-10-10, capture
`docs/captures/2026-10-10-retro-vue-process-worktree-silences.md` (proposition 7, lentille QA, GARDER
par le juge). Appliquée par `ezk-reviewer` et `ezk-dev`. Précise — sans doublonner —
`development/adversarial-review-before-merge` (générale).
