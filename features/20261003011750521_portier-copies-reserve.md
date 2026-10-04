---
id: "20261003011750521"
title: "Les portiers d'ezk-sprint et d'ezk-archive laissent tranquilles les copies de réserve propres"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.6
labels: [sprint, archive, portier, worktree]
status: idea
pr:
evidence: none # script de contrôle, pas d'écran
created: 2026-10-03
---

# 20261003011750521 — Les portiers d'ezk-sprint et d'ezk-archive laissent tranquilles les copies de réserve propres

**En clair.** `ezk-sprint check` lève `ALERT` dès qu'il voit d'autres copies de travail (worktrees)
du dépôt. Or l'app Claude garde des copies **de réserve** : propres, en HEAD détaché, sans travail en
cours. Résultat : un choix humain obligatoire pour rien. Le ménage d'`ezk-archive`
(`check.sh --cleanup`) a le même défaut, en pire : il propose de retirer une copie de réserve. On veut
un seul détecteur, partagé par les deux outils, qui laisse ces copies tranquilles.

**Si tu arrives frais.** Le portier est le contrôle lancé à l'ouverture d'un sprint
(`ezk-sprint check`) ; le ménage liste, à la clôture, ce qu'on peut supprimer. Une copie de réserve
est recyclée par l'app pour une nouvelle session ; il ne faut jamais la supprimer à la main.

## Contexte / Problème

- muti, 2026-10-02 (PR muti #271) : `ALERT points=1,2`, `sibling_worktrees=4` : le checkout
  principal, 2 copies de réserve (HEAD détaché, propres) et 1 session déjà fusionnée (#266) et
  archivée (#269). Aucune ne touchait au sujet du sprint ; le PO a dû passer outre.
- muti, 2026-10-03 : `ezk-archive check.sh --cleanup` a proposé `git worktree remove` sur la copie de
  réserve `nice-visvesvaraya-c1c830` (HEAD détaché, propre, inactive 65 h). La retirer à la main
  casse la réserve de l'app.

## Proposition

Un seul détecteur, partagé par `ezk-sprint check` et `ezk-archive check.sh --cleanup`.

- Le point « copies voisines » d'`ezk-sprint check` ignore : le checkout principal sur la branche par
  défaut ; une copie **propre** en HEAD détaché ; une copie dont la branche est déjà fusionnée (squash
  compris, cf. [[20261002155911250]]) et sans modification locale. Il signale le reste, avec la
  raison.
- Le ménage d'`ezk-archive` ne propose jamais de retirer une copie propre en HEAD détaché sous
  `.claude/worktrees/` : il la compte à part, comme réserve de l'app.

## Critères d'acceptation

- [ ] Sur le cas observé (4 copies ci-dessus), verdict `CLEAR` pour ce point.
- [ ] Une copie avec des modifications non commitées, ou une branche non fusionnée, lève toujours
      `ALERT`.
- [ ] `test-check-gate.sh` couvre les trois cas ignorés et les deux cas signalés.
- [ ] `check.sh --cleanup` ne propose aucun `git worktree remove` sur une copie propre en HEAD détaché
      sous `.claude/worktrees/` ; `test-cleanup.sh` couvre le cas du 2026-10-03.
- [ ] Les deux outils appellent le même détecteur : une seule définition de « copie de réserve ».

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-sprint/scripts/test-check-gate.sh
bash products/mega-city/skills/ezk-archive/scripts/test-cleanup.sh
```

## Notes / décisions

- 2026-10-03 : née de la rétro muti docs/captures/2026-10-03-retro-fps-auto-adaptatif.md (dépôt muti), retenue (choix délégué par le PO au pilote).
- 2026-10-03 : élargie à l'outil de ménage d'`ezk-archive` par la rétro muti
  `docs/captures/2026-10-03-retro-cloture-et-menage.md` (décision PO ✅).
- Voisines : SPRINT.md commité [[20261003011750433]] ; portier d'archive et squash
  [[20261002155911250]] ; ménage lançable en mode auto [[20261003105820099]].
- **Cas du 2026-10-03** (run V0.5, rétro de l'itération, capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`) : le portier d'ezk-sprint a
  levé la même alerte aux trois ouvertures de sprint du run. Voisins : le dossier principal propre sur
  `main`, trois worktrees détachés propres sur d'anciens commits de `main`, un worktree d'une session
  muti. Trois passages outre journalisés dans `SPRINT.md`, aucun n'était un vrai risque.
- **Cas du 2026-10-04** (run `--once`, rétro légère de fin de V0.5, capture
  `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`) : `sprint.sh start --dry-run` a rendu
  `ALERT` pour 4 worktrees voisins, tous propres, aucun ne touchait la fiche (le dossier principal sur
  `main`, deux worktrees détachés sur d'anciens commits, un worktree sur une branche déjà absorbée).
  En mode auto, le run a dû s'arrêter pour demander au PO de passer outre. Quatrième run de suite où
  l'alerte n'était pas un vrai risque.
- **Passée en P1 le 2026-10-04** (rétro légère du run cockpit de la V0.6, capture
  `docs/captures/2026-10-04-retro-run-cockpit-v0-6-legere.md`, décision PO) : cinquième passage outre
  en deux jours. Ce soir, l'ouverture du run puis celle du sprint de correction ont demandé au PO de
  passer outre pour deux dossiers voisins propres (le dossier principal sur `main`, un worktree
  détaché), sans lien avec les fiches. Inscrite au plan, en tête de ce qui reste de la V0.6.
