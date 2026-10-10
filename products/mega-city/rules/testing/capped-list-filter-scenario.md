---
id: testing/capped-list-filter-scenario
kind: disposition
level: SHOULD
title: Une liste plafonnée porte un scénario « élément au-delà du cap retrouvé par filtre »
enforcements:
  - type: agent-check
    agent: ezk-qa
---

- **En clair.** Dès qu'une vue **plafonne** ou **tronque** une liste (« 20 dernières », pagination,
  « voir plus »), un scénario de test doit prouver qu'un **élément au-delà du cap** reste
  **retrouvable par filtre ou recherche**. Sinon, filtrer/chercher sur le sous-ensemble tronqué
  renvoie « 0 » à tort, en silence.
- **Symptôme fondateur** (rétro du 2026-10-10) : la vue process plafonnait la colonne « Livrée » à 20.
  Chercher une vieille livrée renvoyait « 0 » alors qu'elle existait. Ni les critères de la fiche ni
  les tests ne croisaient **plafond × filtre** — seule la revue adverse l'a vu.
- **La règle.** Toute fiche qui introduit une limite d'affichage porte, dans ses critères et ses
  tests, le cas « **cap × filtre/recherche** » : un élément hors de la fenêtre affichée est retrouvé
  quand on le filtre. La donnée n'est pas tronquée au point de masquer la recherche ; c'est
  l'affichage qui l'est.
- **Mesure (removability).** 100 % des fiches introduisant un cap citent ce scénario ; le relecteur
  marque **NO-GO** s'il manque. Sur les 3 prochains sprints, 0 défaut de cette classe trouvé
  **uniquement** en revue. Retrait quand la classe ne réapparaît plus.

Origine : rétro du 2026-10-10, capture
`docs/captures/2026-10-10-retro-vue-process-worktree-silences.md` (proposition 6, lentille QA, GARDER
par le juge). L'étape BDD d'`ezk-sprint` pointe vers cette règle, sans la recopier.
