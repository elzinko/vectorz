---
id: "20261004074008211"
title: Le merge local ne supprime jamais main, et dit chaque branche qu'il supprime
type: bug
priority: P0
product: mega-city
milestone:
version: V0.5
labels: [github-optionnel, worktree]
status: ready
pr:
evidence: none # script de merge en ligne de commande, pas d'écran
created: 2026-10-04
---

# 20261004074008211 — Le merge local ne supprime jamais main

**En clair.** Après un squash local, `ship-merge.sh --local` supprime les branches dont le contenu
est déjà dans la branche visée. Le 2026-10-03, la branche visée n'était pas `main`, et le script a
lancé la suppression de `main` elle-même. Seul le verrou du dossier principal l'a empêchée. Cette
fiche protège la branche principale, et fait dire au script chaque branche qu'il supprime.

**Si tu arrives frais.** `ship-merge.sh --local` est l'outil de merge du mode local
(`github: false`) : il squashe la branche d'une story dans une base, puis range les branches
locales devenues inutiles. La *base* est la branche qui reçoit le squash, en général `main`.

## Contexte / Problème

Constat du 2026-10-03, pendant le run `ezk-product-build` de la fiche
[Le mode local de la méthode marche depuis un projet hôte](done/20261003200945204_mode-local-depuis-projet-hote.md).

- La session travaillait dans un worktree. `main` était extrait dans le dossier principal, donc le
  squash a visé une branche d'intégration : `--base squash/github-local`.
- Après le squash, la fonction `prune_absorbed_branches` de
  `products/mega-city/skills/ezk-pr/scripts/ship-merge.sh` a parcouru toutes les branches locales.
  Elle ne saute que la base. `main` est une ancêtre de la branche d'intégration : elle a été jugée
  « absorbée », et le script a lancé `git branch -D main`.
- Message affiché : « branche absorbée 'main' non supprimée (tenue par un worktree ?) — ignorée ».
  Sans le verrou du worktree, `main` aurait disparu du dépôt local.
- Le script n'affiche rien quand une suppression réussit. Après coup, on ne peut pas savoir
  quelles branches il a effacées, ni les recréer.

Effet : un merge local vers une autre base que `main` peut effacer la branche principale. C'est le
cas de toute session en worktree, puisque `main` y est déjà extrait ailleurs.

## Proposition

1. **La branche principale n'est jamais supprimée.** `prune_absorbed_branches` saute la base, et
   aussi `main`, `master` et la branche que vise `origin/HEAD` quand elle existe.
2. **Chaque suppression se dit.** Une ligne par branche supprimée, avec le SHA de sa pointe et la
   commande qui la recrée : `pruned: <branche> (<sha>) — git branch <branche> <sha>`.
3. Le reste ne change pas : une branche tenue par un autre worktree est signalée et laissée, jamais
   d'abandon en plein ship.

## Critères d'acceptation

- [ ] Après `ship-merge.sh --local --base <branche d'intégration>`, `main` existe toujours, même
      quand elle n'est extraite dans aucun worktree.
- [ ] Idem pour `master`, et pour la branche visée par `origin/HEAD` quand le dépôt a un remote.
- [ ] Chaque branche supprimée apparaît dans la sortie, avec son SHA et la commande qui la recrée.
- [ ] Les cas existants de `test-ship-merge.sh` restent verts : une branche absorbée ordinaire est
      toujours supprimée, une branche tenue par un worktree est signalée sans abandon.

## Comment vérifier

```bash
bash products/mega-city/skills/ezk-pr/scripts/test-ship-merge.sh   # cas de la base ≠ main inclus
pnpm --dir products/mega-city test:scripts
```

## Glossaire

- squash — fusionner tous les commits d'une branche en un seul commit sur la base.
- branche absorbée — une branche dont tout le contenu est déjà dans la base : la fusionner ne
  changerait rien.
- `origin/HEAD` — la branche par défaut du dépôt distant, en général `main`.

## Notes / décisions

- Priorité P0 fixée par le PO le 2026-10-04 (« corriger d'abord le merge »). Version V0.5 : même lot
  que le correctif du mode local, qu'elle complète.
