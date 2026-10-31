---
id: "20261029112813308"
title: "Le contrat JSON de la méthode : `ezk board show --json` complet et versionné"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [board, contrat, json]
status: idea
blocked: panel
pr:
evidence: none # contrat en ligne de commande, sans écran ; preuve = tests de contrat et fixture
created: 2026-10-29
---

## En clair

La méthode doit devenir le seul programme qui interprète une fiche. Pour ça, elle doit publier tout ce
qu'elle calcule dans un JSON stable, que d'autres programmes lisent sans rien recalculer. La commande
`ezk board show --json` existe déjà mais n'en sort qu'une partie. Cette fiche la complète et fixe son
format.

**Si tu arrives frais.** Une *fiche* est un fichier markdown du backlog. *Mission control* est le
tableau de bord du produit cop1. Le *board de la méthode* est celui de mega-city, lancé par
`ezk board open`.

## Contexte / Problème

Mission control ne demande pas ses fiches à la méthode : il relit lui-même les fichiers et applique
une copie des règles. Cette copie a divergé. Une fixture reproduit cinq écarts : « en cours » toujours
à zéro, une fiche perdue si son titre contient « : », les fiches bloquées invisibles, des barres de
version faussées, des versions mal écrites qui disparaissent en silence.

La décision est prise dans l'ADR-086 : la méthode est le seul interprète, et elle publie ses données
par `ezk … --json`. Mais aujourd'hui `ezk board show --json` ne suffit pas :

- les comptes ne sont pas interprétés : `counts.idea` mélange les idées et les fiches parkées ;
- une fiche n'a ni sa version ni son drapeau « en cours » ;
- les lots de version, la version en cours et les versions illisibles n'y sont pas ;
- les pouces de revue n'y sont pas ;
- le format n'a pas de numéro de version.

Preuves et références : [l'enquête sur les deux boards](../docs/captures/2026-10-30-enquete-boards/README.md),
constats 2 et 3.

## Valeur

Pour qui : mission control d'abord, puis tout script ou LLM qui veut lire un backlog.

Sans ce contrat, chaque consommateur recopie les règles et se trompe à sa façon. Avec lui, une règle
changée dans la méthode s'affiche partout, juste, sans recopie. C'est la pièce dont dépendent les deux
fiches suivantes du milestone `board`.

## Proposition

On **étend** la commande existante, plutôt que d'en créer de nouvelles : `ezk board show --json`
devient la sortie complète du plan d'un projet. Le détail d'une fiche relève de la fiche sœur.

La sortie gagne :

1. `schema_version` : un entier, `1` pour cette version. Un changement incompatible l'augmente.
2. Des comptes **interprétés** : idées hors parkées, prêtes, en cours, sans version, parkées,
   livrées, bloquées. Calculés par les règles de la méthode, jamais à recalculer.
3. Pour chaque fiche active : sa version, son drapeau « en cours » (déduit des branches, ADR-0077),
   sa raison de blocage.
4. Les lots de version : état, cycle de vie (brouillon, figée, livrée), et la version en cours
   (ADR-0070).
5. Les versions illisibles, dans une liste nommée.
6. Les pouces de revue posés (ADR-0057).

Les champs actuels (`counts`, `tirables`, `actives`, `milestones`, `filtres`) restent, inchangés.
Le cœur reste pur (`src/core/avancement-data.ts`) ; `bin/avancement.ts` reste le bord.

On range dans le dépôt :

- un **schéma JSON** du format ;
- des **exemples de sortie**, générés par la commande sur une fixture, pour les consommateurs ;
- un **test de contrat** qui échoue si la sortie quitte le schéma ou si les exemples ne sont plus à
  jour.

## Critères d'acceptation

- [ ] `ezk board show --json` sort `schema_version: 1`, et la sortie respecte le schéma rangé dans le
      dépôt (test de contrat vert).
- [ ] Sur la fixture des cinq causes, les comptes interprétés sont ceux des règles de la méthode : en
      cours = 1, bloquées = 1, la fiche au titre « : » lue avec son statut, la fiche remplacée hors du
      lot de sa version, la version `V1.1` listée comme illisible.
- [ ] Chaque fiche active porte sa version, son drapeau « en cours » et sa raison de blocage.
- [ ] Les lots de version sortent avec leur état et leur cycle de vie, et la version en cours est
      nommée.
- [ ] Les pouces de revue posés sortent.
- [ ] Les exemples rangés pour les consommateurs sont régénérés par une commande, et le test échoue
      s'ils ne correspondent plus à la sortie.
- [ ] Les champs actuels restent présents et identiques ; `ezk board show` sans `--json` ne change
      pas.
- [ ] La gate reste verte (`pnpm test` et `pnpm test:scripts`).

## Comment vérifier

```bash
ezk --root /Users/elzinko/git/bacasable/muti board show --json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['schema_version'], sorted(d.keys()))"
```

```bash
cd products/mega-city && pnpm test && pnpm test:scripts
```

## Notes

- Décision : [ADR-086 — la méthode est le seul lecteur des fiches](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  (Proposed). Le `blocked: panel` se lève quand le PO l'accepte.
- Cette fiche a été **regroomée le 2026-10-31**. Elle s'appelait « Retirer le vieux board (ezk-map) et
  repointer `ezk board` sur le nouveau dashboard ». L'enquête a montré que le vrai problème n'était pas
  le board mais la lecture des fiches. Son ancien périmètre est caduc : on ne retire pas le board de
  la méthode, et `ezk board` ne lance pas mission control.
- Fiches sœurs du milestone `board`, sans fiche chapeau :
  - [Le détail d'une fiche calculé par la méthode](20261031160441267_detail-fiche-calcule-par-la-methode.md)
  - [Mission control lit le board de la méthode par `ezk`](20261031160441412_mission-control-consomme-ezk.md)
    (dépend de celle-ci et de la précédente)
  - [Un seul vocabulaire pour les boards](20261031160441559_un-seul-vocabulaire-boards.md)
- Priorité P2 gardée du grooming du 2026-10-29. Elle mérite peut-être P1 : mission control affiche
  aujourd'hui des chiffres faux. Au PO de trancher.
