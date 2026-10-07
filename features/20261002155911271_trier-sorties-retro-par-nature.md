---
id: "20261002155911271"
title: "Trier les sorties de rétro par nature : aligner ADR-0054, ezk-retro et .rules/"
type: chore
priority: P2
product: mega-city
milestone: rationalisation
version:
labels: [retro]
status: idea
pr:
evidence: none # documentation de méthode, pas d'écran
created: 2026-10-02
---

# 20261002155911271 — Trier les sorties de rétro par nature

**En clair.** Trois textes de la méthode disent des choses différentes sur ce que produit une rétro :
l'ADR-0054 dit « des fiches », le skill `ezk-retro` range des règles directement, et le README
`.rules/` d'un projet range des règles « en observation ». On les aligne sur un seul tri : ce qui
**se construit** devient une fiche, ce qui **se discipline** devient une règle en observation, ce qui
**récidive** fait +1 sur une règle existante.

**Si tu arrives frais.** Une *règle en observation* (`buffered`) est écrite mais pas appliquée ; elle
s'active quand le problème revient. L'*ADR-0054* sépare fiche, sprint et session, et dit que la rétro
produit des fiches groomées au planning suivant.

## Contexte / Problème

Question du PO pendant la rétro muti du 2026-10-02 : « faut-il créer des règles tout de suite, ou des
fiches à groomer ? ». Les quatre lentilles ont convergé sur le tri par nature, et sur un constat : le
tampon d'observation est le garde-fou qui permet d'écrire une règle sans attendre un planning. Tant
que les trois textes divergent, deux rétros peuvent ranger la même sortie de deux façons.

## Proposition

- ADR-0054 : remplacer « la rétro produit des fiches » par le tri par nature.
- `ezk-retro`, temps 5 : écrire le même tri (fiche, règle en observation, +1).
- Gabarit du README `.rules/` des projets hôtes : rappeler ce tri.

## Critères d'acceptation

- [ ] Les trois textes énoncent le même tri, dans les mêmes mots.
- [ ] `ezk-retro` donne un exemple pour chaque branche du tri (construit, discipline, récidive).

## Comment vérifier

Relire les trois passages côte à côte ; la rétro suivante range ses sorties sans ambiguïté.
*(Bloc provisoire, précisé au grooming.)*

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P2. Le dev
  voulait P3 (pur alignement de textes) ; la QA, P2 (plus on attend, plus les rétros divergent).
- Version V0.6 proposée par le pilote ; à confirmer au planning.
