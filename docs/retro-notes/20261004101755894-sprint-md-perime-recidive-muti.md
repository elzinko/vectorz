---
date: 2026-10-04
session: session muti « GitHub coupé côté méthode » (worktree `goofy-kirch-e52880`)
type: friction
---

# Récidive : un SPRINT.md périmé dans un worktree recyclé prive l'archive de sa voie rapide

**En clair.** Deuxième fois en deux jours. Le 2026-10-04, la clôture `ezk-archive` d'une session
muti a trouvé dans son worktree un `SPRINT.md` d'un sprint de septembre, qui n'avait rien à voir
avec la session. Le portier a refusé la voie rapide à cause de ce fichier. La clôture a dû juger à
la main de ne pas l'archiver comme récit de la session.

**Les faits, datés (2026-10-04).**
- Dépôt muti, worktree `.claude/worktrees/goofy-kirch-e52880`, branche
  `claude/zen-elbakyan-57403e`.
- Son `SPRINT.md`, hors suivi git, portait « Sprint — Décompte perf + épic trackpad » : les fiches
  20260827165402817 et 20260901135952195, de septembre. Fichier modifié pour la dernière fois le
  2026-10-03 à 00:42, avant le début de la session.
- La session n'avait livré ni travaillé aucune fiche muti : `check.sh --gate --shipped none
  --worked none`.
- Le portier a rendu `VERDICT: CLEAN` mais `FASTPATH: NO reason=sprint`, uniquement à cause de ce
  fichier.
- Sans vérification à la main, l'étape 8 de la clôture aurait copié ce sprint de septembre dans
  `docs/sessions/` comme récit de la session.

**Pourquoi ça compte.** C'est la même cause que la note
`docs/retro-notes/20261003205239634-sprint-md-reste-dans-worktree-recycle.md` (2026-10-03, dans
vectorz) : le `SPRINT.md` reste dans le worktree que l'app recycle. Cette fois, le cas touche un
projet hôte. Deux occurrences en deux jours, sur deux dépôts : la règle maison « un outillage
seulement après au moins deux récidives » est atteinte.

**Piste pour la rétro.** La piste de la note du 2026-10-03 se confirme : le portier d'`ezk-archive`
devrait ignorer un `SPRINT.md` dont les fiches ne recoupent pas `--worked`, ou plus ancien que la
session, et le dire en une ligne. Autre option : élargir au `SPRINT.md` la fiche
`features/20261003105820077_handoff-carnet-hors-worktree-app.md` (la note de passation et le carnet
de rétro hors du worktree).
