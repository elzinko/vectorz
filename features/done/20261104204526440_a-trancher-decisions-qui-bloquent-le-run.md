---
id: "20261104204526440"
title: « À trancher » — la méthode publie les décisions qui bloquent le prochain run, mission control les affiche
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control, theme:autonomie]
status: superseded
pr: "superseded — reprise par la fiche 20261114131612944 (la cloche)"
evidence: before-after
created: 2026-11-04
---

# 20261104204526440 — « À trancher » : les décisions qui bloquent le prochain run

> **🗑️ Clôturée le 2026-11-14 — `superseded`.** La carte « À trancher » de la Vue d'ensemble a disparu
> de la maquette au profit de la cloche d'alertes. Le PO a tranché le 14 novembre : la cloche absorbe
> cette fiche. Son cœur, la décision attendue par raison de blocage, vit désormais dans
> [`ezk now --json` publie les alertes de la cloche, dont les décisions à trancher](20261114131612944_ezk-now-json-alertes-de-la-cloche.md).
> Rien n'est supprimé ; la vélocité n'est pas gonflée.

**En clair.** Le run autonome du 2026-11-04 s'est arrêté sur « plus aucune fiche tirable ». Le
backlog n'était pas vide : chaque fiche de tête attendait une décision du PO. Rien ne montre ces
décisions en un seul endroit. La méthode publie la liste des fiches bloquées par un geste humain,
avec la décision attendue pour chacune. Mission control l'affiche en carte « À trancher » sur la Vue
d'ensemble. Quelques minutes de décisions suffisent alors à relancer un run.

**Si tu arrives frais.** Une fiche bloquée porte un drapeau `blocked:` avec une raison typée
(`deferred`, `panel`, `design`, `oversized`…). Mission control est l'écran de cop1. Il lit ce que la
méthode publie par `ezk … --json`, il ne déduit rien lui-même (ADR-086).

## Contexte / Problème

- Le 2026-11-04 à 11 h 45, `ezk backlog plan-lot` répond « aucune fiche prête », avec et sans
  `--all-versions`. Les quatre têtes du plan portent `blocked: deferred` :
  - [Rejouer ou retirer les guides de l'ancien écran](../20261103161632234_rejouer-ou-retirer-guides-ancien-ecran.md)
  - [Faire expirer une preuve du carnet](../20261102182259680_carnet-expiration-quand-le-code-change.md)
  - [ezk-scout propose aussi des améliorations](../20261102183114656_scout-lentille-ameliorations-fiches-feature.md)
  - [Renommer le dossier de contrat](../20261101162826995_renommer-le-dossier-contrat-vectorz.md)
- Le reste du stock compte une centaine d'idées. Beaucoup attendent un panel, une maquette ou un
  découpage.
- Pour savoir quoi trancher, le PO ouvre les fiches une par une. Le run ne peut pas trancher à sa
  place : ce sont des décisions humaines.
- La méthode a déjà le texte de chaque raison : `ESCALATION_BY_REASON`, dans
  `products/mega-city/src/backlog/run-eligibility.ts`. `ezk board show --json` publie le compte des
  fiches bloquées, pas la décision attendue.

## Proposition

- `ezk board show --json` publie une liste `aTrancher`. Une entrée par fiche à faire qui porte un
  drapeau `blocked:` : son id, son titre, sa raison, la décision attendue. La décision vient de la
  table des raisons existante. L'ordre est celui du plan.
- Mission control affiche une carte « À trancher » sur la Vue d'ensemble. Une ligne par fiche : le
  titre, puis la décision attendue. Sans fiche à trancher, la carte dit « rien ne t'attend ».
- Hors périmètre : trancher depuis l'écran. La carte montre ; le geste reste dans le chat ou en
  commande.
- Voisine, distincte : la page d'accueil par projet,
  [une ligne par projet](../20261002115451451_page-une-ligne-par-projet.md). Elle pourra reprendre
  ce compte plus tard.

## Critères d'acceptation

- [ ] `ezk board show --json` porte `aTrancher`, décrit dans le contrat `contracts/board-show`. Chaque
  entrée a un id, un titre, une raison et une décision attendue.
- [ ] Une raison inconnue donne « raison non tracée, à requalifier », jamais une décision vide.
- [ ] Une fiche prête sans drapeau, ou une fiche livrée, n'apparaît jamais dans la liste.
- [ ] La Vue d'ensemble affiche la carte, dans l'ordre de la liste, chaque titre en lien vers sa fiche.
- [ ] Sur le backlog de vectorz du 2026-11-04, les quatre têtes différées ouvrent la carte.

## Comment vérifier

```bash
ezk --root "$(git rev-parse --show-toplevel)" board show --json | jq '.aTrancher[:5]'
```

- Tests : le cœur qui choisit les fiches et leur décision (vitest, mega-city), la carte (vitest, web
  de cop1).
- Preuve d'écran : la Vue d'ensemble avant (pas de carte) et après (la carte), dans
  `docs/pr-evidence/20261104204526440/`.

## Notes

- Origine : bilan du run du 2026-11-04, demandé par le PO après l'arrêt.
