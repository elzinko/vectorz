---
id: "20261011111526693"
title: "lawgiver bind : écrire les hooks de façon worktree-aware (.git peut être un fichier)"
type: bug
priority: P2
product: mega-city
milestone:
version: v0.14.0
labels: [lawgiver, worktree]
status: idea
pr:
evidence: none
created: 2026-10-11
---

# 20261011111526693 — lawgiver bind worktree-aware pour les hooks

**En clair.** Quand on binde un projet **depuis un worktree git**, `lawgiver bind` plante en posant
le hook `commit-msg` : il tente `mkdir .git/hooks`, mais dans un worktree `.git` est un **fichier**
(`gitdir: …`), pas un dossier → `ENOTDIR`. Les fichiers (la loi, `CLAUDE.md`) sont écrits avant,
donc le bind est à moitié fait. À corriger pour que le bind marche partout.

**Si tu arrives frais.** `lawgiver bind` matérialise la méthode dans un projet (`src/io/apply.ts`).
Un *worktree* git est une copie de travail où `.git` n'est pas un dossier mais un fichier qui pointe
vers le vrai dossier git commun.

## Contexte / Problème

Remonté par le dogfooding de la fiche [CLAUDE.md proxy](done/20261007115129448_claude-md-proxy-loi-bindee-par-projet.md)
(run auto 2026-10-11) : `pnpm … lawgiver bind base <worktree> claude-code-law` écrit bien
`.iamthelaw/ENTRY.md` et le bloc `CLAUDE.md`, puis échoue sur :

```
Error: ENOTDIR: not a directory, mkdir '…/.git/hooks'
  at poseHook (src/io/apply.ts) — hookPath = join('.git', 'hooks', stage)
```

`poseHook` code `.git/hooks` **en dur**. Dans un worktree, le vrai dossier de hooks est celui du
dépôt commun (`git rev-parse --git-path hooks`). Deux difficultés :

1. résoudre le bon chemin (git le sait : `--git-path hooks`), plutôt que `.git/hooks` littéral ;
2. la garde de sécurité `resolveInsideProject` (défense en profondeur F1, `apply.ts`) refuse tout
   chemin **hors du projet** — or les hooks d'un worktree vivent dans le `.git` commun, en dehors.
   La garde doit donc traiter les hooks à part, **sans** rouvrir une écriture arbitraire hors projet.

C'est une **frontière de sécurité I/O** : la correction mérite une revue (pas un run autonome).

## Proposition

- Résoudre le dossier des hooks via `git rev-parse --git-path hooks` (correct en dépôt normal ET en
  worktree ; en dépôt normal ça reste `.git/hooks`, les tests actuels ne bougent pas).
- Autoriser **ce seul** chemin hors projet pour les hooks, de façon étroite et motivée (ne pas
  affaiblir F1 pour les fichiers du plan).
- Tests : un cas worktree (`.git` fichier) qui pose le hook dans le dossier commun.

## Critères d'acceptation

- [ ] `lawgiver bind … <worktree>` pose le hook sans planter (dossier de hooks du dépôt commun).
- [ ] En dépôt normal, le comportement est **inchangé** (hook dans `.git/hooks`, tests `apply.test.ts`
      / `apply-merge.test.ts` verts).
- [ ] La garde F1 reste effective pour tous les fichiers du plan ; seuls les hooks ont l'exception,
      étroite et testée.

## Comment vérifier

```bash
cd products/mega-city && pnpm test   # dont un nouveau cas worktree pour poseHook
# et un bind réel depuis un worktree ne plante plus
```

## Notes / décisions

- Découvert en bindant vectorz sur lui-même (fiche 20261007115129448) depuis un worktree. Pour
  vectorz, le hook `commit-msg` **existe déjà** (partagé via le `.git` commun), donc l'échec était
  sur une écriture **redondante** — mais un projet neuf bindé depuis un worktree, lui, n'aurait pas
  son hook. D'où la fiche.
