---
id: "20261011113632532"
title: "ezk run context / run report : viser le projet hôte (pas le dépôt de méthode) + accepter le flux local github:false"
type: bug
priority: P2
product: vectorz
labels: [run, dx, host-project]
status: idea
pr:
evidence: none
created: 2026-10-11
---

# 20261011113632532 — run context / run report : projet hôte + flux local

## En clair

Lancés depuis un projet hôte (muti), `ezk run context` et `ezk run report` se trompent de dépôt :
ils affichent les faits de **vectorz** (la méthode), pas du projet qu'on construit. Et `run report`
**refuse** le flux local sans PR GitHub (il exige `--pr '#<numéro>'`), donc il est inutilisable sur
un projet `github: false`. Cette fiche demande de les faire refléter le **projet hôte** et accepter
une **référence locale**.

## Contexte / Problème

Vécu en session muti 2026-10-10/11 (rétro [`2026-10-11-retro-outillage-et-autonomie-agent`](../docs/captures/2026-10-11-retro-outillage-et-autonomie-agent.md)) :

- `ezk --root <vectorz> run context` depuis le worktree muti a affiché `Base origin/main = <sha vectorz>`
  et `Worktree … /…/vectorz` — alors que le run construit **muti**. Le bloc d'ouverture d'un run
  autonome désigne donc le mauvais dépôt (confusion racine-de-méthode ↔ racine-de-projet, cf. `--root`).
- `ezk run report` a été **refusé** : il n'accepte que `--pr` au format `#<numéro>`. En `github: false`
  (muti : merge local sur main, pas de PR), aucune ligne de fiche n'est émissible.

## Proposition

- **run context / run report lisent les faits du projet HÔTE** (le dépôt du `cwd`/`INIT_CWD`), pas du
  dépôt de méthode désigné par `--root` : base `origin/main`, retard de HEAD, worktree **du projet**.
- **run report accepte une référence locale** pour `--pr`, comme `backlog ship` accepte `local (<sha>)` —
  pour couvrir `github: false`.

## Critères d'acceptation

- [ ] `ezk run context` lancé depuis un projet hôte montre l'`origin/main` et le worktree **du projet**, pas de vectorz.
- [ ] `ezk run report` accepte une ligne de fiche avec `--pr "local (<ref>)"` (pas seulement `#<numéro>`), et ne refuse pas un projet `github: false`.
- [ ] La comparaison « déclaré vs GitHub » de `run report` est **sautée** proprement quand il n'y a pas de PR GitHub.

## Comment vérifier

```bash
cd <projet-hote> && ezk run context          # base/worktree = le projet, pas vectorz
ezk run report --pr "local (abc1234)" --fiche "…"   # accepté en github:false
```

## Notes / décisions

- Origine : rétro 2026-10-11, propositions P2. Deux symptômes liés (mauvais dépôt + flux local) regroupés car même surface (`bin/run-context.ts`, `bin/run-report.ts`, `src/io/run-facts.ts`).
