---
id: "20261114131613503"
title: "Contrat `config-show` v2 : passes de la gate, commande de tests, niveaux en français"
type: feature
priority: P1
product: mega-city
milestone: board
version:
labels: [contrat, theme:mission-control]
status: idea
blocked:
pr:
evidence: none # un contrat et une adaptation cop1 sans nouvel écran
created: 2026-11-14
---

# 20261114131613503 — Contrat `config-show` v2 : passes de la gate, commande de tests, niveaux en français

**En clair.** La page Configuration de mission control veut montrer les contrôles joués avant une
version, la commande de tests du projet et le niveau de chaque agent en français. La méthode calcule
tout cela, mais elle ne le publie pas : l'écran n'a qu'un oui / non pour la passe qualité et des noms
de niveaux en anglais. On publie ces trois données dans le format que l'écran lit déjà, en montant sa
version, et on adapte l'écran dans le même lot.

**Si tu arrives frais.** `ezk config show --json` publie la configuration résolue d'un projet dans un
*contrat JSON* : un format décrit une fois, versionné par `schema_version`. Mission control, l'écran
de cop1, lit ce JSON et n'invente rien (ADR-086). Un *niveau* (performant, standard, économe) dit
quel modèle et quel effort un agent emploie. Un *module* est un outil branché autour de la méthode.

## Contexte / Problème

Ce que l'écran attend. La page Configuration de la maquette montre la liste des contrôles de la gate
avec leur origine (socle ou projet), la commande de tests, et le niveau de chaque agent avec des
libellés français du niveau et de l'effort. La page Plugin veut régler la clé `integration` : comment
une story arrive sur `main` (`local-squash` ou `push-ff`).

Ce que le code publie aujourd'hui.

- `releaseGate` est un booléen, rien d'autre. Ni la liste des passes, ni la commande de tests.
  `products/mega-city/src/core/config-contract.ts:52` ;
  `products/mega-city/contracts/config-show/v1/schema.json:43-46`.
- Le loader sait si les passes viennent du fichier projet ou du socle, sans l'exposer.
  `products/mega-city/src/loaders/release-passes.ts:36-58`.
- cop1 refuse un `releaseGate` qui ne serait pas un booléen, et une `schema_version` autre que 1.
  `products/cop1/packages/app/src/features/board/ezkConfigTranslator.ts:53` et `:62`.
- Les niveaux existent sous leurs noms anglais, `high | middle | low`, et l'effort `high | medium | low`.
  `products/mega-city/src/core/model-config.ts:18` et `:21`. « performant / standard / économe »
  n'est qu'un commentaire (`:41`), recopié en commentaire côté cop1
  (`products/cop1/packages/web/src/board/configModel.ts:14`).
- Le niveau par agent est publié (`agents[].tier`, `effort`, `source` ; `config-contract.ts:29-37`)
  et réglable par `ezk config roles set <agent> <tier>` (`products/mega-city/bin/ezk-config.ts:121`
  et `:147-151`). Les défauts par rôle restent du code (`ROLE_TIER`, `model-config.ts:42-51`).
- La sortie texte de `ezk config show` affiche les niveaux en anglais (`bin/ezk-config.ts:99-104`).
  La fiche livrée [Config des modèles : pointeurs au bind + commande ezk config](done/20261013132218451_config-modeles-pointeurs-et-cli.md)
  les annonçait en français (ses lignes 69-70). C'est une dette de livraison.
- cop1 garde une copie locale du mapping niveau → modèle, `DEFAULT_IDE_MAP` (`configModel.ts:33-49`).

Déjà acquis : les modules GitHub se règlent par commande, `ezk config github on|off` et
`ezk config github <pr|ci|codex-review> on|off`, sans toucher aux clés voisines du YAML
(`bin/ezk-config.ts:12-14` et `:246-260` ; `src/loaders/project-config.ts:184-203`). Seule la clé
`integration:` (`local-squash | push-ff`) se lit (`config-contract.ts:51`) sans verbe d'écriture.

## Proposition

Une seule montée de version du contrat, et l'écran adapté dans le même lot.

1. **`releaseGate` devient un objet** (noms proposés) : `{ active, passes: [{ id, title, source }], tests }`.
   `source` vaut `defaut` ou `projet`. `tests` est la commande de tests effective, `null` quand
   `release.tests` manque (voir
   [La gate de release joue les tests du projet](done/20261114131613314_gate-de-release-joue-les-tests.md)).
2. **`niveaux[]` à côté de `agents[]`** (noms proposés). Une entrée par niveau :
   `{ id, libelle, model, effort, effortLibelle, source }` pour `high`, `middle`, `low`. Les libellés
   français sont écrits une fois, dans la méthode. `agents[].tier` reste tel quel ; l'écran joint les deux.
3. **`schema_version` passe à 2.** Le changement de forme de `releaseGate` l'impose.
   `contracts/config-show/v2/` est régénéré par `pnpm --dir products/mega-city board:contract --write`
   (la liste des contrats vit dans `products/mega-city/src/io/contract-files.ts:46`).
4. **cop1 suit dans le même lot.** Le traducteur accepte la v2, lit `releaseGate.passes` et
   `niveaux` ; `configModel.ts` retire `DEFAULT_IDE_MAP` et ses commentaires de niveaux, ou les lit
   du contrat (ADR-086).
5. **`ezk config show` en texte** affiche les mêmes libellés français que le JSON. Les deux sorties
   lisent les mêmes loaders (`products/mega-city/src/io/config-show.ts:1-7`).
6. **Un petit verbe `ezk config integration <local-squash|push-ff>`**, sur le patron de
   `writeGithubConfig`. La page Plugin en a besoin ; il ne mérite pas une fiche à part.

Hors périmètre : une étape « Versionner » et le niveau par agent dans le process publié. Le canal est
`ezk process show --json`, porté par [La méthode émet ses étapes fines](20261110191135802_methode-emet-ses-etapes-fines.md),
qui note déjà `ezk-release` comme cinquième compétence attendue (ses lignes 235-236). Pas de
nouvelle fiche : on l'enrichit quand elle se construit.

## Critères d'acceptation

- [ ] Le contrat `config-show` passe en version 2 : `releaseGate` est un objet `{ active, passes[],
      tests }`, chaque passe a `id`, `title` et `source` (`defaut` | `projet`), `tests` vaut la
      commande ou `null`.
- [ ] Le contrat publie `niveaux[]` : une entrée par niveau avec `id`, `libelle`, `model`, `effort`,
      `effortLibelle`, `source`. Les trois libellés sont « performant », « standard », « économe ».
- [ ] Sans `.vectorz/release-passes.yml`, les passes du socle ont `source: defaut` ; avec le
      fichier, les passes déclarées ont `source: projet`.
- [ ] `contracts/config-show/v2/schema.json` et `example.json` sont régénérés, et un test vérifie
      que le schéma et le zod disent la même chose.
- [ ] La page Configuration de cop1 lit la v2 : passes avec leur origine, commande de tests,
      libellés français, sans copie locale des niveaux. Un contrat v1 est refusé avec un message clair.
- [ ] `ezk config show` (texte) et `--json` affichent les mêmes libellés français.
- [ ] `ezk config integration <stratégie>` écrit la clé `integration` dans `.vectorz/config.yml`
      sans toucher aux clés voisines ; une stratégie inconnue est refusée avant écriture.

## Comment vérifier

```bash
ROOT="$(git rev-parse --show-toplevel)"
ezk --root "$ROOT" config show --json | jq '{schema_version, releaseGate, niveaux}'
# attendu : schema_version 2 ; releaseGate.passes avec source ; niveaux avec libelle et effortLibelle

ezk --root "$ROOT" config show                       # mêmes libellés en texte
ezk --root "$ROOT" config integration push-ff
grep -n integration "$ROOT/.vectorz/config.yml"      # la clé écrite, les voisines intactes

pnpm --dir products/mega-city board:contract         # code 0 : les contrats rangés sont à jour
```

Tests à lancer :

```bash
pnpm --dir products/mega-city test -- src/__tests__/config-contract.test.ts
pnpm --dir products/cop1/packages/app test -- src/features/board   # ezkConfigSource.test.ts couvre translateConfig
```

Aucune preuve d'écran : l'écran garde ses pages, il lit des champs de plus.

## Glossaire

- `contrat JSON` — le format d'une sortie `--json` de la méthode, décrit une fois en zod et rangé
  dans `contracts/`. `schema_version` monte quand un champ change de forme.
- `niveau` — ce dont un agent a besoin : performant, standard ou économe. Le projet dit quel modèle
  et quel effort mettre derrière.
- `module` — un outil qui se branche autour de la méthode sans en faire partie : GitHub, CI, Codex.
- `passe` — un contrôle de la gate de release : un id, un titre, une commande.

## Notes / décisions

- Origine : [la carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écarts E5, E7 et E6 (pages Configuration, Process, Plugin).
- E6 est déjà couvert par [Piloter le plugin github par la config](done/20260920111652514_piloter-plugin-github-config.md).
  La fiche ne garde que le verbe `integration`, dont la stratégie vient de
  [Sans PR, intégrer par push en avance rapide](done/20261004083838687_integrer-sans-pr-par-avance-rapide.md).
- Vocabulaire : ce qu'une config allume s'appelle « module », pas « plugin » ni « intégration »
  (glossaire du dépôt, `docs/glossaire-jargon-ezk.md:122`).
- Les libellés français viennent des fiches livrées
  [Régler le modèle et l'effort de chaque agent](done/20261002205205417_modele-effort-agents-par-projet.md)
  (glossaire, ligne 199) et
  [Config des modèles : le schéma à deux portées](done/20261013132218242_config-modeles-schema-et-resolveur-pur.md).
- Règle d'architecture : [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md),
  la méthode publie, mission control consomme.
- Dépendance : [La gate de release joue les tests du projet](done/20261114131613314_gate-de-release-joue-les-tests.md),
  pour publier une commande de tests non nulle.
- Voisines : [`ezk release passes`](done/20261114131616085_ezk-release-passes-list-add-remove.md) règle
  les passes publiées ici ; [`ezk release verdict`](done/20261114131615903_ezk-release-verdict-par-commande.md)
  pose les verdicts que l'écran montrera ensuite.
- Risque : la v2 casse un cop1 non mis à jour. Le lot livre les deux côtés ensemble ; le traducteur
  dit « schema_version inconnu » plutôt que d'afficher du faux.
