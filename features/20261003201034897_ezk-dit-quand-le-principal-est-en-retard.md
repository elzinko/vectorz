---
id: "20261003201034897"
title: "La commande ezk dit quand le dossier principal de vectorz est en retard, et quoi lancer"
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [ezk, cross-repo]
status: idea
pr:
evidence: none # outillage, pas d'écran
created: 2026-10-03
---

# 20261003201034897 — La commande ezk dit quand le dossier principal de vectorz est en retard, et quoi lancer

**En clair.** La commande `ezk` du poste exécute le code du dossier principal de vectorz. Quand ce
dossier est en retard sur `origin/main`, une commande échoue ou se comporte comme avant la dernière
livraison, sans dire pourquoi. On veut qu'`ezk` le dise, avec la commande à lancer (`git pull`).

**Si tu arrives frais.** Le *dossier principal* est le checkout de vectorz hors worktree
(`~/git/bacasable/vectorz`). Le lien `~/.local/bin/ezk` pointe sur son code. Une livraison n'y arrive
qu'après un `git pull` dans ce dossier.

## Contexte / Problème

- 2026-10-03, run V0.5 : après la fusion de la PR #343, `ezk run report` lancé depuis un worktree a
  échoué (« autre checkout de la méthode ») : le dossier principal n'avait pas le nouveau code.
- `ship-merge.sh` affiche seulement « SIGNAL …/vectorz behind » après une fusion. Le message ne dit ni
  l'effet, ni quoi faire.
- Depuis la PR #343, les skills passent tous par `ezk`. Un dossier principal en retard touche donc
  tous les projets hôtes (muti, samplerz…).

## Proposition

1. `ezk` compare, à bas coût, le commit du dossier principal à `origin/main` (sans `fetch`, sur la ref
   déjà connue). En retard : une ligne sur la sortie d'erreur, « le code d'ezk a N commits de retard :
   lance `git -C <dossier> pull --ff-only` ».
2. `ship-merge.sh` remplace « SIGNAL behind » par la même phrase, avec la commande exacte.
3. Rien n'est lancé tout seul : le dossier principal peut être celui d'une autre session.

## Critères d'acceptation

- [ ] Sur un dépôt jetable dont le « principal » est en retard d'un commit sur `origin/main`, `ezk`
      affiche la phrase et la commande ; à jour, il n'affiche rien.
- [ ] `ship-merge.sh` affiche la même phrase après une fusion, au lieu de « SIGNAL behind ».
- [ ] Le contrôle ne fait aucun `fetch` et coûte moins de 100 ms.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
pnpm --dir products/mega-city test:scripts
```

## Mesure de suivi

- [ ] Sur les 3 prochains runs, 0 échec muet d'une commande `ezk` dû à un dossier principal en retard.

## Notes / décisions

- Née de la rétro de l'itération V0.5 (capture `docs/captures/2026-10-03-retro-iteration-v0-5.md`), proposée par les quatre lentilles.
  Retenue par choix délégué du PO à l'agent, P1.
