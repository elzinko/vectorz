---
id: "20261002155911271"
title: "Trier les sorties de rétro par nature : aligner ADR-0054, ezk-retro et .rules/"
type: chore
priority: P2
product: mega-city
milestone: parked
version:
labels: [retro]
status: idea
pr:
evidence: none # documentation de méthode, pas d'écran
created: 2026-10-02
blocked: attend-panel — parké hors version par auto-groom le 2026-10-15
---

# 20261002155911271 — Trier les sorties de rétro par nature

**En clair.** Trois textes de la méthode disent des choses différentes sur ce que produit une rétro :
l'ADR-0054 dit « des fiches », le skill `ezk-retro` range des règles directement, et le README
`.rules/` d'un projet range des règles « en observation ». On les aligne sur un seul tri : ce qui
**se construit** devient une fiche, ce qui **se discipline** devient une règle en observation, ce qui
**récidive** fait +1 sur une règle existante. Le tri a **deux axes** : la *nature* (fiche vs règle)
**et** la *destination* — une friction du produit va au backlog du projet hôte, une friction de la
méthode va dans vectorz.

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
- `ezk-retro`, temps 5 : **nommer le backlog cible** selon la nature de la friction — produit →
  backlog du projet hôte (`--root <projet>`), méthode → vectorz. Aujourd'hui le temps 5 range
  « via `/ezk-backlog add` » sans dire lequel : c'est le trou que cette puce bouche.
- Gabarit du README `.rules/` des projets hôtes : rappeler ce tri.

## Critères d'acceptation

- [ ] Les trois textes énoncent le même tri, dans les mêmes mots.
- [ ] `ezk-retro` donne un exemple pour chaque branche du tri (construit, discipline, récidive).
- [ ] Une friction **produit** surgie en rétro produit une fiche dans le backlog du **projet hôte**,
  pas dans vectorz ; une friction **méthode** va dans vectorz.

## Comment vérifier

Relire les trois passages côte à côte — ADR-0054, `ezk-retro` temps 5, gabarit README `.rules/` — et
vérifier qu'ils énoncent le **même tri dans les mêmes mots** (construit → fiche, discipline → règle en
observation, récidive → +1) et nomment le même axe destination (produit → backlog du projet hôte,
méthode → vectorz). Un test de la suite shell fige la phrase-clé du tri et casse si l'un des trois diverge.

```bash
pnpm --dir products/mega-city test:scripts
```

## Notes / décisions

- Origine : rétro muti du 2026-10-02 (capture muti
  `docs/captures/2026-10-02-retro-frictions-outillage-cross-repo.md`). Décision PO ✅, P2. Le dev
  voulait P3 (pur alignement de textes) ; la QA, P2 (plus on attend, plus les rétros divergent).
- Version V0.6 proposée par le pilote ; à confirmer au planning.
- **Grooming 2026-10-13** : la fiche touche 3 surfaces de texte (ADR-0054, `ezk-retro`, gabarit
  `.rules/`), au-delà du seuil de 2. Elle **reste entière** : le but est que les trois disent la même
  chose aux mêmes mots ; les découper casserait l'alignement visé. Justification explicite au titre de
  la règle `token-economy/fiche-tient-dans-un-sprint`.
- Grooming 2026-10-11 (PO) : ajout de l'axe **destination** (produit → backlog du projet hôte,
  méthode → vectorz) en plus du tri par nature. Déclencheur : rétro muti du 2026-10-11 rangée
  entièrement dans vectorz, le PO a demandé où devait atterrir une friction produit.
- **Run v0.16 autonome 2026-10-14 — sautée, à re-groomer (arbitrage produit).** En voulant
  construire, le pilote a buté sur une divergence entre la fiche et la réalité du code :
  - La 3ᵉ surface à aligner — « le README `.rules/` d'un projet qui range des règles *en
    observation* » — **n'existe nulle part dans le dépôt** (aucun gabarit `.rules/`, aucun README
    de règles hôte ; le mot « .rules/ » n'apparaît dans aucun doc/skill).
  - Le **concept « règle en observation / buffered »** (écrite mais pas appliquée, activée au retour
    du problème) **n'est implémenté par aucun outil**. `ezk-retro` temps 5 écrit des règles
    **vivantes** dans `rules/<cat>/` + un bundle, pas un tampon.
  - Donc écrire « discipline → règle en observation » dans `ezk-retro` et l'ADR décrirait un
    **comportement inexistant** (anti-pattern « livré ≠ tourne »).
  - **Décision à prendre par le PO** (hors chore autonome) : soit (a) reformuler le tri sur ce que
    la méthode **fait vraiment** (discipline → règle vivante `rules/` + bundle, retirable ; pas de
    tampon), et aligner ALORS les 2 surfaces réelles (ADR-0054 + `ezk-retro`) ; soit (b) ficher à
    part la **construction du tampon « en observation »** (nouvel état de cycle de vie d'une règle +
    gabarit `.rules/`), puis aligner les 3 textes une fois le mécanisme livré.
