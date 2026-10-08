---
id: "20261008072305169"
title: "Au close, le sprint écrit et committe son compte rendu"
type: feature
priority: P1
product: mega-city
milestone: compte-rendu-sprint
version: v0.7.0
labels: [sprint, archive]
status: ready
pr:
evidence: none # scripts et skills, pas d'écran
created: 2026-10-08
split_from: "20261005100027029"
---

# 20261008072305169 — Au close, le sprint écrit et committe son compte rendu

**En clair.** Quand `ezk-sprint close` scelle l'incrément, la méthode écrit un compte rendu court et
toujours au même format, puis le committe. Il ne garde que **ce** sprint. Ainsi, une rétro jouée dans
une autre session, des jours plus tard, retrouve ce qui s'est passé — même si le dossier de travail a
été recyclé entre-temps.

**Si tu arrives frais.** Un *sprint* est un lot de fiches, ouvert par `ezk-sprint start` et fermé par
`ezk-sprint close`. Le *rapport de sprint* (`sprint:report`, déjà livré) calcule des faits (durée,
jetons, fiches livrées) sous `docs/sprints/`. Une *session* est le temps passé dans Claude Code.

## Contexte / Problème

Rien ne garde de façon sûre ce qui s'est passé dans un sprint : `SPRINT.md` n'est jamais committé et
mêle des sessions héritées quand l'application recycle le dossier de travail (vu trois fois les 2026-10-03
et 04, encore le 2026-10-05). Le rapport de sprint existe mais n'est jamais lancé au `close`, et il ne
sort ni le lot ni les décisions.

Cette fiche est le **producteur** du compte rendu. Sa sœur [la rétro et l'archive lisent les comptes
rendus](20261008072306360_retro-et-archive-lisent-les-comptes-rendus.md) en est le consommateur.

## Valeur — ce que coûte de ne rien faire

- Une rétro jouée dans une autre session ne voit que ce que la mémoire de l'agent a gardé : un sprint
  sans note est un sprint oublié.
- Les mesures de coût et de qualité, d'un sprint à l'autre, ne s'accumulent nulle part.

## Proposition (conception — avis de l'architecte, 2026-10-08)

On ne crée **ni** nouvel extracteur **ni** nouveau mécanisme de commit. Voir
[ADR-0068](../products/mega-city/docs/adr/0068-compte-rendu-de-sprint-faits-rapport-commit-archive.md).

1. **L'extracteur est `sprint:report`, étendu** (`bin/sprint-report.ts` + domaine `src/sprint-metrics/`) :
   il sort en plus le **lot scellé** (ids + résultat `[x]`/`[~]`) dans son `.json`. Le skill `ezk-sprint`
   rédige le compte rendu narratif sur un gabarit neuf
   `skills/ezk-sprint/references/sprint-report-template.md` (frontière ADR-0001 : script = faits, skill =
   rédaction ; nouvelle instance de `readable-deliverable-trio`).
2. **Le périmètre « ce sprint »** vient du lot que `close` scelle (section `## Lot`) + de la fenêtre de
   supervision `sprint-<slug>-checkpoint` — **jamais** de `## Incréments scellés de la session` (zone
   polluée par héritage).
3. **Le commit** réutilise le mécanisme d'`archive-commit.sh` (worktree jetable issu de `main`),
   généralisé en helper partagé `commit-doc-via-worktree.sh` dont `ezk-archive` et `ezk-sprint`
   dépendent tous deux. Mode local = squash-merge local ; mode PR = branche `docs/sprint-report-*` +
   commande d'ouverture ; jamais poussé, jamais injecté dans la PR d'une story (ADR-0049).
4. **Lieu : `docs/sprints/`** (la fondation `scrum:` qui rendrait ça configurable est en V0.9, après).

## Critères d'acceptation

- [ ] Après `sprint.sh close` (incrément scellé), `docs/sprints/<date>-sprint-<slug>.md` existe, est
      committé, et porte les sections du gabarit.
- [ ] Le compte rendu ne contient que le lot, les décisions et les galères de ce sprint, même quand le
      `SPRINT.md` du dossier hérite d'une autre session (cas reproduit) : le périmètre vient du lot
      scellé + de la fenêtre de supervision, jamais de `## Incréments scellés de la session`.
- [ ] Les faits (lot, commits ou PR, dates) viennent de `sprint:report` (étendu), pas d'une recopie à la
      main.
- [ ] Un sprint abandonné (`close --abandon`) laisse aussi un compte rendu, avec sa raison.

## Comment vérifier

```bash
cd products/mega-city && pnpm test:scripts
bash products/mega-city/skills/ezk-sprint/scripts/sprint.sh close   # → écrit et committe le compte rendu
ls docs/sprints/
```

## Notes / décisions

- Fille **producteur** du découpage de la fiche source (décision PO 2026-10-08, ADR-0068). Sœur
  consommateur : [20261008072306360](20261008072306360_retro-et-archive-lisent-les-comptes-rendus.md).
- Dépendances constatées le 2026-10-08 (reprises de la source) : la clôture-committe-l'archive est
  livrée (ADR-0063, base du helper de commit) ; le rapport de sprint est livré (base de l'extracteur) ;
  la fondation `scrum:` est en V0.9, donc non bloquante.
- **Taille — pourquoi elle reste entière.** 4 critères ; elle touche 3 surfaces (l'extracteur
  `sprint:report`, le skill `ezk-sprint`+gabarit, le helper de commit partagé), au-dessus du seuil de
  2. On ne découpe pas davantage : les trois forment **une seule tranche verticale** pour une seule
  capacité — « le `close` produit un compte rendu committé ». Découper plus donnerait des fiches qui
  ne shippent pas seules (un extracteur étendu que rien n'appelle, un helper sans second appelant). La
  vraie ligne de fracture — producteur vs consommateurs — a déjà été prise (fille B).
