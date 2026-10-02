---
id: development/acceptance-criteria-before-merge
kind: disposition
level: SHOULD
title: Un critère d'acceptation se coche dans la PR, avant le merge
enforcements:
  - type: agent-check
    agent: ezk-pm
---

- **En clair.** Depuis que le ship voyage dans la PR (ADR-0049), la fiche part en `done/`
  **avant** le merge. Un critère qui ne se prouve qu'au merge ne peut donc jamais être coché :
  la fiche livrée garde une case vide alors que tout est fait. On range ces preuves-là à part.
- **Chaque case des « Critères d'acceptation »** décrit un état observable **sur la branche,
  avant le merge** : un test vert, un fichier présent, une commande qui répond. Elle se coche
  dans la PR, au plus tard au commit `ship`.
- **Ce qui ne se prouve qu'après** (un merge fait depuis l'UI, un effet sur les sessions ou les
  lots suivants) va dans le bloc **« Mesure de suivi »** du gabarit de fiche
  (`skills/ezk-backlog/templates/feature-template.md`). Ce bloc ne se coche pas à la PR : on le
  relève après la livraison.
- **Au grooming** (`ezk-backlog groom` / gate `ready`), un critère formulé « se prouve au
  merge » est déplacé en « Mesure de suivi » avant de passer la fiche `ready`.
- Origine : rétro du 2026-10-03 (capture `docs/captures/2026-10-03-retro-session-2026-10-02.md`).
  La fiche « La fiche d'une story arrive en done avec son merge » (PR #333) est livrée avec un
  critère « mergée depuis l'UI » resté vide, alors que le merge l'a prouvé.
- Measure (removability) : sur les 5 prochaines fiches livrées, 0 critère laissé vide au motif
  « se prouve au merge ».
