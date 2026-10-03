---
date: 2026-10-03
session: session « Finir la V0.5 » (run ezk-product-build, PR #343 à #347)
type: friction
---

# Le journal de sprint reste dans un worktree recyclé, et le dossier d'arrivée porte celui d'une autre session

**En clair.** En fin de session, l'app a recyclé le worktree de la session pour une autre session, et
l'a déplacée dans un autre dossier. Son `SPRINT.md` (trois sprints, non commité par conception) est
resté dans l'ancien dossier, désormais au travail d'une autre session. Le nouveau dossier portait le
`SPRINT.md` d'une session plus ancienne. La clôture a dû aller chercher le bon fichier à la main.

**Les faits, datés (2026-10-03).**
- L'ancien dossier `.claude/worktrees/weak-backlink-3f0945` est passé sur la branche
  `squash/github-local` d'une autre session ; il contenait encore le `SPRINT.md` des sprints 1 à 3 de
  la V0.5 (PR #343, #344, #345).
- Le nouveau dossier `.claude/worktrees/ready-todo-status-distinction-d96e52` portait le `SPRINT.md`
  de la session ADR-0049 (« Sprint 1 — La fiche d'une story arrive en done avec son merge », clos le
  2026-10-02).
- `ezk-archive` aurait archivé le mauvais journal sans vérification à la main.
- Récit finalement écrit dans `docs/sessions/2026-10-03-run-v0-5.md`, depuis l'ancien dossier.

**Pourquoi ça compte.** La fiche « La note de passation et le carnet de rétro survivent à la
suppression d'un worktree » (V0.5, prête) sort la note de passation et le carnet du worktree. Le
`SPRINT.md` a le même défaut et n'est pas dans son périmètre. La fiche « Les récits de session
reviennent sur main » en dépend aussi.

**Piste pour la rétro.** Élargir la fiche de la note de passation au `SPRINT.md`, ou dire au portier
d'`ezk-archive` de refuser un `SPRINT.md` dont les stories ne sont pas celles déclarées travaillées.
