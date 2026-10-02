---
id: "20261003011750433"
title: "sprint.sh start/close distingue un sprint ouvert d'un SPRINT.md commité"
type: bug
priority: P2
product: mega-city
milestone:
version: V0.6
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
