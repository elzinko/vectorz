---
id: "20261003201035168"
title: "Le portier d'ezk-archive juge les fiches livrées et les ADR contre origin/main"
type: bug
priority: P2
product: mega-city
milestone:
version:
labels: [archive]
status: idea
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-03
---

# 20261003201035168 — Le portier d'ezk-archive juge les fiches livrées et les ADR contre origin/main

**En clair.** À la clôture, le portier dit encore « fiche non livrée » ou « ADR non fusionné » quand on
le lance depuis un worktree en retard, alors que tout est sur `origin/main`. La PR #345 a corrigé ce
défaut pour les branches ; il reste ces deux contrôles.

**Si tu arrives frais.** Le *portier* est `skills/ezk-archive/scripts/check.sh`. Ses points 3 (les
fiches) et 4 (les ADR) lisent les fichiers du worktree courant.

## Contexte / Problème

- 2026-10-02, clôture d'une session muti : une fiche livrée dite « non livrée », un ADR dit « non
  fusionné ». Cas noté dans la fiche
  [Le portier d'ezk-archive compare à origin/main](done/20261002155911250_portier-archive-origin-main-squash.md),
  qui ne le portait pas en critère.

## Proposition

1. Les points 3 et 4 lisent l'état des fiches et des ADR sur `origin/<base>` quand la ref existe, comme
   le point 2 depuis la PR #345.
2. Le portier ne fait toujours aucun `fetch` : le skill le fait avant.

## Critères d'acceptation

- [ ] Sur un dépôt jetable dont le worktree a un commit de retard, une fiche livrée sur `origin/main`
      n'est pas dite « non livrée ».
- [ ] Même cas pour un ADR fusionné sur `origin/main`.
- [ ] Le test « le portier ne fetch jamais » reste vert.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-archive/scripts/test-check-gate.sh
```

## Notes / décisions

- Née de la rétro de l'itération V0.5 (capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`), proposée par la qualité. Retenue par choix
  délégué du PO à l'agent, P2.
