> 🗎 Rendu de la fiche [features/20261114131612759_versions-publiees-comme-coupes.md](../done/20261114131612759_versions-publiees-comme-coupes.md)

# 20261114131612759 — Les versions publiées comme coupes, avec la prochaine coupe à faire

**En clair.** La page Versions de mission control compte sept fiches à sortir, alors que
quatre-vingt-cinq fiches ont été livrées depuis la dernière étiquette. L'écran ment parce que la
méthode ne publie ni le nom des versions, ni la date de leurs étiquettes, ni ce qui attend la
prochaine coupe. La méthode publie chaque version comme une coupe, c'est-à-dire tout ce qui est
sorti depuis l'étiquette précédente, et calcule la coupe suivante.

**Si tu arrives frais.** Une « version » est une étiquette git sur un commit ; une « coupe » pose
cette étiquette sur tout ce qui a été livré depuis la précédente. Mission control lit les JSON
publiés par `ezk` (ADR-086).

## Contexte / Problème

Ce que l'écran attend (maquette du 14 novembre, pages Versions, Version et Accueil) :

- pour chaque version : son nom en clair, ses objectifs, la date de son étiquette ;
- une « prochaine coupe » : les fiches livrées depuis la dernière étiquette, le numéro proposé, le
  dernier verdict de la gate de release, les preuves du carnet de tests.

Ce que le code publie aujourd'hui :

- `ezk board show --json` publie `versions.courante`, `ecartees`, `illisibles` et `lots[]`. Un lot
  porte `version`, `etat`, `cycleDeVie`, `etiquette`, `etiquetteGel`, `livrees`, `aFaire`, `pretes`,
  `bloquees` et `intrus`. Le 14 novembre, sur ce dépôt : la dernière étiquette est `v0.22.0` ;
  `v0.23.0` et `v0.24.0` sont « à clore », avec 4 et 3 fiches livrées. C'est le « 7 » de l'écran.
  `products/mega-city/src/core/board-contract.ts:82-102`
- Les noms (« Le socle dit vrai », « On teste vite, en local »…) ne vivent que dans la table
  « Train de versions » de `features/PLAN.md` (à partir de la ligne 144). La méthode ne les publie pas.
- Les étiquettes sont lues par `git tag -l`, sans date.
  `products/mega-city/src/io/git-tags.ts:13-20`
- Les fiches livrées sans version sont comptées en interne (`history`), ni publiées ni listées : 233
  sur 379 livrées le 14 novembre (`ezk backlog show --json`). La carte des écarts compte 85 livrées
  depuis `v0.22.0` ; le « 76 sans numéro » vient du dossier du 10 novembre, repris par
  [Trancher la coupe](../done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md). Comptes git, non rejoués ici.
  `products/mega-city/src/backlog/versions.ts:209-218`
- `ezk release <vX.Y>` écrit son verdict (`GO` ou `NO-GO`, passes, date, commit) sous
  `.vectorz/release/<version>.json` ; `board show` ne le lit pas.
  `products/mega-city/bin/ezk-release.ts:5-7` et `:68-72` ; `products/mega-city/src/core/release-gate.ts:32-40`
- `ezk carto status --json` publie l'état du carnet de tests (`valide`, `echec`, `expire`, `jamais`),
  sans lien avec une version.
  `products/mega-city/bin/ezk-carto.ts:4-12` ; `products/mega-city/src/core/carto.ts:295`
- Aucun `prochaineCoupe` n'existe dans le code. Le seul calcul voisin : `ezk backlog version close <X>`
  sans `--tag` imprime l'étiquette proposée, pour une version déjà écrite sur ses fiches.
  `products/mega-city/bin/backlog-version.ts:349-350`
- Autre projet, muti (`supervision.registry.yaml:21-23`), lu le 14 novembre : 118 fiches livrées,
  dont 36 portent une version (v1.7.0 ×5, v1.8.0 ×30, v2.0.0 ×1 ; la contestation comptait 41 en
  incluant 5 fiches closes sans livraison) ; pas de dossier `docs/sprints/`. `board show` sur muti
  publie donc des lots pleins et aucun sprint. `products/mega-city/src/io/board-show.ts:28-37`

## Proposition

**Volet a — additif, sans décision, en premier.** Le contrat `board-show` reste en `schema_version: 1`.

- `lots[]` gagne `nom` (`''` si non déclaré), `milestones[]` (les objectifs distincts des fiches du
  lot) et `dateEtiquette` (la date de l'étiquette git, `null` sans étiquette ; lue par
  `git for-each-ref`, pas par `git tag -l`).
- Un bloc `versions.prochaineCoupe` : `derniereEtiquette`, `livrees[]` (id, titre, objectif de chaque
  fiche livrée depuis cette étiquette), `nombre`, `gate` (le dernier verdict écrit par `ezk release`,
  ou `null`), `carnet` (les comptes de `ezk carto status --json`, ou `null`) et `numeroPropose`
  (`null` tant que la règle n'est pas tranchée).
- `board show` n'écrit rien ; il calcule. Sur un projet sans étiquette ou sans comptes rendus, les
  champs valent `null` ou `[]`, jamais 0.

**Volet b — après le panel.** `nom`, `numeroPropose` et la règle de la coupe (quoi, qui, quand)
dépendent du panel de
[Trancher la coupe](../done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md).

- Décision du PO du 14 novembre : le nom en clair d'une version vit dans le front-matter de l'objet
  version lui-même, pas dans `PLAN.md` ; pas de `milestones.yml`. La forme de l'objet est tranchée
  par ce panel ; cette fiche n'en décide pas.
- Le verbe qui pose l'étiquette est
  [`ezk backlog version tag <v>` : un seul verbe pour la coupe](../done/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md).
  `board show` publie la même coupe que ce verbe calcule : une seule source, deux sorties.

Hors périmètre : poser l'étiquette ; changer la page Versions ; inventer des sprints à muti.

Voisines livrées : [Cycle de vie d'une version](../done/20261014200651962_cycle-vie-version-preparer-figer-developper.md),
[Release gate](../done/20260922175954296_release-gate-passe-qualite-versionnement.md),
[La version est un checkpoint du run](../done/20261015125606808_frontiere-version-checkpoint-run-autonome.md),
[Découper le backlog en versions](../done/20260824204751403_preparation-lots-versions-coherence.md).
Voisine en idée : [Proposer la version d'une fiche](../20261008192643426_proposeur-version-sprint-aware.md)
propose un numéro par fiche, pas la coupe.

## Critères d'acceptation

- [x] Chaque entrée de `versions.lots[]` porte `nom`, `milestones[]` et `dateEtiquette` ;
      `dateEtiquette` vaut `null` sur un lot sans étiquette.
- [x] `versions.prochaineCoupe` liste les fiches livrées depuis la dernière étiquette (id, titre,
      objectif), leur nombre et la dernière étiquette. Sur le dépôt du 14 novembre, le nombre vaut
      celui des fiches ajoutées à `features/done/` depuis `v0.22.0`.
- [x] `prochaineCoupe.gate` reprend le dernier verdict de `ezk release` (verdict, date, passes) ou
      vaut `null` ; `prochaineCoupe.carnet` reprend les comptes de `ezk carto status --json` ou `null`.
- [x] `board show` n'écrit aucun fichier. Le calcul « livré depuis la dernière étiquette » vit à un
      seul endroit de la méthode ; le verbe de coupe lié plus haut le réutilisera, sans second calcul.
- [x] Sur un projet sans étiquette ni `docs/sprints/` (cas muti), les champs valent `null` ou `[]`,
      et le contrat le dit « non publié », jamais 0.
- [x] Le contrat `board-show` reste en `schema_version: 1` ; schéma et exemple régénérés décrivent les nouveaux champs.

## Comment vérifier

```bash
R="$(git rev-parse --show-toplevel)"
ezk --root "$R" board show --json | jq '.versions.lots[-3:][] | {version, nom, etiquette, dateEtiquette, milestones}'
ezk --root "$R" board show --json | jq '.versions.prochaineCoupe | {derniereEtiquette, nombre, numeroPropose, gate: .gate.verdict}'
# le nombre doit valoir celui-ci : fiches ajoutées à done/ depuis la dernière étiquette
git -C "$R" log --no-renames --diff-filter=A --name-only --pretty=format: v0.22.0..HEAD -- features/done | grep -c '\.md$'
ezk --root <chemin de muti, voir supervision.registry.yaml> board show --json | jq '{lots: (.versions.lots | length), sprints: (.derniersSprints | length), coupe: .versions.prochaineCoupe}'
pnpm --dir products/mega-city board:contract
pnpm --dir products/mega-city test -- \
  src/backlog/__tests__/versions.test.ts \
  src/__tests__/board-contract.test.ts \
  src/__tests__/backlog-version-bin.test.ts
```

## Glossaire

- `coupe` — poser une étiquette de version sur tout ce qui a été livré depuis la précédente.
- `étiquette` — un tag git (`v0.22.0`), local tant que le PO ne le pousse pas.
- `gate de release` — la passe qualité jouée par `ezk release` avant une étiquette (`GO` ou `NO-GO`).
- `carnet de tests` — le registre des contrôles manuels de mission control, tenu par `ezk carto`.
- `contrat` — un JSON publié par `ezk … --json`, décrit par un schéma versionné dans la méthode.

## Notes / décisions

- Volet a livré le 2026-11-17. Critères prouvés par ezk-reviewer (GO) : `lots[]` porte `nom`, `milestones[]`, `dateEtiquette` (v0.22.0 daté, v0.23/v0.24 `null`) ; `prochaineCoupe.nombre` = 98 = la commande git ; `gate` et `carnet` repris ou `null` ; `board show` n'écrit rien et le calcul vit dans `core/coupe.ts` ; projet sans étiquette → `null`/`[]` ; `schema_version` 1, exemple = sortie réelle. Choix gardés : `livrees` reprend tout ajout à `done/` (closes comprises), `nombre` vaut 0 avec une étiquette et rien depuis. Corrigé après revue : un verdict de release illisible est écarté au lieu de faire tomber le board. Volet b reste à faire.

- Origine : [la carte des écarts maquette ↔ code ↔ backlog du 14 novembre](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart A7.
- Décision du PO du 14 novembre (n° 2) : le nom en clair d'une version vit dans le front-matter de
  l'objet version ; pas de `milestones.yml` ; `PLAN.md` n'est pas la source des noms. À confirmer par
  le panel adverse avant d'être écrite en ADR ; le panel de la coupe en vérifie la forme.
- Dépend de [Trancher la coupe](../done/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md) et de
  [`ezk backlog version tag <v>`](../done/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md). Le dossier
  du 10 novembre n'est pas committé (autre worktree). Le volet a n'attend ni l'un ni l'autre.
- Trois corrections de la contestation du 14 novembre. `ezk backlog version tag --dry-run` n'existe
  pas : les verbes sont `list`, `check`, `ready`, `close`, `freeze`, `unfreeze`, `diff`
  (`backlog-version.ts:45`). muti a des lots pleins et aucun sprint. Committer le dossier est un geste.
- Fiche sœur : [Les objectifs publiés comme objets](../done/20261114131612572_objectifs-publies-comme-objets.md)
  porte la même décision sur le nom, côté objectif.
- Risques : « depuis la dernière étiquette » se calcule par git (fiches ajoutées à `done/` après le
  commit étiqueté), un déplacement tardif de fiche fausse le compte ; `numeroPropose` reste `null`
  tant que la règle n'est pas écrite (ADR-0083 : le numéro s'incrémente seul, dans l'ordre).
- ADR : [ADR-0083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md) ;
  [ADR-0080](../../products/mega-city/docs/adr/0080-checkpoint-de-version.md) ; [ADR-0070](../../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) ;
  [ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).


## Validation

| Modalité | Statut |
|---|---|
| Gate mega-city | ✅ 2460 tests |
| cop1 packages | ✅ 776 tests |
| Revue ezk-reviewer | ✅ GO 6/6 prouvés |
| Before / after (UI) | N.A. — contrat JSON seul sans écran modifié |
