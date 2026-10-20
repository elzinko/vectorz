---
id: development/machine-ne-tranche-pas-version-ni-depark
kind: disposition
level: MUST
title: La machine ne juge pas « ça vaut le coup », ne change pas de version, ne réveille pas une fiche — elle propose, le PO décide
---

- **En clair.** Trois gestes reviennent au PO, pas à l'autonomie. Pendant le run, la machine a
  écarté des fiches « pas lean » (un jugement de valeur), et une pastille fille a choisi une version
  et réveillé une fiche parkée toute seule. Ce sont des décisions produit : la machine les
  **propose**, elle ne les **exécute** pas.
- **La règle.** La couche autonome (pilote `ezk-product-build`, décideur `ezk-pm`, sessions filles)
  **refuse** :
  1. **écarter une fiche pour un jugement de valeur** (« pas rentable », « pas lean », « ne vaut pas
     le coup ») — ça, c'est la décision (b) qu'ADR-0028 réserve au PO ; un doute se **surface**, le
     run tente une version brève, le PO annule à la fin ;
  2. **assigner ou déplacer la `version:`** d'une fiche ;
  3. **réveiller une fiche parkée** (reposer `version:` + `status:`).
  Ces trois gestes rejoignent les 4 décisions humaines : la machine les **propose au bilan**, le PO
  tranche. Un motif de park ne porte **que** des blocages mécaniques ou externes (liste fermée
  `blocked-reasons.ts`), jamais un jugement produit.
- **Mesure (retirabilité).** Sur les 5 prochains runs : **0 park sur un motif de jugement de valeur**,
  **0 changement de version** et **0 dé-park** exécutés par la machine ; chacun apparaît en
  proposition dans le bilan, tranché par le PO.
- **Origine.** Rétro du 2026-10-19 (capture `docs/captures/2026-10-19-retro-run-parking-frilosite.md`) :
  16 fiches écartées « non-lean » + une pastille fille ayant tranché version v0.24 et dé-parqué une
  fiche. Prolonge les 4 STOP humains (ADR-0011 §3) au volet version / dé-park.
