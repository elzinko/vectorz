---
id: "20261114131613314"
title: "La gate de release joue les tests du projet"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [release, contrat]
status: shipped
blocked:
pr: "local-squash 52dafa7f"
evidence: none # une passe de gate, aucun écran modifié
created: 2026-11-14
---

# 20261114131613314 — La gate de release joue les tests du projet

**En clair.** Aujourd'hui, une version peut recevoir son étiquette sans qu'un seul test ait tourné
dans la passe qualité qui précède l'étiquette. On ajoute à cette passe un contrôle « tests » par
défaut : il lance la commande de tests du projet, lue dans sa configuration. Si le projet n'a pas
déclaré cette commande, le contrôle est marqué « sauté », en le disant, jamais vert en silence.

**Si tu arrives frais.** La *gate de release* est la commande `ezk release <version>` : elle
enchaîne des *passes* (des contrôles GO / NO-GO) et refuse l'étiquette tant qu'une passe bloque.
Une passe est une donnée : un id, un titre, une commande shell. La configuration d'un projet vit
dans `.vectorz/config.yml`.

## Contexte / Problème

Ce que l'écran attend. La page Configuration de la maquette de mission control liste les contrôles
joués avant une version. Elle montre un contrôle « tests » comme existant, avec la commande du projet.

Ce que le code fait aujourd'hui.

- La gate joue des passes déclarées, chacune une commande shell libre.
  `products/mega-city/src/core/release-gate.ts:14-19` (la forme d'une passe) et `:48-59` (le socle).
- Les deux passes par défaut sont `dod-mecanique` et `chasse-aux-bugs`. Aucune passe « tests ».
- Le réglage `release` ne connaît qu'une clé, `release.gate`. La clé `release.tests` n'existe pas.
  `products/mega-city/src/core/release-gate.ts:72-74` et `:81-87`.
- Un projet peut déclarer une passe tests à la main dans `.vectorz/release-passes.yml`. Mais ce
  fichier remplace les défauts au lieu de les compléter.
  `products/mega-city/src/loaders/release-passes.ts:36-58` ; le repli sur le socle est en `:58`.
- La commande de tests du projet vit ailleurs. Sur vectorz, c'est le script `gate` de
  `products/mega-city/package.json:14`. La gate locale de sprint le joue ; la gate de release, non.
- Une passe sautée proprement existe déjà : la revue design-system rend `skip` quand le référentiel
  manque, avec un message, et ne bloque pas.
  `products/mega-city/src/core/design-system-review.ts:57` (les quatre états) et `:83-89` (le saut).

Ce qui manque : une passe `tests` par défaut, une clé `release.tests` lue par la méthode, et un état
« sauté » visible dans le compte rendu et dans le verdict.

## Proposition

POC d'abord, dans le cœur pur, puis au bord.

1. **Lire `release.tests`.** `resolveRelease` lit la clé à côté de `release.gate` et l'expose dans
   `ReleaseConfig` (`tests: string | null`). Une valeur qui n'est pas une chaîne est refusée avec un
   message qui nomme la clé et la valeur.
2. **Une passe `tests` par défaut.** Elle rejoint `dod-mecanique` et `chasse-aux-bugs` dans le
   socle. Sa commande est la valeur de `release.tests`, jouée à la racine du projet. Code 0 : GO.
   Autre code : NO-GO, avec la première ligne utile de la sortie.
3. **Le saut, dit et enregistré.** Sans `release.tests`, la passe rend `skip`. Même mot, même rendu
   que la passe design-system : une ligne « tests — sautée : `release.tests` absent ». Le verdict
   `.vectorz/release/<v>.json` porte ce troisième état. Un `skip` ne bloque pas le verdict global ;
   il n'est pas non plus un GO muet.
4. **Sur vectorz.** La valeur candidate est `pnpm --dir products/mega-city gate`, la commande fixée
   par [Une seule commande « gate » rejoue toute la validation locale](20261002230039555_commande-gate-unique.md).

Hors périmètre :

- La règle « le fichier projet complète ou remplace le socle ». Elle s'écrit une seule fois, dans
  [`ezk release passes list|add|remove`](20261114131616085_ezk-release-passes-list-add-remove.md).
- La publication de la commande de tests et des passes pour l'écran. Elle passe par
  [Contrat `config-show` v2](../20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md).

## Critères d'acceptation

- [ ] `ezk release <v>` joue une passe `tests` par défaut, après `dod-mecanique` et
      `chasse-aux-bugs`. Sa commande est la valeur de `release.tests` dans `.vectorz/config.yml`.
- [ ] Le verdict `.vectorz/release/<v>.json` porte la passe `tests` avec son état : GO, NO-GO ou `skip`.
- [ ] Clé `release.tests` absente : la passe est `skip`, le compte rendu l'écrit en clair avec le
      motif « `release.tests` absent », le verdict aussi. Jamais un GO ni un NO-GO muets.
- [ ] Une valeur `release.tests` qui n'est pas une chaîne est refusée, avec un message qui nomme la
      clé et la valeur.
- [ ] Les tests du projet en échec rendent la passe NO-GO et le verdict global NO-GO ;
      `ezk backlog version close <v> --tag` refuse alors l'étiquette.
- [ ] Le cœur pur (lecture de `release.tests`, état `skip`, agrégation à trois états) est couvert
      par des tests sans I/O.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"

# Sans clé release.tests : la passe est sautée, en le disant
ezk --root "$ROOT" release v0.24.0
jq '.passes[] | select(.id == "tests")' "$ROOT/.vectorz/release/v0.24.0.json"
# attendu : la passe tests avec l'état skip, et une ligne « sautée » dans le compte rendu

# Avec la clé : la commande du projet tourne (à annuler ensuite ; vectorz n'a pas encore de bloc release:)
printf 'release:\n  tests: pnpm --dir products/mega-city gate\n' >> "$ROOT/.vectorz/config.yml"
ezk --root "$ROOT" release v0.24.0
jq '.verdict, (.passes[] | select(.id == "tests"))' "$ROOT/.vectorz/release/v0.24.0.json"
```

Tests à lancer :

```bash
pnpm --dir products/mega-city test -- src/__tests__/release-gate.test.ts
```

Aucune preuve d'écran : la fiche ne modifie aucun écran.

## Glossaire

- `passe` — un contrôle de la gate de release : un id, un titre, une commande shell ; GO si la
  commande rend le code 0.
- `skip` — l'état d'une passe sautée : elle n'a pas tourné, elle le dit, elle ne bloque pas.
- `verdict` — le fichier `.vectorz/release/<v>.json` écrit par `ezk release`, relu avant l'étiquette.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart E1 (page Configuration).
- Fiches livrées dont le code bouge :
  [Release gate — passe qualité avant versionnement](20260922175954296_release-gate-passe-qualite-versionnement.md)
  (les passes du socle) et
  [Revue design-system : un step composable](20261011153019643_revue-design-system-step-composable-release.md)
  (le modèle du `skip`).
- Dépendances : aucune fiche du lot. Voisines :
  [Contrat `config-show` v2](../20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md)
  publie la commande de tests ;
  [`ezk release passes`](20261114131616085_ezk-release-passes-list-add-remove.md) porte la règle
  de composition socle / projet.
- Risque : la passe `tests` rejoue toute la validation locale ; sur vectorz, c'est long. Le coût est
  accepté : une version se coupe rarement.
- Risque : le verdict passe de deux états à trois. `PassResult.go` est un booléen
  (`products/mega-city/src/core/release-gate.ts:22-29`) : l'état `skip` demande un champ de plus,
  dont la forme exacte se fixe au build. `backlog version close --tag` lit `passes[].go`
  (`products/mega-city/bin/backlog-version.ts:341`) ; il doit traiter `skip` comme non bloquant.
  Si [`ezk backlog version tag <v>`](20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md)
  remplace `close --tag`, le lecteur du verdict change de nom, pas de règle.
