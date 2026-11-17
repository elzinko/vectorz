---
id: "20261114131612572"
title: "Les objectifs publiés comme objets, avec nom, fiches livrées et versions"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [contrat, theme:mission-control]
status: ready
blocked:
pr:
evidence: none # un contrat publié, aucun écran modifié
created: 2026-11-14
---

# 20261114131612572 — Les objectifs publiés comme objets, avec nom, fiches livrées et versions

**En clair.** La maquette de mission control montre chaque objectif avec son nom en clair, les fiches
qu'il a livrées et les versions qui les ont emportées. Aujourd'hui la méthode publie seulement un
identifiant technique, des comptes et les fiches encore à faire : un objectif terminé apparaît sans
aucune fiche. La méthode publie l'objectif comme un objet complet ; l'écran n'a plus rien à deviner.

**Si tu arrives frais.** Un « objectif » est ce que la méthode appelle `milestone` : le lot de fiches
qu'on prépare ensemble (ADR-0083). Mission control est l'écran de cop1. Il lit les JSON que la
commande `ezk` publie et n'en déduit rien lui-même (ADR-086).

## Contexte / Problème

Ce que l'écran attend (maquette du 14 novembre, pages Objectifs, Un objectif, Vue d'ensemble,
Fiches, Fiche et Version) :

- pour chaque objectif : son nom en clair, ses fiches livrées, les versions qui les ont emportées ;
- pour chaque fiche livrée : son objectif, ses labels, le sprint qui l'a livrée.

Ce que le code publie aujourd'hui :

- `ezk board show --json` publie `milestones[]`. Chaque entrée porte `milestone`, `status`, `total`,
  `shipped`, `counts` et `children`.
  `products/mega-city/src/core/board-contract.ts:54-61`
- `children` ne liste que les fiches encore actives. Un objectif terminé sort avec `children: []`.
  Le 14 novembre, sur ce dépôt : `fondation` compte 9 livrées sur 9 et `children` vide.
  `products/mega-city/src/core/avancement-data.ts:171-202`
- Le nom en clair n'existe pas dans le contrat. « Le board dit vrai », « Préparer une milestone »,
  « La méthode tient debout » ne vivent que dans des lignes en gras de `features/PLAN.md`, de la
  forme ``**Milestone `board` — « Le board dit vrai »**`` (lignes 60, 71, 98, 104, 112 et 116 au
  14 novembre ; ce fichier curé bouge). La méthode lit les titres `##` et les puces de ce fichier,
  pas ces lignes en gras : elle ne publie aucun nom. `products/mega-city/src/backlog/plan-sections.ts:49-66`
- `ezk backlog show --json` publie `livrees[]`. Chaque entrée porte `id`, `title`, `priority`,
  `version` et `pr`, rien d'autre.
  `products/mega-city/src/core/fiche-detail.ts:62-68`
  Le loader lit bien `milestone` et `labels` de chaque fiche ; le résumé ne les garde pas.
  `products/mega-city/src/loaders/fiches.ts:14-32`
- Aucune fiche ne porte de champ `sprint`. Le lien entre un sprint et ses fiches n'existe que dans
  le « Lot scellé » de chaque compte rendu de sprint. La méthode sait déjà le lire.
  `products/mega-city/src/core/sprint-report-summary.ts:69-77`

Hors de cette fiche : `parked` est encore publié comme un objectif (84 fiches le 14 novembre). C'est
un changement de sens, porté par
[« parked » n'est plus un pseudo-objectif](20261114131614612_parked-n-est-plus-un-pseudo-objectif.md).

## Proposition

Un ajout de champs, sans changement de sens. Les contrats `board-show` et `backlog-show` restent en
`schema_version: 1` : un champ ajouté ne change pas le numéro (règle 1 du contrat `board-show`, que
`backlog-show` reprend).

1. `ezk board show --json` : chaque entrée de `milestones[]` gagne trois champs.
   - `nom` : le nom en clair, `''` tant qu'il n'est pas déclaré.
   - `livrees[]` : les ids des fiches livrées de l'objectif. `children` garde les actives.
   - `versions[]` : les versions distinctes de ces fiches livrées.
2. `ezk backlog show --json` : chaque entrée de `livrees[]` gagne trois champs.
   - `milestone` et `labels`, déjà lus par le loader.
   - `sprint` : le sprint dont le lot scellé cite la fiche, `null` sinon. Aujourd'hui c'est le slug
     du compte rendu. Ce sera son numéro continu quand
     [Le sprint se publie avec son numéro continu, son but et sa branche](20261114131612204_sprint-publie-numero-but-branche.md)
     l'aura publié.
3. Où vit le nom. Décision du PO du 14 novembre : le nom en clair vit dans le front-matter de
   l'objet milestone lui-même, pas dans `PLAN.md`. Pas de fichier `milestones.yml`. `PLAN.md` reste
   un fichier d'ordonnancement orienté LLM, pas la source des noms.
   Aujourd'hui une milestone n'est pas un fichier : l'ADR-0083 (décision 3) dit « aucun objet
   milestone persistant ». La forme de cet objet est tranchée par le panel de
   [Trancher la coupe](done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md).
   Une forme possible, à titre d'exemple : un petit fichier markdown par objectif, avec un
   front-matter `milestone:` et `nom:`, dans un dossier dédié de `features/`.
4. Ordre de construction. Les points 1 et 2 ne dépendent d'aucune décision : ils partent d'abord,
   `nom` restant `''`. Le point 3 attend le panel.

Hors périmètre : retirer `parked` de `milestones[]` (fiche sœur, liée plus bas) ; tout changement
d'écran côté cop1 ; le numéro continu du sprint (la fiche liée au point 2 le porte).

Voisines :

- [Mission control montre le pilotage](done/20261102123552182_mission-control-montre-le-pilotage.md)
  a livré l'avancement par milestone.
- [La vue Fiches ne montre jamais les fiches livrées](done/20261103191932064_vue-fiches-ne-montre-pas-les-livrees.md)
  a ajouté `livrees[]` en résumé.
- [Vue « Plan » dans le board](done/20260825213807501_vue-plan-ordre-travail.md) a appris à la
  méthode à lire les sections de `PLAN.md`.
- [Séquencer par milestone + dépendances](20261016081021364_sequencer-par-milestone-dependances.md)
  traite la milestone comme unité de séquence, pas sa publication.

## Critères d'acceptation

- [x] Chaque entrée de `milestones[]` de `ezk board show --json` porte `nom`, `livrees[]` et
      `versions[]`, en plus de `children`. Un objectif entièrement livré a `children` vide et
      `livrees` pleine.
- [x] `nom` est lu d'une source déclarée par la méthode et vaut `''` quand il n'est pas déclaré. La
      méthode ne le lit jamais dans `PLAN.md`.
- [x] Chaque entrée de `livrees[]` de `ezk backlog show --json` porte `milestone`, `labels` et
      `sprint`. `sprint` vaut `null` quand aucun lot scellé ne cite la fiche.
- [x] Les deux contrats restent en `schema_version: 1`. Leur schéma et leur exemple publiés sont
      régénérés et décrivent les nouveaux champs.
- [x] Sur le dépôt du 14 novembre, `fondation` publie neuf ids dans `livrees[]`, et la somme des
      `livrees[]` de tous les objectifs vaut le nombre de fiches livrées qui portent un objectif.

## Comment vérifier

```bash
R="$(git rev-parse --show-toplevel)"
ezk --root "$R" board show --json \
  | jq '.milestones[] | {milestone, nom, shipped, livrees: (.livrees | length), versions}'
ezk --root "$R" backlog show --json | jq '.livrees[:3][] | {id, milestone, labels, sprint}'
# le schéma et l'exemple publiés sont à jour (échoue s'ils ne le sont plus)
pnpm --dir products/mega-city board:contract
pnpm --dir products/mega-city test -- \
  src/core/__tests__/avancement-data-milestones.test.ts \
  src/core/__tests__/sprint-report-summary.test.ts \
  src/__tests__/board-contract.test.ts \
  src/__tests__/backlog-show.test.ts
```

## Glossaire

- `objectif` / `milestone` — le lot de fiches qu'on prépare ensemble ; `milestone:` est le champ de la
  fiche qui le nomme.
- `contrat` — un JSON publié par `ezk … --json`, décrit par un schéma versionné sous
  `products/mega-city/contracts/`.
- `lot scellé` — la liste des fiches livrées, écrite dans le compte rendu d'un sprint à sa clôture.

## Notes / décisions

- Critères prouvés le 2026-11-17 par ezk-reviewer (GO) : champs présents et objectif livré à `children` vide ; `nom` lu de `features/milestones/<slug>.md`, `''` sinon ; `milestone`, `labels`, `sprint` sur chaque livrée ; `schema_version` 1 et contrats régénérés sans dérive ; `fondation` = 9 ids, somme des `livrees` = 114 = livrées portant un objectif. Ouvert non bloquant : deux déclarations du même objectif, la dernière l'emporte en silence.

- Origine : [la carte des écarts maquette ↔ code ↔ backlog du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart A6, volet additif.
- Décision du PO du 14 novembre (n° 2) : le nom en clair d'un objectif vit dans le front-matter de
  l'objet lui-même ; pas de `milestones.yml` ; `PLAN.md` n'est pas la source des noms. À confirmer
  par le panel adverse avant d'être écrite en ADR : elle touche la décision 3 de l'ADR-0083.
- Dépend de [Trancher la coupe : committer le dossier du 10 novembre, panel adverse, ADR-0088](done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md)
  pour la forme de l'objet. Les champs calculés (points 1 et 2) n'en dépendent pas.
- Fiche sœur, à faire après celle-ci :
  [« parked » n'est plus un pseudo-objectif](20261114131614612_parked-n-est-plus-un-pseudo-objectif.md).
- Deux corrections de la contestation du 14 novembre. `filtres.milestones` exclut déjà `parked` :
  il dérive des fiches actives, qui excluent les parkées (`avancement-data.ts:157` et `:215`).
  `livrees[].sprint` n'a pas besoin d'un champ de fiche : il se calcule depuis les lots scellés.
- Risques : deux comptes rendus citent la même fiche (prendre le plus récent, l'écrire dans le
  schéma) ; un lot scellé cite une fiche absente de `done/` (la fiche fait foi, `sprint` n'apparaît
  que sur une livrée).
- ADR : [ADR-0083](../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md) ;
  [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md) ;
  règles du contrat : [`board-show/README.md`](../products/mega-city/contracts/board-show/README.md).
