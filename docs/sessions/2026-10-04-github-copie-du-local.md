fiches: 0171,20261003200945204,20261004074008211

> Session du 2026-10-03 au 2026-10-04 (worktree weak-backlink-3f0945). Ce worktree a été partagé :
> les sprints 1 à 3 ci-dessous appartiennent à la session run-v0-5, déjà archivée dans
> [2026-10-03-run-v0-5.md](2026-10-03-run-v0-5.md). Les sprints 4 et 5 sont ceux de cette session.

# Sprint 5 — V0.5 — le merge local ne supprime jamais main
Statut: clos   Ouvert: 2026-10-04   Clos: 2026-10-04

## Lot  (1 ligne = 1 story = 1 PR ; [x] livrée · [~] reportée · [ ] ouverte)
- [x] 20261004074008211 — Le merge local ne supprime jamais main, et dit chaque branche qu'il supprime (local 80af4fbf)

## Notes / décisions
- [ezk-pm] 2026-10-04 — ready fiche 20261004074008211 → GO (DoR atteinte, 1 story/1 sprint, critères prouvables avant merge).
- [pilote] 2026-10-04 — merge local vers `squash/github-local` (main extrait dans le dossier principal) ; push vers main au PO.
- [ezk-pm] 2026-10-03 — DoR + arbitrage point 4 → GO ; option C (sprint.sh start exclut SPRINT.md via .git/info/exclude) ; 1 story.
- [pilote] 2026-10-03 — merge local vers la branche d'intégration `squash/github-local` (main est extrait dans le dossier principal, le push vers main reste au PO).
- [pilote] 2026-10-03 — mode lean : dev porté par le pilote, une revue ezk-reviewer.
- Override du portier (ALERT points=2) — run ezk-product-build lancé par le PO (finir la V0.5). Alerte P2 = 5 worktrees voisins inspectés : principal propre sur main ; 3 worktrees détachés propres sur d'anciens commits de main ; 1 worktree muti (PR #340) qui ne touche pas cette fiche. Coordination envoyée à la session muti. Lot réordonné : 257 d'abord, 250 après la fusion de #340 qui la modifie. (2026-10-03)

- PO (2026-10-03, en cours de run) : la note de passation (20261003105820077) va en V0.5, le ménage en mode auto (20261003105820099) en V0.6. Porté par la PR #340 (session muti), PLAN.md à jour ; fusion = ordre du PO, demandé.
- Build 257 : le `ezk` du poste refusait toute commande « fixe » depuis un worktree de vectorz. Décision : il passe la main au lanceur du worktree (sinon passer les skills par `ezk` cassait le travail en worktree). Marque `writes: true` : une écriture n'écoute que `--root`.
- Revue `ezk-reviewer` : GO, 0 bloquant, 1 P2 corrigé (764fed85). Codex : quota épuisé, pas de revue cloud ; la revue locale est le plancher (ADR-0059).
- Override du portier (ALERT points=1,2) — même alerte P2 qu'au sprint 1 (worktrees voisins inspectés, aucun ne touche cette fiche). Ordre : 731 avant 250, car 250 attend la fusion de #340 (ordre PO) qui modifie sa fiche ; 731 prolonge 257 tout juste fusionnée. (2026-10-03)
- Override du portier (ALERT points=2) — même alerte P2 que les sprints 1 et 2 (worktrees voisins inspectés ; le worktree muti de #340 a vu sa PR fusionnée). (2026-10-03)

- Sprint 3 (250) : #340 fusionnée par le PO pendant le sprint 2 → 250 débloquée. Points 3 et 4 du portier (fiche livrée / ADR lus sur un worktree en retard) hors critères : à reprendre dans une fiche voisine.
- La note de passation (20261003105820077) entre en V0.5 par #340 mais reste `idea` : le run s'arrête à 3 sprints (borne du PO), elle est à groomer avant d'être construite.
- Override du portier (ALERT points=2) — PO 2026-10-03 : 4 worktrees voisins inactifs (0 modification, anciens sprints), aucune fiche in-progress, aucun ne touche 20261003200945204 (2026-10-03)
- Override du portier (ALERT points=2) — PO 2026-10-03 (même run ezk-product-build) : 4 worktrees voisins inchangés et inactifs (0 modification), aucune fiche in-progress (2026-10-04)

## Galères & gestes (labo)

## Incréments scellés de la session
- Sprint 1 — V0.5 — les skills ezk retrouvent mega-city depuis un projet hôte — 1 livrée, 0 reportée : 20261002155911257 (PR #343)
- Sprint 2 — V0.5 — sans --root, ezk backlog vise le dépôt du dossier courant — 1 livrée, 0 reportée : 20261003072823731 (PR #344)
- Sprint 3 — V0.5 — le portier d'ezk-archive compare à origin/main — 1 livrée, 0 reportée : 20261002155911250 (PR #345)
- Sprint 4 — V0.5 — le mode local marche depuis un projet hôte — 1 livrée, 0 reportée : 20261003200945204 (local eb8de257)
- Sprint 5 — V0.5 — le merge local ne supprime jamais main — 1 livrée, 0 reportée : 20261004074008211 (local 80af4fbf)
