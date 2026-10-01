# Journal des difficultés

## En clair

Ce dossier garde les **galères résolues** : ce qui a coincé, comment on l'a réglé, et pourquoi.
On les écrit **pendant** le travail, une fois la galère corrigée et validée, directement dans un
fichier durable. Chaque entrée porte l'**id de la fiche** concernée.

Le « labo de cuisine » (`ezk-chef extract`) lit ce journal à la demande pour amorcer des
recettes. Le journal, lui, n'a pas besoin du labo pour exister.

## Écrire une entrée

```bash
bash products/mega-city/bin/journal-add.sh <id-fiche> "<titre court>" "<ce qui a coincé>" "<comment c'est réglé>" ["<pourquoi>"]
```

La commande écrit dans `docs/journal/<date>-<slug>.md` et affiche le chemin du fichier.

- Le `<slug>` est le nom de la branche git. Un worktree écrit donc dans son propre fichier.
- `--slug <nom>` choisit un autre nom de session. `--root <dir>` vise un autre projet.

N'écris que ce qui aide à **reproduire** : un geste d'interface, un réglage, un piège. Une fausse
piste ou une galère encore ouverte n'a pas sa place ici. Rien à retenir ? N'écris rien.

⚠ Ce dépôt est public. Jamais de valeur secrète : note le **nom** d'une clé, pas sa valeur.

## Format d'une entrée

```
## [<id-fiche>] Titre court de la galère
- **Coincé** : ce qui a bloqué, le symptôme vu.
- **Réglé** : le geste ou le correctif qui a marché.
- **Pourquoi** : la cause (facultatif).
```

Une entrée = un titre et trois puces d'une ligne. Le titre commence par l'id de la fiche entre
crochets, par exemple `[20260904091853974]`. Ce tag permet la lecture par feature.

## Un fichier par session

Deux sprints en parallèle écrivent dans deux fichiers différents. Il n'y a donc aucun conflit
possible, et aucun `SPRINT.md` partagé. Le fichier d'une session reçoit toutes ses entrées, tant
que le slug ne change pas.

## Lire

- **Par feature** : `grep -rh -A4 "^## \[<id>\]" docs/journal/` rend toutes les galères d'une
  fiche. `grep -rl <id> docs/journal/` rend les fichiers qui en parlent.
- **Par session** : ouvre le fichier.

Une seule capture, deux lectures. Il n'existe pas de second magasin.

## Le mot « session »

« Session » est un concept du **LLM** : l'agent perd sa mémoire entre deux sessions. On garde donc
la session comme **unité de capture**, le moment naturel pour noter une friction.

Ce n'est **pas** un objet de la méthode. La méthode garde feature, sprint et rétro. Les rétros
lisent les frictions par feature ou par thème, jamais « par session ».

## Voisinage

- `docs/sessions/` : les **récits** de session, c'est-à-dire la narration d'une tranche de travail.
  Autre brique, autre dossier.
- `ezk-chef extract <id>` : lit les entrées de ce journal taguées de l'id, et les verse dans les
  Préliminaires du brouillon de recette, avec un pointeur vers le fichier source.
- `SPRINT.md` : la section « Galères & gestes (labo) » reste lue pour la rétro-compatibilité. Ce
  n'est plus la voie recommandée.

Origine : fiche 20260904091853974.
