---
id: "20261003105820077"
title: "La note de passation et le carnet de rétro survivent à la suppression d'un worktree de l'app"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [archive, retro, worktree]
status: idea
pr:
evidence: none # scripts de clôture et de rétro, pas d'écran
created: 2026-10-03
---

# 20261003105820077 — La note de passation et le carnet de rétro survivent à la suppression d'un worktree de l'app

**En clair.** `ezk-archive` écrit la note de passation dans le dossier de travail de la session. Or
l'app Claude supprime ce dossier à l'archivage s'il garde des fichiers non validés, et sinon le
recycle pour une autre session. La note se perd, ou ressort chez une session au hasard. On écrit la
note, et les notes du carnet de rétro, dans un lieu commun à tous les dossiers de travail du dépôt,
qui survit à leur suppression.

**Si tu arrives frais.** Un *worktree* est un dossier de travail séparé sur le même dépôt git ; l'app
Claude (onglet Code) en crée un par session sous `.claude/worktrees/`. La *note de passation*
(handoff) est le mot qu'une session laisse à la suivante (`.claude/handoff.md`, écrit par
`skills/ezk-archive/scripts/handoff.sh`). Le *carnet de rétro* est `docs/retro-notes/`, où une
session dépose une friction pour la prochaine rétro.

## Contexte / Problème

- `handoff.sh` résout le dépôt par `git rev-parse --show-toplevel`. Dans un worktree d'app, il écrit
  donc dans `<worktree>/.claude/handoff.md` (gitignoré).
- L'app supprime à l'archivage un worktree qui porte des fichiers non validés, avec tout son contenu
  (dialogue constaté le 2026-09-28). Un worktree propre part en réserve, et l'app le recycle pour une
  autre session (constaté le 2026-09-30).
- Deux occurrences dans muti : la clôture du 2026-09-28 (PR muti #216), puis celle du 2026-10-02
  (session « réglages par tracker »). La 2e fois, le portier annonçait `durable=1`.
- La fiche [[0189]] (livrée) rend le handoff durable sur un hôte jetable (cloud, conteneur). Elle ne
  traite pas le worktree d'app : la machine est durable, le dossier ne l'est pas.
- Carnet : depuis un worktree, déposer une note demande un fichier, un commit, une PR de docs et une
  fusion par le PO (pas de push direct sur main en mode auto). Le 2026-10-02, deux idées n'ont pas
  été déposées ; les deux rétros muti du 2026-10-03 ont trouvé le carnet vide.

## Proposition

1. **Un lieu commun hors du worktree.** `handoff.sh` écrit dans un emplacement partagé par tous les
   worktrees du dépôt, qui survit à leur suppression : par exemple sous
   `git rev-parse --git-common-dir`, ou dans le checkout principal. Le choix exact se fait au grooming.
2. **Le portier dit vrai.** `durable=1` seulement si la note survit à la suppression du worktree
   courant.
3. **Le carnet suit le même chemin (voie A, décision PO).** Déposer une note coûte une commande, sans
   PR. `ezk-retro` lit ce lieu au temps 1, puis verse les notes traitées dans git par sa PR de
   rangement. Revers accepté : une note en attente ne survit pas à un nouveau clone du dépôt.
4. **[[0189]] reste valable** pour l'hôte jetable : on ne la rouvre pas.

## Critères d'acceptation

- [ ] Une note écrite depuis un worktree d'app se relit depuis un autre worktree du même dépôt, après
      `git worktree remove --force` du premier (cas reproduit dans `test-handoff.sh`).
- [ ] Le portier n'affiche `durable=1` que si la note est hors d'un worktree supprimable.
- [ ] Une note de carnet se dépose en une commande, sans PR, et `ezk-retro run` la lit au temps 1.
- [ ] Sur hôte jetable, le comportement de [[0189]] est inchangé.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-archive/scripts/test-handoff.sh
bash products/mega-city/skills/ezk-archive/scripts/test-check-gate.sh
```

Sur le terrain : 3 clôtures de suite dans muti (worktrees d'app) sans note de passation perdue.

## Notes / décisions

- 2026-10-03 : née de la rétro muti `docs/captures/2026-10-03-retro-cloture-et-menage.md`, décision
  PO ✅ ; voie A retenue pour le carnet (la voie B, élargir la fiche muti « hook pre-commit
  docs-only », est écartée).
- P1 / V0.5 proposés par le pilote (perte de continuité, 2e occurrence) ; à confirmer au planning.
- Voisines : hôte jetable [[0189]] ; reprise d'un archivage interrompu [[20261002155911264]] ; règle
  muti `archive-from-target-worktree` (lancer `handoff.sh` depuis le worktree cible).
