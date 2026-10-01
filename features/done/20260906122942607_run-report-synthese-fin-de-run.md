---
id: "20260906122942607"
title: "Run autonome transparent : ce qu'il va faire, puis ce qu'il a fait"
type: chore
priority: P1
product: mega-city
version: V0.4
epic:
depends: []
labels: [sprint]
status: shipped
pr: "#312"
created: 2026-09-06
---

# 20260906122942607 — Run autonome transparent

## En clair

Un run autonome démarre sans dire ce qu'il va faire seul. Il finit sans bilan par fiche. Le PO doit reconstituer à la main ce qui a été livré, et il découvre parfois trop tard que la base était périmée.

Cette fiche ajoute deux blocs. À l'ouverture : le contexte (base fraîche ou non, worktree, qui écrit les fichiers) et le contrat en trois lignes (je merge le vert, je m'arrête sur 4 cas, voici mon plafond de jetons). À la clôture : une ligne par fiche (mergée, PR ouverte, bloquée, sautée), la position de HEAD et les jetons.

> Regroomée le 2026-10-01 sur le reste réel. Les critères des trois fiches absorbées sont intégrés ci-dessous.

## Contexte / Problème

Quatre symptômes de la rétro du 2026-09-05, plus une idée plus ancienne.

- **Base périmée.** Un run a comparé au `main` local au lieu d'`origin/main`.
- **Écriture perdue.** Un sous-agent en worktree secondaire a écrit chez lui, pas chez le pilote.
- **Contrat muet.** Un run auto est parti sans rappeler qu'il merge le vert et où il s'arrête.
- **Bilan dispersé.** Après le run, l'état de chaque fiche reste enfoui dans le fil.
- **Briefing** (idée du 2026-07-06). L'opérateur ne voit pas d'un coup d'œil comment le run travaille.

## Déjà livré (ne pas refaire)

- [x] Les trois règles existent et fixent le fond : [fraîcheur d'`origin/main`](../../products/mega-city/rules/development/run-freshness-origin-main.md), [worktree secondaire](../../products/mega-city/rules/development/worktree-secondary-inline-harvest.md), [merge en auto](../../products/mega-city/rules/development/merge-when-absent-default.md). Il manque de les rendre visibles.
- [x] Le pattern « livrable lisible » (gabarit, extracteur, rendu) est posé : règle `readable-deliverable-trio`.
- [x] Le sprint a son ouverture et sa clôture (`ezk-sprint start` et `close`, [ADR-0054](../../products/mega-city/docs/adr/0054-cloture-sprint-vs-archive-session.md)). Elles portent le sprint, pas le run entier.

## Proposition (POC)

Le pattern gabarit + extracteur + rendu, deux extracteurs.

1. **`run:context`** (ouverture). Il lit les faits : `origin/main` après `git fetch`, le retard `HEAD..origin/main`, principal ou secondaire, branche, mode d'écriture déduit (inline en secondaire, sous-agent sinon). Il rend le contrat en trois lignes d'après les réglages réels : `--mode`, `--delivery`, `--tokens`. Sans remote joignable, il avertit sans bloquer.
2. **`run:report`** (clôture). Il reçoit une ligne par fiche avec ses six champs : état, PR, gate, revue, validation, raison si non mergée. Il refuse une ligne incomplète. Il compare ce qui est déclaré à ce que dit GitHub : une PR déclarée mergée mais ouverte devient un écart, et la commande sort en erreur. Il ajoute HEAD contre `origin/main` et les jetons contre le plafond.
3. **Gabarit** `ezk-product-build/references/run-report-template.md`, avec « En clair », rangé dans la table des instances de la règle `readable-deliverable-trio`.
4. **Skills.** `ezk-product-build` ouvre par le bloc de contexte (étape 0 de la boucle, `status` le réaffiche) et clôt par le RUN-REPORT quand le run a construit plus d'un sprint. `ezk-sprint` affiche le bloc de contexte quand on le lance seul.

## Critères d'acceptation (reste réel)

- [ ] `run:context` affiche la base (sha court et sujet), le retard et sa décision, le worktree (principal ou secondaire, chemin, branche), le mode d'écriture et sa raison.
- [ ] Les trois lignes de contrat reflètent l'état réel : merge du vert en `auto` et `per-feature` (PR laissées ouvertes en `per-epic`, rien d'automatique en `manuel`), les 4 STOP nommés, le plafond de jetons du réglage `--tokens`.
- [ ] Hors ligne ou sans remote, `run:context` avertit et rend la main (code 0).
- [ ] `run:report` rend une ligne par fiche avec les six champs, dans les états `mergée`, `PR-ouverte`, `bloquée`, `sautée`. La raison est obligatoire hors `mergée`.
- [ ] `run:report` signale un écart déclaré contre GitHub et sort en code 1. Avec `--no-github`, il prend le déclaré tel quel et le dit.
- [ ] Le rapport contient la ligne HEAD contre `origin/main` et la ligne jetons contre plafond.
- [ ] Le gabarit existe, ouvre par « En clair » et figure dans la table du trio (test vert).
- [ ] `ezk-product-build` et `ezk-sprint` décrivent l'ouverture et la clôture. Le SKILL dit que le rapport est émis pour tout run auto de plus d'un sprint.
- [ ] Gate locale verte.

## Comment vérifier

```bash
pnpm --dir products/mega-city run:context --mode auto --delivery per-feature --tokens lean
pnpm --dir products/mega-city run:report --no-github --fiche "0080|PR-ouverte|#277|verte|GO|à faire|attend la mise en main de #275"
pnpm --dir products/mega-city exec vitest run src/core/__tests__/run-context.test.ts src/core/__tests__/run-report.test.ts
```

Les deux commandes rendent leur bloc. La preuve par l'usage vient au prochain run auto de deux sprints : la dernière sortie est le RUN-REPORT.

## Suite (hors POC)

- Le plafond de jetons est le réglage (`lean`, `cap`, `full`), pas un nombre. Un plafond chiffré attend une vraie jauge de dépense. Les jetons consommés se passent à la main (`--tokens-used`) ; les lire dans `sprint:report` est une suite.
- Le bloc ne liste ni les règles actives ni l'équipe (idée d'origine du briefing). Il pointe vers `ezk rules` pour les règles.
- Le contrôle automatique « mêmes fiches dans `SPRINT.md` et dans le rapport » : non traité.

## Notes

- Priorité P1. Origine : rétro du 2026-09-05, demande directe du PO.
- Complète la règle [`development/merge-when-absent-default`](../../products/mega-city/rules/development/merge-when-absent-default.md) : le rapport est l'endroit où le blocage de chaque fiche devient visible.

## ⤓ Absorbe (tri du 2026-09-30)

Cette fiche reprend désormais le périmètre de :

- [`20260906122942555`](20260906122942555_preflight-contexte-de-run.md) — Préflight « Contexte de run » — bloc d'ouverture (origin/main, worktree, délégation)  
  _Pourquoi_ : Même sujet : un run autonome transparent.
- [`20260906122942662`](20260906122942662_echo-du-contrat-avant-run-auto.md) — Écho du contrat avant un run auto (opérateur absent)  
  _Pourquoi_ : Même sujet : un run autonome transparent.
- [`0151`](0151-product-builder-briefing-demarrage.md) — ezk-product-build — briefing au démarrage (comment je travaille, avec quelles règles)  
  _Pourquoi_ : Même sujet : un run autonome transparent.

Critères intégrés au grooming du 2026-10-01.
