---
id: "20261011091552583"
title: regen écrit un titre cassé quand on lui passe --root
type: bug
priority: P2
product: mega-city
milestone:
version: v0.11.0
labels: [backlog]
status: ready
pr:
evidence: none # pas d'écran
created: 2026-10-11
---

# 20261011091552583 — regen écrit un titre cassé quand on lui passe --root

**En clair.** `ezk backlog regen --root <chemin>` a écrit « # --root » comme titre du fichier
`BACKLOG.md`, sans la moindre erreur. Le drapeau `--root` a été pris pour le titre. La vue générée
était fausse et rien ne l'a signalé.

**Si tu arrives frais.** `regen` régénère les vues du backlog (`BACKLOG.md`, le portfolio, le board).
`--root <chemin>` sert à viser un autre dépôt que le dossier courant. Le H1, c'est la première ligne
`# …` du fichier Markdown : son titre.

## Contexte / Problème

Constaté le 2026-10-11 pendant le run autonome v0.7. J'ai lancé `ezk backlog regen --root "$R"` depuis
un worktree. Le script a interprété la valeur de `--root` comme le titre positionnel du board, et a écrit
`# --root` en tête de `BACKLOG.md`. Aucune erreur, aucun avertissement. La revue adverse l'a rattrapé, pas
la gate automatisée.

## Proposition

`regen` traite `--root` comme ce qu'il est : un chemin, jamais un titre. Le H1 dérive toujours du vrai
titre du board. Un drapeau connu mal placé n'atterrit pas dans la sortie ; un drapeau inconnu échoue au
lieu d'être avalé.

## Critères d'acceptation

- [x] `ezk backlog regen --root <chemin>` écrit le H1 normal de `BACKLOG.md`, jamais « # --root ».
- [x] Un drapeau inconnu fait échouer la commande avec un message clair.
- [x] Un test couvre le cas « `--root` passé » et vérifie le H1 produit.

## Comment vérifier

```bash
pnpm --dir products/mega-city test
ezk backlog regen --root "$(git rev-parse --show-toplevel)"
head -1 features/BACKLOG.md   # doit être le vrai titre, pas "# --root"
```

## Notes / décisions

- Sort de la rétro du run autonome v0.7 (capture `docs/captures/2026-10-11-retro-run-v07-autonome.md`, S2).
- Même famille que la parité du flux local : lié par le sujet à [[20261010235330118]].
