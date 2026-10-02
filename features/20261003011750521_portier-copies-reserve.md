---
id: "20261003011750521"
title: "Le portier ezk-sprint n'alerte plus sur les copies de réserve propres ni les sessions fusionnées"
type: bug
priority: P2
product: mega-city
milestone:
version: V0.6
labels: [sprint, portier, worktree]
status: idea
pr:
evidence: none # script de contrôle, pas d'écran
created: 2026-10-03
---

# 20261003011750521 — Le portier ezk-sprint n'alerte plus sur les copies de réserve propres

**En clair.** `ezk-sprint check` lève `ALERT` dès qu'il voit d'autres copies de travail (worktrees)
du dépôt. Or l'app Claude garde des copies **de réserve** : propres, en HEAD détaché, sans travail en
cours. Résultat : un choix humain obligatoire pour rien. On veut que le portier ne signale que les
copies qui portent vraiment un travail en vol.

**Si tu arrives frais.** Le portier est le contrôle lancé à l'ouverture d'un sprint. Une copie de
réserve est recyclée par l'app pour une nouvelle session ; il ne faut jamais la supprimer à la main.

## Contexte / Problème

- muti, 2026-10-02 (PR muti #271) : `ALERT points=1,2`, `sibling_worktrees=4` : le checkout
  principal, 2 copies de réserve (HEAD détaché, propres) et 1 session déjà fusionnée (#266) et
  archivée (#269). Aucune ne touchait au sujet du sprint ; le PO a dû passer outre.

## Proposition

Le point « copies voisines » ignore : le checkout principal sur la branche par défaut ; une copie
**propre** en HEAD détaché ; une copie dont la branche est déjà fusionnée (squash compris, cf.
[[20261002155911250]]) et sans modification locale. Il signale le reste, avec la raison.

## Critères d'acceptation

- [ ] Sur le cas observé (4 copies ci-dessus), verdict `CLEAR` pour ce point.
- [ ] Une copie avec des modifications non commitées, ou une branche non fusionnée, lève toujours
      `ALERT`.
- [ ] `test-check-gate.sh` couvre les trois cas ignorés et les deux cas signalés.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-sprint/scripts/test-check-gate.sh
```

## Notes / décisions

- 2026-10-03 : née de la rétro muti docs/captures/2026-10-03-retro-fps-auto-adaptatif.md (dépôt muti), retenue (choix délégué par le PO au pilote).
- Voisines : SPRINT.md commité [[20261003011750433]] ; portier d'archive et squash [[20261002155911250]].
