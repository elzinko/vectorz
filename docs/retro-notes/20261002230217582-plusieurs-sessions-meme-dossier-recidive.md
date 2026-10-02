---
date: 2026-10-03
session: session « WIP-v0.5 » (file de merge V0.4, run V0.5, PR #324, #325 et #329)
type: friction
---

# Plusieurs sessions dans le même dossier de travail : le cas revient

**En clair.** Le dossier `.claude/worktrees/ready-todo-status-distinction-d96e52` a servi à plusieurs
sessions en même temps, trois fois en deux semaines. À chaque fois, une session est tombée sur l'état
d'une autre. La rétro du 2026-10-03 a écarté le sujet « SPRINT.md périmé » avec la consigne « à
ressortir s'il revient ». Cette note rassemble les cas.

**Les faits, datés.**

1. **2026-09-20.** Une session concurrente bascule ce dossier sur une autre branche, en plein travail.
   Note traitée : `docs/retro-notes/traitees/20260920205700993-contention-worktree-sessions-concurrentes.md`.
   Parade d'alors : humaine, vérifier la branche avant d'écrire.
2. **2026-10-02.** La session qui construit la fiche `20261002114435782` (PR #333) démarre dans ce
   dossier. La session « WIP-v0.5 » y a laissé le `SPRINT.md` de son run V0.5, encore ouvert.
   `sprint.sh start` refuse. Il faut cocher #324 et #325, déjà mergées, puis sceller ce sprint à la main.
3. **2026-10-03.** L'app déplace la session « WIP-v0.5 » vers un nouveau dossier,
   `.claude/worktrees/models-per-client-config-ad598f`. Elle la rouvre sur sa branche d'origine,
   `claude/ezk-bacl-764b7a` (`948c68c5`), en retard de 83 commits sur `origin/main`. Au même moment,
   l'autre session joue sa rétro dans l'ancien dossier, avec ses fichiers de clôture encore hors de git.

**Pourquoi ça coince.** `SPRINT.md` et la note de passation `.claude/handoff.md` vivent à la racine du
dossier, pas par session. Deux sessions dans un même dossier partagent donc un seul état de sprint. Et
une session déplacée repart d'une vieille branche : si elle écrit sans se recaler sur `origin/main`,
elle part d'un état périmé.

**Piste pour la rétro.** Choisir entre un réflexe outillé et un rangement par session. Réflexe : le
portier `ezk-sprint check` signale un `SPRINT.md` ouvert par un autre run, et une branche en retard sur
`origin/main`. Rangement : l'état du sprint vit par branche ou par session, plus à la racine. À
mesurer : sur les 5 prochaines ouvertures de sprint, 0 sprint d'une autre session scellé à la main.
