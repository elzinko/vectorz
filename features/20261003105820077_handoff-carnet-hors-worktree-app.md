---
id: "20261003105820077"
title: "La note de passation et le carnet de rétro survivent à la suppression d'un worktree de l'app"
type: bug
priority: P1
product: mega-city
milestone:
version: V0.5
labels: [archive, retro, worktree]
status: ready
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

## Valeur — ce que coûte de ne rien faire

- **Une note de passation sur deux part avec son worktree.** Deux pertes datées dans muti
  (2026-09-28, 2026-10-02). La seconde fois, le portier affirmait `durable=1`.
- **Chaque session neuve hérite d'une note périmée.** L'app copie dans le nouveau worktree la note du
  dossier principal, figée au 2026-09-21. La session suivante part d'un état vieux de deux semaines,
  ou rien du tout.
- **Le carnet de rétro reste vide.** Déposer une note demande un commit, une PR et une fusion par le
  PO. Le 2026-10-02, deux idées n'ont pas été déposées ; les deux rétros muti du 2026-10-03 ont trouvé
  le carnet vide.
- **Le pilote compense à la main.** À chaque clôture, il recopie ce qui reste à faire dans sa mémoire
  avant d'archiver.

Avec la fiche : la passation entre sessions tient sans geste manuel, `durable=1` dit vrai, et une
friction se note en une commande au moment où on la vit.

## Proposition

1. **Un lieu commun hors du worktree : `$(git rev-parse --git-common-dir)/ezk/`.** La note de
   passation y vit (`handoff.md`), le carnet aussi (`retro-notes/`). C'est le dossier git que tous les
   worktrees du dépôt partagent : il survit à leur suppression, il reste hors de git, et l'app ne le
   copie pas dans un nouveau worktree. Le verrou de `handoff.sh` y est déjà posé. Une note restée dans
   l'ancien lieu (`<worktree>/.claude/handoff.md`) est reprise une fois, puis ignorée. Revers
   accepté : le dossier est caché dans `.git/`, donc la note se lit par `handoff.sh carry`, pas en
   ouvrant le dossier.
2. **Le portier dit vrai.** `durable=1` seulement si la note survit à la suppression du worktree
   courant.
3. **Le carnet suit le même chemin (voie A, décision PO).** Déposer une note coûte une commande, sans
   PR. `ezk-retro` lit ce lieu au temps 1, puis verse les notes traitées dans git par sa PR de
   rangement. Revers accepté : une note en attente ne survit pas à un nouveau clone du dépôt.
4. **[[0189]] reste valable** pour l'hôte jetable : on ne la rouvre pas.

## Critères d'acceptation

- [ ] Une note écrite depuis un worktree se relit par `handoff.sh carry` depuis un autre worktree du
      même dépôt, après `git worktree remove --force` du premier. Le cas est reproduit dans
      `test-handoff.sh`.
- [ ] `handoff.sh path` affiche `<git-common-dir>/ezk/handoff.md`, lancé depuis le dossier principal
      comme depuis un worktree.
- [ ] Une note restée dans l'ancien lieu (`<worktree>/.claude/handoff.md`) est reprise une fois, puis
      ignorée. La copie que l'app pose dans un worktree neuf ne masque jamais la note commune. Cas
      reproduit.
- [ ] Le portier n'affiche `durable=1` que si la note vit sous `git-common-dir`
      (`test-check-gate.sh`).
- [ ] `ezk retro note "<titre>"` (corps sur l'entrée standard) dépose une note de carnet sous
      `<git-common-dir>/ezk/retro-notes/`, sans commit ni PR. `ezk-retro` la lit au temps 1, puis la
      verse dans git par sa PR de rangement.
- [ ] Sur hôte jetable, `handoff.sh durable` garde le comportement de [[0189]] (test existant vert).

## Mesure de suivi

- [ ] Après le merge : 3 clôtures de suite dans muti, en worktree d'app, sans note de passation
      perdue.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-archive/scripts/test-handoff.sh
bash products/mega-city/skills/ezk-archive/scripts/test-check-gate.sh
```


## Dépendances externes

- **dépendance muti — accès constaté le 2026-10-03.** Dépôt local `/Users/elzinko/git/bacasable/muti`,
  sur `main`, remote `elzinko/muti`. 4 worktrees d'app ouverts ce jour-là. Il ne sert qu'à la mesure
  de suivi, après le merge : le build et ses tests tournent dans vectorz, sur des dépôts jetables.

## Notes / décisions

- 2026-10-03 : née de la rétro muti `docs/captures/2026-10-03-retro-cloture-et-menage.md`, décision
  PO ✅ ; voie A retenue pour le carnet (la voie B, élargir la fiche muti « hook pre-commit
  docs-only », est écartée).
- P1 / V0.5 proposés par le pilote (perte de continuité, 2e occurrence) ; à confirmer au planning.
- **Groomée le 2026-10-03 — avis d'architecte (décision PO : garder).** Trois lieux comparés :
  `<worktree>/.claude/` (aujourd'hui : part avec le worktree), `<principal>/.claude/` (survit, mais
  l'app le copie dans chaque nouveau worktree : la copie du dossier principal de vectorz date du
  2026-09-21, chaque session neuve hérite d'une note périmée), `<git-common-dir>/ezk/` (retenu : une
  seule copie, partagée, jamais copiée). Constaté dans `handoff.sh` : `FILE="$ROOT/.claude/handoff.md"`
  avec `ROOT` = racine du worktree ; le verrou utilise déjà `--git-common-dir`.
- 3e occurrence, le 2026-10-03 : en fin de session « Finir la V0.5 », l'app a recyclé le worktree
  `weak-backlink-3f0945` pour une autre session, et a déplacé celle-ci dans un autre dossier.
- Voisines : hôte jetable [[0189]] ; reprise d'un archivage interrompu [[20261002155911264]] ; règle
  muti `archive-from-target-worktree` (lancer `handoff.sh` depuis le worktree cible).
- **Grooming du 2026-10-03** (boucle guidée, PO présent) : avis d'architecte (lieu commun), critères
  rendus testables (commande `ezk retro note` nommée, mesure terrain sortie en « Mesure de suivi »),
  section Valeur, dépendance muti constatée. Statut inchangé : la porte « prête » reste à passer.
- **Prête le 2026-10-03** (porte « prête » passée : trois incidents datés, valeur chiffrée, six
  critères prouvables sur la branche, dépendance muti constatée).
