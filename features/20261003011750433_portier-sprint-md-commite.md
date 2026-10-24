---
id: "20261003011750433"
title: "sprint.sh start/close distingue un sprint ouvert d'un SPRINT.md commité"
type: bug
priority: P3
product: mega-city
milestone:
version:
labels: [sprint, portier]
status: idea
pr:
evidence: none # script de sprint, pas d'écran
created: 2026-10-03
---

# 20261003011750433 — sprint.sh start/close distingue un sprint ouvert d'un SPRINT.md commité

**En clair.** Dans un projet qui a commité un vieux `SPRINT.md` (muti : instantané du 2026-09-12),
`sprint.sh start` refuse d'ouvrir un sprint (`START: REFUSED open_sprint`) : il prend l'instantané
pour un sprint en cours. Il faut supprimer le fichier, ouvrir, le déplacer puis le restaurer, et
refaire la même danse à `close`. On veut que le script reconnaisse un vrai sprint ouvert.

**Si tu arrives frais.** `SPRINT.md` est le carnet éphémère du sprint en cours, écrit par
`sprint.sh start` et scellé par `sprint.sh close` (skill `ezk-sprint`).

## Contexte / Problème

- muti, 2026-10-02 (sprint FPS auto-adaptatif, PR muti #271) : refus à `start`, contournement manuel
  à `start` puis à `close`. 2e occurrence (1re : muti #258, 2026-09-30).
- `sprint_state()` compte un `SPRINT.md` d'ancien format (sans `Statut: clos`) comme ouvert.
- Côté muti, l'instantané sort du suivi git (rétro du 2026-10-03) ; le script reste fragile pour tout
  autre projet dans ce cas.

## Proposition

`sprint.sh` reconnaît un sprint ouvert par une marque sûre (ex. `Statut: en cours` + date d'ouverture
au format courant), et traite un `SPRINT.md` **suivi par git** sans cette marque comme un instantané :
il le signale par une ligne `WARN:` et ne bloque pas. La voie conseillée reste de ne pas commiter
`SPRINT.md` (fiche [[20261001192624192]]).

## Critères d'acceptation

- [ ] `start` ouvre un sprint dans un dépôt où un `SPRINT.md` d'ancien format est commité, sans
      geste manuel, avec un `WARN:` explicite.
- [ ] Un vrai sprint ouvert est toujours refusé (`REFUSED open_sprint`) — test existant intact.
- [ ] `test-sprint-lifecycle.sh` couvre le cas.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-sprint/scripts/test-sprint-lifecycle.sh
```

## Notes / décisions

- 2026-10-03 : née de la rétro muti docs/captures/2026-10-03-retro-fps-auto-adaptatif.md (dépôt muti), retenue (choix délégué par le PO au pilote).
- Voisine : portier et copies de réserve [[20261003011750521]].
- **Review ciblé 2026-10-14** : v0.14 a refait le portier de sprint (journal par branche, hors
  worktree), mais le cœur de `sprint_state()` garde « ancien format = ouvert » (sprint.sh, l. 150).
  Le cas ne mord donc plus qu'un **projet hôte avec un vieux `SPRINT.md` committé** → edge legacy en
  voie de disparition. **Repassée P2 → P3.**
- **Groomée `ready` (2026-10-24).** DoR socle vert ; prémisse confirmée par la revue du 2026-10-14
  (`sprint_state()` compte encore « ancien format = ouvert », sprint.sh l.150). Bug borné et testable
  via `test-sprint-lifecycle.sh`. Edge legacy mais réel — tirable.

- **`ready` RÉVOQUÉE (2026-10-24) — prémisse dépassée par le refactor v0.14.** En voulant la construire,
  j'ai relu `sprint.sh` : `sprint_state()` lit un `FILE` **hors arbre** (`$EZK_COMMON/ezk/sprints/<branche>.md`),
  et `exclude_sprint_file` exclut de git un `SPRINT.md` racine. Donc `sprint_state()` ne lit **jamais** un
  `SPRINT.md` committé à la racine : le symptôme décrit (« REFUSED open_sprint » à cause d'un SPRINT.md
  committé) **ne se reproduit plus** par ce mécanisme. J'avais groomé la fiche `ready` en me fiant à la note
  du 14/10 sans relire le code — faute corrigée. Retour `idea` : **à re-scoper** (reste au plus un
  durcissement défensif de `sprint_state()` : reconnaître `en cours` explicitement, un fichier sans marqueur
  = instantané). Nouvelle preuve pour la fiche « [prête vérifie la prémisse](20261015213921103_dor-verifie-premisse-dans-le-code.md) ».
