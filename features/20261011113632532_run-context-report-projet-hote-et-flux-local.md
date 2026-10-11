---
id: "20261011113632532"
title: "ezk run context / run report : viser le projet hôte (pas le dépôt de méthode) + accepter le flux local github:false"
type: bug
priority: P2
product: mega-city
labels: [run, dx, host-project, mode-local]
status: idea
pr:
evidence: none
created: 2026-10-11
merged_from: ["20261004211038053", "20261010235330118"]
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
- [ ] En mode local, un `local (<sha>)` dont le sha est sur le `main` local est **accepté et rendu** ; un sha **absent** du `main` local sort en **écart (code 1)**, le sha nommé.
- [ ] Une fiche `mergée` sans PR ni `local (<sha>)` est **toujours refusée**.
- [ ] La comparaison « déclaré vs GitHub » de `run report` est **sautée** proprement quand il n'y a pas de PR GitHub.
- [ ] Le mode GitHub (`#<numéro>`) ne change pas ; `--no-github` dans un dépôt GitHub prend le déclaré tel quel, sans regarder le `main` local.
- [ ] Un test couvre une livraison locale acceptée en `--no-github`.

## Comment vérifier

```bash
cd <projet-hote> && ezk run context          # base/worktree = le projet, pas vectorz
ezk run report --pr "local (abc1234)" --fiche "…"   # accepté en github:false
```

## Notes / décisions

- Origine : rétro 2026-10-11, propositions P2. Deux symptômes liés (mauvais dépôt + flux local) regroupés car même surface (`bin/run-context.ts`, `bin/run-report.ts`, `src/io/run-facts.ts`).
- **Fusion (2026-10-11)** : absorbe deux fiches doublonnant le volet « run report en local » — « run report décrit un run livré en local, sans n° de PR » (20261004211038053, rétro run cockpit V0.6) et « run report accepte `local (<sha>)` » (20261010235330118, rétro run règles composables). Leurs critères fins sont repris ci-dessus.
- Implémentation de référence : `products/mega-city/bin/run-report.ts` (validation du champ PR), `bin/run-context.ts`.
