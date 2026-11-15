---
id: "20261114131615903"
title: "`ezk release verdict` : un verdict de passe posé par une commande, avec motif, auteur et commit"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [release]
status: shipped
blocked:
pr: "local-squash 3c57c185"
evidence: none # une commande de la méthode, aucun écran
created: 2026-11-14
---

# 20261114131615903 — `ezk release verdict` : un verdict de passe posé par une commande, avec motif, auteur et commit

**En clair.** Avant une version, la chasse aux bugs doit donner son feu vert. Aujourd'hui ce feu
vert est un fichier vide posé à la main : on ne sait ni pourquoi, ni qui, ni sur quel état du code.
On propose une commande qui pose le verdict d'un contrôle, avec son motif, son auteur et le commit,
dans un fichier lisible ; la passe qualité le relit et sait s'il est périmé.

**Si tu arrives frais.** La *gate de release* (`ezk release <v>`) enchaîne des *passes*, des
contrôles GO / NO-GO, avant l'étiquette d'une version. Deux passes demandent un jugement humain ou
d'agent : la chasse aux bugs et la revue design-system. Le *verdict* d'une passe est le fichier qui
enregistre ce jugement sous `.vectorz/release/`.

## Contexte / Problème

Ce que l'écran attend. La page Configuration de la maquette montre chaque contrôle avec son dernier
verdict : go ou no-go, le motif, la date, le commit.

Ce que le code fait aujourd'hui.

- `ezk release` n'accepte qu'une version : aucun sous-verbe.
  `products/mega-city/bin/ezk-release.ts:27-32` ; le manifeste ne déclare qu'un verbe pour le
  domaine `release` (`products/mega-city/ezk-manifest.yml:287-292`).
- La passe `chasse-aux-bugs` teste la présence d'un fichier : `test -f .vectorz/release/<v>.bughunt-go`.
  `products/mega-city/src/core/release-gate.ts:54-58`.
- Aucun script ne crée ce fichier. Seuls `release-gate.ts:56-57` et la compétence `ezk-release`
  (`products/mega-city/skills/ezk-release/SKILL.md:51` et `:61-64`) le nomment. Un humain le pose à la main.
- Ni motif, ni auteur, ni commit ne sont enregistrés. Impossible de l'afficher ; impossible de le
  dire périmé.
- La passe design-system a le même manque, mais sa forme de verdict est déjà posée :
  `{ version, verdict, gaps, at, head }`, écrit sous `.vectorz/release/<v>.design-system.json`.
  `products/mega-city/src/core/design-system-review.ts:45-54` ;
  `products/mega-city/src/loaders/release-passes.ts:93-104`. `ezk design check <v>` le relit
  (`products/mega-city/bin/ezk-release-design-system.ts:8-10`) ; aucune commande ne l'écrit.
- Le verdict de release, lui, se périme quand il n'est pas posé sur HEAD
  (`products/mega-city/bin/backlog-version.ts:338-339`). Le feu vert de la chasse aux bugs ne se
  périme jamais.
- Un précédent existe pour « un verdict posé par une commande ezk » :
  `ezk review verdict <id> up|down|none` (`products/mega-city/bin/review-verdict.ts:4`), avec ses
  codes de sortie 0 posé, 1 refusé, 2 usage (`:11`).

## Proposition

Un verbe générique, pas un verbe par passe.

1. **`ezk release verdict <passe> <v> go|no-go "<motif>"`** écrit `.vectorz/release/<v>.<passe>.json`
   sur la forme du verdict design-system : `{ version, passe, verdict, motif, auteur, at, head }`.
   `head` est le commit courant ; `auteur` vient de `git config user.name`, absent s'il n'est pas
   lisible. Sans motif : refus net, code 2, avant toute écriture. Une passe absente des passes
   effectives : refus, code 1.
2. **La passe `chasse-aux-bugs` du socle lit ce verdict.** Sa commande devient une lecture de
   `<v>.chasse-aux-bugs.json` : GO seulement si le verdict est GO et posé sur HEAD. Un verdict posé
   sur un autre commit est périmé, avec la même règle que le verdict de release.
3. **L'ancien fichier `.bughunt-go` n'est plus lu.** Le code qui le nomme disparaît, la compétence
   `ezk-release` décrit le nouveau geste. Pas de code mort.
4. **La passe design-system**, quand le projet la déclare, pose son verdict par le même verbe
   (`ezk release verdict design-system <v> no-go "<motif>"`). `ezk design check` lit toujours `gaps` :
   le verbe l'écrit vide (`[]`) par défaut, car `decideDesignSystem` lit `verdict.gaps.length`
   (`products/mega-city/src/core/design-system-review.ts:109`).
5. **Le compte rendu de `ezk release <v>`** nomme le motif d'un NO-GO de chasse aux bugs, dans la
   ligne de détail de la passe (`release-gate.ts:96-99`).

Hors périmètre : l'ajout ou le retrait d'une passe, porté par
[`ezk release passes list|add|remove`](../20261114131616085_ezk-release-passes-list-add-remove.md),
qui réutilise ce verbe pour son type « revue par un agent ». L'affichage à l'écran, qui passe par
[Contrat `config-show` v2](../20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md).

## Critères d'acceptation

- [ ] `ezk release verdict chasse-aux-bugs <v> go "<motif>"` écrit
      `.vectorz/release/<v>.chasse-aux-bugs.json` avec `version`, `passe`, `verdict`, `motif`,
      `auteur`, `at`, `head` ; `no-go "<motif>"` écrit un NO-GO.
- [ ] Sans motif, la commande refuse avec le code 2 et n'écrit rien ; une passe absente des passes
      effectives est refusée avec le code 1.
- [ ] La passe `chasse-aux-bugs` par défaut est GO seulement si le verdict est GO et posé sur HEAD ;
      un verdict posé sur un autre commit rend NO-GO, avec le motif « périmé » et les deux commits.
- [ ] Le fichier `.bughunt-go` n'est plus lu ni nommé, ni dans le code, ni dans la compétence `ezk-release`.
- [ ] Le compte rendu de `ezk release <v>` nomme le motif d'un NO-GO de chasse aux bugs.
- [ ] Le format du verdict et la règle de péremption sont couverts par des tests sans I/O.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" release verdict chasse-aux-bugs v0.24.0 go ; echo "EXIT=$?"   # EXIT=2, rien d'écrit
ezk --root "$ROOT" release verdict chasse-aux-bugs v0.24.0 go "parcours du lot rejoués, aucun bug bloquant"
jq '{verdict, motif, auteur, head}' "$ROOT/.vectorz/release/v0.24.0.chasse-aux-bugs.json"

ezk --root "$ROOT" release v0.24.0                                      # la passe lit le verdict
git -C "$ROOT" commit --allow-empty -q -m "test: périme le verdict"   # sur un clone de test
ezk --root "$ROOT" release v0.24.0 ; echo "EXIT=$?"                     # NO-GO « périmé », EXIT=1

grep -rn 'bughunt-go' "$ROOT/products/mega-city/src" "$ROOT/products/mega-city/bin" \
  "$ROOT/products/mega-city/skills" | wc -l                             # 0
```

Tests à lancer :

```bash
pnpm --dir products/mega-city test -- src/__tests__/release-gate.test.ts
pnpm --dir products/mega-city test -- src/__tests__/design-system-review.test.ts
```

Aucune preuve d'écran : la fiche ajoute une commande, pas un écran.

## Glossaire

- `passe` — un contrôle de la gate de release : un id, un titre, une commande ; GO si la commande
  rend le code 0.
- `verdict` — le fichier qui enregistre le jugement d'une passe sous `.vectorz/release/`, avec son
  motif et son commit.
- `périmé` — un verdict posé sur un autre commit que HEAD : il ne compte plus.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart E2 (page Configuration). La carte proposait un verbe `bughunt` ; la lecture du code a
  élargi au verbe générique `verdict`, parce que la passe design-system a le même manque et une
  forme de verdict déjà posée.
- Fiches livrées dont le code bouge :
  [Release gate — passe qualité avant versionnement](20260922175954296_release-gate-passe-qualite-versionnement.md)
  (la passe `chasse-aux-bugs`),
  [Revue design-system : un step composable](20261011153019643_revue-design-system-step-composable-release.md)
  (la forme du verdict).
- Précédent : [Le pouce de revue par une commande ezk](20261102123552181_pouce-de-revue-par-une-commande-ezk.md).
  Seules les commandes `ezk` écrivent dans un projet
  ([ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)).
- La chasse aux bugs elle-même reste celle de la compétence `ezk-release` : un agent adverse rejoue les
  parcours du lot. Cette fiche enregistre son verdict ; elle ne le fabrique pas.
- Dépendances : aucune fiche du lot. Voisines :
  [`ezk release passes`](../20261114131616085_ezk-release-passes-list-add-remove.md) (type « revue par
  un agent ») et [Contrat `config-show` v2](../20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md)
  (affichage).
- Le champ `auteur` est une proposition : la carte le nomme dans le titre de la fiche, l'écart E2 ne
  fixe pas sa source. `git config user.name` est la plus simple ; le build peut en retenir une autre.
- Risque : un verdict périmé après chaque commit oblige à rejouer la chasse aux bugs souvent. C'est
  le prix d'un feu vert qui dit sur quel code il porte ; la même règle vaut déjà pour le verdict de
  release.
