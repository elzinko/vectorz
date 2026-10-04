# Carnet de préparation de rétro

Chaque session dépose ses frictions, idées et problèmes à porter à la prochaine rétro.
`ezk-retro` (temps 1) lit ce dossier ; `ezk-archive` (clôture) invite à déposer une note.

## Déposer une note : une commande

    ezk retro note "<titre>" [--type friction|idée|problème] <<< "<corps>"

La note part dans le dossier git commun à tous les worktrees (`<git-common-dir>/ezk/retro-notes/`),
sans commit ni PR. Elle survit à la suppression du worktree. La rétro la lit au temps 1, puis la
verse ici, dans `traitees/`, par sa PR de rangement. Revers : une note en attente ne survit pas à
un nouveau clone du dépôt. Écrire directement dans ce dossier reste possible (fichier, commit, PR).

## Une note = un fichier

`docs/retro-notes/<AAAAMMDDHHMMSSmmm>-<slug>.md` (id horodaté, minté inline comme les fiches — fiche 0180).

Front-matter minimal :

    date: 2026-09-12
    session: <contexte court, ex. "sprint 0081 / worktree ready-todo">
    type: friction | idée | problème

Corps **auto-porteur** : chemins et commits explicites, aucun « voir plus haut ».
Règle `documentation-guidelines/proven-outbound-references` (citer = vérifié).

## Cycle de vie

- **Vivante** : hors de git (déposée par `ezk retro note`), ou à la racine `docs/retro-notes/`.
- **Traitée / écartée** par une rétro : `git mv` vers `docs/retro-notes/traitees/` (raison consignée dans la capture de cérémonie).
