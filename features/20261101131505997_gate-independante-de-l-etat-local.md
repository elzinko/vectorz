---
id: "20261101131505997"
title: "La gate ne dépend ni de l'index généré ni du retard sur GitHub"
type: bug
priority: P2
product: mega-city
milestone: qualite
version:
labels: [gate, tests, worktree]
status: idea
pr:
evidence: none # outillage et documents, sans écran
created: 2026-11-01
---

## En clair

Dans un worktree neuf, la gate est rouge alors que le code est juste. Deux fichiers de tests lisent
l'index `features/BACKLOG.md`, que git ne suit plus. Deux autres échouent quand la branche a du retard
sur GitHub. Cette fiche rend la gate indépendante de ces deux états du poste.

## Contexte / Problème

Constaté au run du 2026-11-01, sprints 2 et 3 :

- `src/__tests__/ezk-cwd-root.test.ts` et `src/__tests__/project-root-bins.test.ts` lisent
  `features/BACKLOG.md` du dépôt. Ce fichier n'est plus versionné (ADR-0075) : un worktree neuf ne l'a
  pas, et ces tests échouent sur `ENOENT`. Contournement actuel : lancer `bin/regen-backlog.sh` avant
  la gate.
- `src/__tests__/ezk-launcher.test.ts` et `src/__tests__/ezk-local-host-project.test.ts` comparent le
  stderr du lanceur. Quand la branche a du retard sur `origin/main`, le lanceur y ajoute « le code
  d'ezk a N commits de retard », et les deux tests échouent.

## Valeur

Pour le dev qui construit dans un worktree neuf : une gate rouge doit vouloir dire « le code est
faux », jamais « le poste n'est pas préparé ». Moins de faux rouges, moins de temps perdu à chercher.

## Proposition

À préciser au grooming.

- Les tests qui lisent l'index le génèrent dans leur propre dossier jetable, ou tolèrent son
  absence (s'il n'existait pas, il n'existe toujours pas après).
- Les tests qui comparent le stderr du lanceur coupent l'avertissement de retard (variable
  d'environnement ou option dédiée), au lieu de dépendre de l'état de `origin/main`.

## Critères d'acceptation

- [ ] Dans un worktree neuf, sans `regen-backlog.sh`, `pnpm test` est vert.
- [ ] Avec une branche en retard sur `origin/main`, `pnpm test` est vert.
- [ ] Aucun test ne lit `features/BACKLOG.md` du vrai dépôt sans le créer lui-même.

## Comment vérifier

```bash
git worktree add /tmp/wt-gate -b essai-gate main && cd /tmp/wt-gate && pnpm install --frozen-lockfile && cd products/mega-city && pnpm test
```

## Notes

- Née de la rétro légère du 2026-11-01 (P3 de la rétro), acceptée par le PO le même jour :
  [rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md).
- Priorité P2 par défaut, comme les fiches de la rétro précédente : à ajuster au grooming.
