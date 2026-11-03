---
id: "20261103164010028"
title: Publier les données d'un outil par un contrat JSON versionné
makes: Une commande `… --json` dont un autre programme lit la sortie sans relire les fichiers de l'outil, avec un format décrit une fois, un schéma publié tolérant, un exemple généré et un test qui garde le tout
source: products/mega-city/src/core/law-show.ts
composes: []
status: draft # prouvée sur sept contrats de vectorz ; passe ready après un premier contrat hors de vectorz
home: central
created: 2026-11-03
updated: 2026-11-03
---

## En clair

Quand un programme affiche les données d'un autre (mission control lit la méthode), il ne doit pas
relire ses fichiers : il recopierait les règles et se tromperait. L'outil publie donc ses données par
une commande `… --json`, dont le format est un **contrat** : décrit une fois, versionné, livré avec un
exemple. Cette recette donne le patron de vectorz, appliqué sept fois, et les trois erreurs qu'il a
fallu payer pour l'apprendre.

## Ingrédients (prérequis)

- Un outil en TypeScript qui sait déjà calculer ses données (un cœur pur, sans I/O).
- `zod` 4 (pour `z.toJSONSchema`) dans ses dépendances.
- Au moins un consommateur identifié : il fixe ce que le contrat doit porter.

## Ustensiles (outils — capacité d'abord)

- **Décrire le format** : `zod`, en mode strict côté producteur.
- **Publier le schéma** : `z.toJSONSchema`, puis une passe qui le rend tolérant.
- **Garder le contrat à jour** : une commande `pnpm …:contract [--write]` et un test vitest.
- Aucun service en ligne, aucun secret.

## Préliminaires (gestes manuels ⚙️)

- ⚙️ Choisir le nom du contrat et son dossier (`contracts/<nom>/v1/`).
- ⚙️ Écrire la décision qui fait de l'outil le seul lecteur de ses fichiers (vectorz :
  [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)).

## Le concept (mécanisme + schéma)

```
cœur pur ──► schéma zod STRICT ──► sortie `--json` (le producteur ne peut pas mentir sur son format)
                  │
                  ├──► z.toJSONSchema ──► tolerant() ──► contracts/<nom>/v1/schema.json   (publié)
                  └──► fixture factice ──► sortie   ──► contracts/<nom>/v1/example.json  (publié)

test de contrat : schema.json et example.json == ce que le code produit aujourd'hui, sinon rouge
consommateur   : lit schema_version d'abord, ignore les champs qu'il ne connaît pas
```

## Exemples pour goûter (référence)

Sept contrats prouvés dans `products/mega-city/contracts/` : `board-show`, `backlog-show`,
`board-process`, `board-maps`, `config-show`, `law-show`, `law-object`. Le plus récent, `law-object`,
est né en entier sur ce patron le 2026-11-03 (fiche « chaque skill lit ses règles au démarrage »).

```bash
ezk law show --json | head -c 400
pnpm --dir products/mega-city law:contract
```

## Les étapes (playbook)

⚙️ Choisis d'abord le nom du contrat et écris la décision (Préliminaires).

1. **Décrire le format une fois, en zod strict.** Exemples :
   `products/mega-city/src/core/board-contract.ts:113` (`BoardContractSchema`),
   `products/mega-city/src/core/fiche-detail.ts:46` (`FicheDetailSchema`),
   `products/mega-city/src/core/law-show.ts:86` (`LawShowSchema`). Une constante porte la version :
   `products/mega-city/src/core/board-contract.ts:32` (`BOARD_SCHEMA_VERSION`).
2. **Publier un schéma tolérant.** Le producteur reste strict, mais le schéma publié accepte un champ
   ajouté : `tolerant()` dans `products/mega-city/src/io/contract-files.ts:192`.
3. **Générer l'exemple sur une fixture factice**, jamais sur les vraies données du poste :
   `products/mega-city/src/io/contract-files.ts:213` (`renderContractFiles`) et
   `products/mega-city/src/io/law-contract-files.ts:91` (`renderLawContractFiles`).
4. **Une commande régénère ou vérifie** : `pnpm --dir products/mega-city law:contract [--write]`
   (`products/mega-city/bin/law-contract.ts`). Sans `--write`, elle sort en code 1 si un fichier a
   vieilli.
5. **Un test de contrat garde le tout** :
   `products/mega-city/src/__tests__/law-show.test.ts:227` compare les fichiers publiés à ce que le
   code produit.
6. **Le consommateur lit `schema_version` d'abord** et refuse une version inconnue sans rien afficher
   de faux : `products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts:82`.

Règle de version : `schema_version` monte quand un champ disparaît, change de nom ou de sens. Un champ
ajouté ne la change pas.

## Les pièges déjà payés

1. **Le schéma publié trop strict** (2026-11-01, contrat du board). Publier le schéma zod strict tel
   quel (`additionalProperties: false`) casse tout consommateur dès qu'un champ s'ajoute. On publie la
   version tolérante (étape 2) ; seul le producteur reste strict.
2. **La sortie coupée à 64 Ko** (2026-11-01, constaté sur `ezk board show --json | …`). Un
   `process.exit()` juste après `console.log` coupe la sortie quand elle part dans un tuyau. On pose
   `process.exitCode` et on laisse le processus finir : `products/mega-city/bin/backlog-show.ts:24`,
   `products/mega-city/bin/law-show.ts:55`. Le constat daté est en commentaire de
   `products/mega-city/bin/board-process.ts:21`.
3. **La valeur d'énumération ajoutée** (2026-11-03, contrat de la loi, portée `demarrage`). Ajouter
   une valeur à une énumération ne change pas `schema_version`, mais un consommateur qui vérifie la
   liste des valeurs la refuse : `products/cop1/packages/app/src/features/board/ezkLawTranslator.ts:68`.
   Le consommateur change dans le même commit que le producteur, ou il ignore une valeur inconnue.

## Vérifier

```bash
pnpm --dir products/mega-city law:contract
pnpm --dir products/mega-city exec vitest run src/__tests__/law-show.test.ts src/__tests__/board-contract.test.ts
```

Signal observable : les deux commandes passent ; un champ ajouté au cœur sans régénérer les fichiers
fait tomber le test de contrat.

## Checklist « rien d'oublié »

- [ ] Le format vit à un seul endroit, en zod strict, avec sa constante de version.
- [ ] Le schéma publié est tolérant : il accepte un champ en plus.
- [ ] L'exemple publié vient d'une fixture factice, jamais du poste.
- [ ] Une commande régénère ou vérifie les fichiers publiés, et sort en code 1 s'ils ont vieilli.
- [ ] Un test de contrat compare les fichiers publiés à ce que le code produit.
- [ ] La commande pose `process.exitCode`, jamais `process.exit()` après sa sortie.
- [ ] Chaque consommateur lit `schema_version` d'abord ; une valeur d'énumération ajoutée change le
      consommateur dans le même commit.

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`products/mega-city/src/core/law-show.ts`**

- `products/mega-city/src/core/law-show.ts:86` — un format décrit en zod strict, avec sa version
  (`:25`).
- `products/mega-city/src/core/board-contract.ts:113` — le même patron pour le board.
- `products/mega-city/src/io/contract-files.ts:192` — `tolerant()`, le schéma publié qui accepte un
  champ ajouté.
- `products/mega-city/src/io/law-contract-files.ts:91` — l'exemple généré sur une fixture factice.
- `products/mega-city/src/__tests__/law-show.test.ts:227` — le test de contrat.
- `products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts:82` — un consommateur qui lit
  `schema_version` d'abord.

## Statut de cette recette

Capturée le 2026-11-03, sur une proposition de la rétro du 2026-11-01 acceptée par le PO
([rétro du run des contrats JSON](../docs/captures/2026-11-01-retro-run-contrats-json-light.md)). Le
détecteur de recettes n'a pas pu tourner ce jour-là, faute de compte rendu de sprint daté ; le
candidat a été jugé à la main. Statut `draft` : prouvée sept fois dans vectorz, elle passe `ready`
après un premier contrat publié par un autre projet.

