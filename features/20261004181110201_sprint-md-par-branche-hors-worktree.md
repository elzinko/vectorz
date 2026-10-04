---
id: "20261004181110201"
title: "Le journal de sprint se range par branche, hors du worktree : un worktree recyclé n'hérite plus du sprint d'une autre session"
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [sprint, worktree, archive]
status: idea
pr:
evidence: none # scripts de sprint, pas d'écran
created: 2026-10-04
---

# 20261004181110201 — Le journal de sprint se range par branche, hors du worktree

**En clair.** Le journal de sprint, `SPRINT.md`, vit à la racine du worktree et n'est pas versionné.
L'app Claude recycle les worktrees d'une session à l'autre : la session suivante hérite du journal
d'une autre. C'est arrivé trois fois en deux jours. On range le journal par branche, dans le dossier
git commun, comme la note de passation depuis la fiche « La note de passation et le carnet de
rétro survivent à la suppression d'un worktree » (20261003105820077).

**Si tu arrives frais.** `SPRINT.md` suit le lot du sprint en cours et garde le savoir de la session
(notes, galères, incréments scellés). `sprint.sh start` le crée, `close` le scelle, `ezk-archive` en
fige une copie dans `docs/sessions/` à la clôture. Un *worktree* est un dossier de travail séparé sur
le même dépôt ; l'app en crée un par session et le recycle ensuite.

## Contexte / Problème

- 2026-10-03, vectorz : le journal des sprints 1 à 3 de la V0.5 est resté dans un worktree recyclé ;
  le dossier d'arrivée portait celui d'une session plus ancienne
  (`docs/retro-notes/traitees/20261003205239634-sprint-md-reste-dans-worktree-recycle.md`).
- 2026-10-04, muti : la clôture a trouvé un journal de septembre, sans lien avec la session ; le
  portier a refusé la voie rapide (`docs/retro-notes/traitees/20261004101755894-sprint-md-perime-recidive-muti.md`).
- 2026-10-04, vectorz : `sprint.sh start` a ouvert un « Sprint 2 » ; le journal trouvé portait le
  sprint 1 et les notes du 2026-10-02, d'une autre session.

## Valeur — ce que coûte de ne rien faire

- `ezk-archive` risque d'archiver le journal d'une autre session comme récit de la session courante.
- La voie rapide de clôture est refusée à tort, et la clôture se juge à la main.
- Les notes d'une autre session se mêlent à celles du sprint en cours.

## Proposition

1. `sprint.sh` range le journal sous `<git-common-dir>/ezk/sprints/<branche>.md` : un fichier par
   branche, partagé par tous les worktrees, hors de git.
2. Un `SPRINT.md` resté à la racine d'un worktree est repris une fois s'il appartient à la branche
   courante, et signalé sinon : jamais repris en silence.
3. `ezk-archive` lit le journal de la branche de la session.

## Critères d'acceptation

- [ ] Un worktree neuf, sur une branche neuve, ouvre « Sprint 1 », sans notes héritées.
- [ ] Le journal d'une branche survit à `git worktree remove --force` et se relit depuis un autre
      worktree de la même branche.
- [ ] Un `SPRINT.md` étranger à la branche courante est signalé par `sprint.sh start`, pas repris.
- [ ] `ezk-archive` archive le journal de la branche de la session (test du portier).
- [ ] `test-sprint-lifecycle.sh` reste vert.

## Mesure de suivi

- [ ] Après le merge : 0 journal étranger dans les 5 prochaines clôtures `ezk-archive`, vectorz et
      muti confondus.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-sprint/scripts/test-sprint-lifecycle.sh
bash products/mega-city/skills/ezk-archive/scripts/test-check-gate.sh
```

## Notes / décisions

- 2026-10-04 : née de la rétro légère de fin de V0.5 (capture
  `docs/captures/2026-10-04-retro-iteration-v0-5-legere.md`), proposition 2, retenue par le PO.
- P1 proposé par le pilote (troisième occurrence en deux jours) ; à confirmer au planning.
- Vise aussi muti : la règle `development/host-project-proof-before-ship` s'applique.
- Voisines : note de passation hors worktree (20261003105820077, livrée) ; regrouper les artefacts de
  méthode (20261001192624192, parkée, plus large) ; `sprint.sh` distingue un sprint ouvert d'un
  `SPRINT.md` commité (20261003011750433, V0.6) : un journal rangé par branche hors du worktree la
  rendrait sans objet, à regrouper au grooming.
