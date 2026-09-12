# Carnet de préparation de rétro

Chaque session dépose ici les frictions, idées et problèmes à porter à la prochaine rétro.
`ezk-retro` (temps 1) lit ce dossier ; `ezk-archive` (clôture) invite à y déposer une note.

## Une note = un fichier

`docs/retro-notes/<AAAAMMDDHHMMSSmmm>-<slug>.md` (id horodaté, minté inline comme les fiches — fiche 0180).

Front-matter minimal :

    date: 2026-09-12
    session: <contexte court, ex. "sprint 0081 / worktree ready-todo">
    type: friction | idée | problème

Corps **auto-porteur** : chemins et commits explicites, aucun « voir plus haut ».
Règle `documentation-guidelines/proven-outbound-references` (citer = vérifié).

## Cycle de vie

- **Vivante** : à la racine `docs/retro-notes/`.
- **Traitée / écartée** par une rétro : `git mv` vers `docs/retro-notes/traitees/` (raison consignée dans la capture de cérémonie).
