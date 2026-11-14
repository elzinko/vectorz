---
id: "20261114131614612"
title: "« parked » n'est plus un pseudo-objectif ; `ezk backlog park` garde l'objectif d'origine"
type: refactor
priority: P2
product: mega-city
milestone: board
version:
labels: [contrat]
status: idea
blocked:
pr:
evidence: none # un changement de contrat, aucun écran modifié
created: 2026-11-14
---

# 20261114131614612 — « parked » n'est plus un pseudo-objectif ; `ezk backlog park` garde l'objectif d'origine

**En clair.** Quand on met une fiche de côté, la méthode efface son objectif et écrit « parked » à la
place. Résultat : l'écran compte un objectif « parked » de 84 fiches, et une fiche remise en jeu ne
sait plus d'où elle vient. La méthode garde l'objectif d'origine et ne publie plus « parked » comme un
objectif ; le compte des objectifs redevient juste.

**Si tu arrives frais.** Un « objectif » est la `milestone` d'une fiche : le lot qu'on prépare
ensemble (ADR-0083). « Parker » une fiche, c'est la sortir du flux sans la supprimer, par
`ezk backlog park`. Mission control lit les JSON publiés par `ezk` (ADR-086).

## Contexte / Problème

- `ezk backlog park <id> --reason <raison>` vide `version`, met `status: idea`, écrit
  `milestone: parked` et pose `blocked: <raison>`. L'objectif d'origine est perdu : rien ne le garde.
  `products/mega-city/bin/backlog-park.ts:5-9` ; `products/mega-city/src/backlog/park-fiche.ts:48-53`
- La règle « fiche parkée » est unique dans la méthode : `status: idea` et `milestone: parked`.
  `products/mega-city/src/core/fiche-schema.ts:83-84`
- `parked` est un objectif publié. `MILESTONE_ORDER` le liste, et `ezk board show --json` le sort
  dans `milestones[]` comme les autres.
  `products/mega-city/src/core/avancement-data.ts:36-44`
  Le 14 novembre, sur ce dépôt : `milestones[2]` vaut `parked`, 84 fiches, 84 enfants ;
  `comptes.parkees` vaut 84.
- La dette est connue et datée. L'ADR-0083 la nomme : « le `park` écrase la milestone d'origine par
  la valeur magique `parked` », à traiter par une fiche dédiée. `features/PLAN.md:123-124` demande une
  passe de tri du parké (88 fiches à son écriture, 84 le 14 novembre), milestone par milestone,
  depuis les `labels:`. Aucune fiche ne la portait.
- Déjà juste : `filtres.milestones` ne contient pas `parked`. Il dérive des fiches actives, qui
  excluent les parkées.
  `products/mega-city/src/core/avancement-data.ts:157` et `:215`
  Le 14 novembre il vaut `board, cockpit, exploration-app, methode-configurable, qualite`.
- Le bloc « Parkées » de l'index généré repose aussi sur `milestone: parked`.
  `products/mega-city/bin/regen-backlog.sh:203-212`

## Proposition

Un changement de sens, donc une version du contrat : un champ qui change de sens monte
`schema_version` (règle 1 du contrat `board-show`).

1. `ezk backlog park` garde l'objectif d'origine. Forme proposée : un champ
   `parked_from: <milestone d'origine>`, écrit à côté de `milestone: parked`. La règle `isParked` ne
   change pas ; l'index généré non plus.
   - Le loader lit `parked_from` et le schéma de fiche le décrit. Aujourd'hui le validateur ne refuse
     pas un champ inconnu : il contrôle les champs requis, les énumérations et les champs retirés.
     `parked_from` passerait donc sans être lu.
     `products/mega-city/src/backlog/fiche-validator.ts:30` et `:96-98`
   - Une fiche dé-parkée au grooming retrouve son objectif : `milestone` reprend `parked_from`, qui
     est vidé.
   - Alternative, à trancher au build : garder `milestone` intact et poser un drapeau `parked: true`.
     Elle change `isParked`, l'index et le contrat `backlog-show` ; plus lourde.
2. `ezk board show --json` ne publie plus `parked` dans `milestones[]`. Les parkées se lisent par le
   drapeau `parkee` de chaque fiche et par `comptes.parkees`, qui ne change pas.
3. `ezk backlog show <id> --json` publie `parked_from` (`''` si la fiche n'est pas parkée) : l'écran
   peut dire « parkée, venait de board ».
4. `schema_version` du contrat `board-show` passe à 2. Le README du contrat écrit le changement et sa
   date. Mission control lit la version d'abord (règle 2) : il doit apprendre la version 2 dans le
   même lot, sinon il affiche « version inconnue ». C'est un ajustement de lecteur, pas d'écran.

Hors périmètre : la passe de tri des 84 fiches déjà parkées. Elles n'ont pas de `parked_from` ; leur
objectif se retrouve par leurs `labels:` (`PLAN.md:123-124`). C'est un geste de curation du PO, aidé
par cette fiche, pas remplacé par elle. Hors périmètre aussi : le nom en clair et les fiches livrées
d'un objectif, portés par
[Les objectifs publiés comme objets](20261114131612572_objectifs-publies-comme-objets.md).

Voisines livrées :

- [La vue Fiches montre les fiches parkées comme des idées](done/20261104090517494_fiches-parkees-montrees-comme-idees.md)
  a posé la règle `isParked` et le drapeau `parkee`.
- [`park` refuse une fiche non groomée](done/20261018234206166_park-refuse-une-fiche-non-groomee.md)
  a posé la garde du geste.

## Critères d'acceptation

- [ ] Après `ezk backlog park <id> --reason <raison>`, la fiche porte `milestone: parked` et
      `parked_from:` avec son objectif d'origine. Le validateur des fiches n'y voit aucune anomalie.
- [ ] Une fiche parkée sans objectif d'origine porte `parked_from:` vide ; le geste ne refuse pas.
- [ ] `ezk board show --json` ne publie plus d'entrée `parked` dans `milestones[]`.
      `comptes.parkees` garde sa valeur (84 sur le dépôt du 14 novembre).
- [ ] `ezk backlog show <id> --json` d'une fiche parkée publie `parked_from` ; `parkee` reste vrai.
- [ ] Le contrat `board-show` passe en `schema_version: 2`. Son README dit ce qui a changé de sens
      et quand. Schéma et exemple sont régénérés.
- [ ] L'index `features/BACKLOG.md` garde son bloc « Parkées », avec le même compte.

## Comment vérifier

```bash
R="$(git rev-parse --show-toplevel)"
# avant : parked est un objectif publié, version 1
ezk --root "$R" board show --json | jq '[.milestones[].milestone], .comptes.parkees, .schema_version'
# après : plus de parked dans milestones[], même compte, version 2
ezk --root "$R" board show --json \
  | jq '([.milestones[].milestone] | index("parked")), .comptes.parkees, .schema_version'
# le geste garde l'origine (sur une copie du dépôt, ou une fiche de test ; une idée non groomée
# exige --after-groom <ref>, garde « tenter avant de parker »)
ezk --root "$R" backlog park <id> --reason deferred \
  && ezk --root "$R" backlog show <id> --json | jq '{milestone, parked_from, parkee}'
ezk --root "$R" backlog check
pnpm --dir products/mega-city board:contract
pnpm --dir products/mega-city test -- \
  src/backlog/__tests__/park-fiche.test.ts \
  src/__tests__/backlog-park-bin.test.ts \
  src/core/__tests__/avancement-data-milestones.test.ts \
  src/__tests__/board-contract.test.ts \
  src/__tests__/fiche-schema-contract.test.ts
```

Pas de preuve d'écran : aucun écran ne change (`evidence: none`).

## Glossaire

- `objectif` / `milestone` — le lot de fiches qu'on prépare ensemble ; `milestone:` est le champ de la
  fiche.
- `parkée` — une idée sortie du flux par `ezk backlog park`, réversible au grooming.
- `contrat` — un JSON publié par `ezk … --json`, décrit par un schéma versionné sous
  `products/mega-city/contracts/`.

## Notes / décisions

- Origine : [la carte des écarts maquette ↔ code ↔ backlog du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart A6, volet « changement de sens ». Séparé de la fiche additive pour ne pas mêler ajout et
  changement.
- Dépend de [Les objectifs publiés comme objets](20261114131612572_objectifs-publies-comme-objets.md).
  Les deux fiches touchent `milestones[]` ; celle-ci passe après, pour que la version 2 du contrat
  porte un seul changement de sens.
- Décision attendue du PO : la forme du drapeau de parkage (`parked_from` à côté de
  `milestone: parked`, ou `parked: true` avec `milestone` intact). La fiche propose la première ; le
  build la confirme.
- À confirmer par le PO : le saut à la version 2 oblige mission control à accepter cette version dans
  le même lot (règle 2). C'est une ligne de lecteur côté cop1, sans écran modifié : pas de fiche à part.
- Risque : un consommateur qui compte les parkées dans `milestones[]` se trompe après le retrait.
  `comptes.parkees` est la source ; le saut de `schema_version` le force à relire.
- Risque : les 84 fiches déjà parkées n'ont pas de `parked_from`. Sans la passe de tri, l'écran les
  montre « parkées, origine inconnue ». Dire « inconnue », jamais inventer.
- ADR : [ADR-0083](../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md)
  (dette nommée) ; [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md) ;
  règles du contrat : [`board-show/README.md`](../products/mega-city/contracts/board-show/README.md).
