# 0075 — `features/BACKLOG.md` sort de git

- Statut : accepté
- Date : 2026-10-13

**En clair.** `features/BACKLOG.md` est l'index du backlog, **généré** depuis les fiches. Chaque PR
de story le réécrit, donc deux PR ouvertes en même temps se disputent ce fichier à chaque merge.
On le **sort de git** : il n'est plus committé, `regen` le reconstruit en local à la demande. Zéro
conflit, par construction. `features/PLAN.md` (la séquence curée, lue sur GitHub) reste committée.

## Contexte

L'[ADR-0055](0055-artefacts-generes-hors-versionnage.md) a sorti de git les vues générées, avec une
exception : une vue reste committée si on la lit sur GitHub. Son verdict « lue sur GitHub » pour
`BACKLOG.md` a été **affirmé, jamais mesuré**.

Depuis l'[ADR-0049](0049-ship-fiche-dans-la-pr-vues-post-merge.md), le ship voyage dans la PR :
**chaque** PR de story régénère `BACKLOG.md`. Résultat mesuré le 2026-10-03 : `BACKLOG.md` modifié
24 fois en deux jours sur `main`, dont 18 par des PR de fiches, et un conflit à chaque merge
parallèle (PR #337). Le coût est répété : fusionner `main`, régénérer, rejouer la gate, pousser.

## Décision

`features/BACKLOG.md` **n'est plus suivi par git** (`git rm --cached` + `.gitignore`). On le
construit en local, à la demande (`regen`, `views:regen`). Cette décision **révise le verdict de
l'ADR-0055 pour cette seule vue** : son exception « lue sur GitHub » tombe.

`features/PLAN.md` — la séquence curée et versionnée — **reste committée** : c'est elle qu'on lit sur
GitHub. La liste des fiches de `features/` (noms `<id>_<slug>`) y reste lisible aussi.

## Conséquences

- **Plus de conflit** sur `BACKLOG.md` entre deux PR, par construction : git n'a plus ce fichier.
- `ship-in-pr.sh` et `ezk backlog ship` ne committent plus d'index (il est ignoré) ; la recette
  « Conflit sur `BACKLOG.md` » disparaît d'`ezk-backlog` et de `ship-in-pr.sh undo`.
- Les liens de doc qui pointaient vers `features/BACKLOG.md` pointent vers `features/README.md`
  (le guide) ou `features/PLAN.md` (la séquence) : un clone frais n'a plus le fichier tant que
  `regen` n'a pas tourné.
- **Réversible** : il suffit de recommiter le fichier et de retirer la ligne du `.gitignore`.
- Fiche : [20261002231845120](../../../../features/done/20261002231845120_backlog-md-sans-conflit-entre-pr.md).
