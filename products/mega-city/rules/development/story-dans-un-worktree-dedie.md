---
id: development/story-dans-un-worktree-dedie
kind: disposition
level: SHOULD
title: Une story se construit dans un worktree dédié, jamais en changeant la branche du dossier partagé
---

- **En clair.** Quand la session tourne dans le dossier principal du dépôt (pas dans un worktree),
  d'autres sessions peuvent y écrire en même temps. Changer sa branche ou y committer peut alors
  embarquer leur travail, ou leur faire perdre le leur. La story se construit donc dans un worktree
  dédié (`git worktree add .claude/worktrees/<slug> -b <branche> main`).
- **La règle.** Dans le dossier principal partagé, jamais de `git switch` vers une branche de story.
  Avant chaque commit, `git status` ne liste que des fichiers de la story ; un fichier qui n'est pas
  à elle se laisse en place et se signale.
- **Symptôme fondateur** (rétro du 2026-11-01) : le build du contrat JSON du board a commencé par une
  branche créée dans le dossier principal. Une autre session y modifiait au même moment quatre
  fichiers qui n'étaient pas à la story. Le travail a été déplacé dans un worktree avant tout commit.
- **Preuve mince.** Un seul incident : posée en SHOULD, sur décision du PO du 2026-11-01 (règle
  `agent-ops/preuve-mince-question-pas-veto`).
- **Mesure (removability).** Sur les 5 prochains runs : 0 branche de story créée dans le dossier
  principal partagé. Retrait quand l'outillage du sprint ouvre lui-même le worktree.

Origine : rétro du 2026-11-01, capture `docs/captures/2026-11-01-retro-run-contrats-json-light.md`
(proposition 1, lentilles architecture et dev). Appliquée par `skill:ezk-sprint`.
