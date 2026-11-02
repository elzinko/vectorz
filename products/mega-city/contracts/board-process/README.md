# Le contrat de `ezk board process --json`

## En clair

`ezk board process --json` pose chaque fiche d'un projet sur son étape : idée, prête, en sprint, en
revue, livrée. Pour une fiche en sprint ou en revue, il dit aussi ce qui l'y place : sa branche de
travail, sa PR ouverte, sa session. Mission control l'affiche tel quel, sans replacer une fiche
lui-même. Ce dossier range la description de ce format et un exemple de sortie.

**Si tu arrives frais.** Une *fiche* est un fichier markdown du backlog. Une *session* est un dossier
de travail git (un worktree) sur la branche d'une fiche. La décision qui fait de la méthode le seul
lecteur des fiches est
l'[ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).

## Ce qu'il y a ici

- `v1/schema.json` : le schéma JSON du format, version 1.
- `v1/example.json` : la sortie de la commande sur le même faux projet que `board-show`, GitHub non
  lu. Une fiche y est en sprint par sa branche ; « en revue » y est inconnue.

Les deux fichiers sont **générés**. Ne les modifie pas à la main :

```bash
pnpm --dir products/mega-city board:contract --write
```

## Les règles

- Le projet lu est celui de `--root` : ses fiches, ses branches, ses sessions. Jamais le dossier d'où
  la commande part.
- Un projet qui a coupé GitHub (`github.pr: false`) ne lance aucun `gh`. Le champ `github` vaut alors
  `false`, et `reviewIndetermine` vaut `true` : « en revue » est inconnue, jamais devinée.
- Un champ ajouté ne change pas `schema_version`. Un champ retiré ou changé de sens la fait passer à 2.
