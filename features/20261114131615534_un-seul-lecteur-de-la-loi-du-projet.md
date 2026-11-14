---
id: "20261114131615534"
title: "Un seul lecteur de la loi du projet : `law show` lit aussi le contrat, `rules show` en devient une vue"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [loi, contrat]
status: idea
blocked:
pr:
evidence: none # une commande publiée, aucun écran modifié
created: 2026-11-14
---

# 20261114131615534 — Un seul lecteur de la loi du projet : `law show` lit aussi le contrat, `rules show` en devient une vue

**En clair.** Un projet peut ajouter ses propres règles dans un petit contrat et dire ce qui tient
chacune : un contrôle automatique, une revue, ou un simple conseil. Aujourd'hui deux commandes lisent
la loi d'un projet chacune de son côté, et la seconde n'a pas de format publié ; l'écran Loi ne peut
donc pas remplir ses colonnes « Réglé par » et « Garantie ». Une seule commande lira tout et publiera
l'origine et la garantie de chaque règle, plus l'état du contrat ; l'autre en deviendra une vue filtrée.

**Si tu arrives frais.** La *loi* d'un projet est le fichier compilé `.iamthelaw/ENTRY.md`. Le
*contrat du projet* est `.vectorz/rules.yml` et `.vectorz/rules/<id>.md` : des règles propres au
projet et, pour chacune, sa *garantie* : une *gate* (un contrôle que le projet exécute), une revue, ou
un conseil. `ezk rules apply` en écrit le jeu composé dans `.claude/rules/vectorz-project.md`.

## Contexte / Problème

Ce que l'écran attend. La table Règles de la page Loi a deux colonnes à remplir : « Réglé par »
(méthode, profil lié, ce projet) et « Garantie » (gate du projet, revue liée, conseil ; « méthode »
pour une règle de la méthode). L'en-tête veut une ligne d'état du contrat : valide, N erreurs,
appliqué ou à appliquer. Le panel du 11 novembre prévoyait deux sources, un contrat `rules-show/v1` à
créer et un `rules check --json` ; la carte du 14 novembre retient plutôt « un seul lecteur ».

Ce que le code fait aujourd'hui (lecture du 14 novembre) :

- Un second lecteur existe : `ezk rules show --json` publie `root`, `rootKind`, `sha`, `digest`,
  `hasContract` et `rules[]` avec `origin` (global | local), `guarantee` (kind : gate | review | hook
  | agent-check | advisory | unguarded-must, ref) et `label`.
  `products/mega-city/src/io/rules-command.ts:94-112` ; `products/mega-city/src/core/project-rules.ts:66-81`.
- Vérifié sur vectorz le 14 novembre : `hasContract` faux, `rules` vide. Pas de `.vectorz/rules.yml`,
  seul `.vectorz/rules.example.yml`.
- Aucun contrat versionné : `products/mega-city/contracts/` n'a pas de dossier `rules-show`, et la
  sortie n'a pas de `schema_version`.
- `rules check` ignore `--json` et rend du texte.
  `products/mega-city/src/io/rules-command.ts:85-92`.
- Une erreur de contrat coupe le JSON de `show` : message sur stderr, code 1, rien publié.
  `products/mega-city/src/io/rules-command.ts:77-83`.
- L'état « appliqué ou non » n'est jamais publié. `apply` dit created / updated / unchanged au moment
  d'écrire ; `show` ne compare pas. Les deux fonctions nécessaires existent pourtant :
  `renderProjectRules` et `isManagedProjectRules`.
  `products/mega-city/src/io/project-rules-file.ts:58-67` ; `products/mega-city/src/core/project-rules.ts:32` et `:309`.
- `law show` ignore `.vectorz` : son entrée est le catalogue et deux fichiers de loi.
  `products/mega-city/src/core/law-show.ts:105-109` ; `products/mega-city/src/io/law-show.ts:29-35`.
- Mission control ne lit pas `rules show` : aucun lecteur dans `products/cop1`. L'ancien cockpit le
  lisait pour sa section « règles propres » ; cet écran est retiré (ADR-086).
- Le seul flux qui crée un contrat aujourd'hui est la rétro : règle dans `.vectorz/rules/`, binding
  dans `rules.yml`, puis `ezk rules check` et `ezk rules apply`.
  `products/mega-city/skills/ezk-retro/SKILL.md:230`.
- Sur vectorz, la page paraîtra vide : 0 règle propre, 0 paquet choisi. Sur ce poste, le dépôt
  samplerz (`~/git/samplerz`) porte un contrat : `.vectorz/rules.yml` et sept règles dans
  `.vectorz/rules/`, toutes en conseil (`advisory`), aucune gate. C'est le banc que l'ADR-0050
  (condition 6) exige ; la règle gate qu'elle demande n'y est pas encore.

## Proposition

1. **Un seul lecteur.** `lawInput` (`products/mega-city/src/io/law-show.ts`) branche
   `loadProjectRules` (`src/loaders/project-rules.ts:90`) et `composeProjectRules`
   (`src/core/project-rules.ts:178`). Le cœur pur reçoit le résultat ; il ne lit aucun fichier.
2. **Deux champs par règle.** Chaque entrée de `regles[]` gagne `origine` ∈ {methode, profil, projet}
   et `garantie` {kind ∈ gate | revue | hook | agent | conseil | must-sans-garde, ref}. Les valeurs
   viennent de `composeProjectRules`, sans second calcul. Sans la fiche `ezk law status`, `origine`
   vaut methode ou projet.
3. **Un bloc `contrat`.** {present, fichier, bundles_choisis[], empreinte, erreurs[] (message,
   fichier, regle), applique ∈ a-jour | a-appliquer | absent | non-gere}. Une erreur de contrat ne
   coupe plus le JSON : elle est listée.
4. **`applique` se calcule.** Il compare `.claude/rules/vectorz-project.md` au rendu courant
   (`renderProjectRules`) et dit `non-gere` si le marqueur d'ezk manque (`isManagedProjectRules`).
5. **Le contrat `law-show` reste en version 1.** Le jeu d'essai du contrat
   (`products/mega-city/src/io/law-contract-files.ts`) gagne un `.vectorz/rules.yml` factice avec une
   règle gate, une revue et un conseil. Schéma et exemple régénérés par `pnpm law:contract --write`.
6. **Le sort de `ezk rules show`.** Décision du PO du 14 novembre : « on le garde, comme vue
   documentée et mince de `law show` : un seul moteur, `rules show` = `law show` filtré. ADR-0062 et
   la rétro s'en servent : pas de retrait, pas d'implémentation parallèle. » La fiche en déduit :
   `rules show` filtre sur les règles du projet, `rules check --json` rend le bloc `contrat.erreurs`.
   L'ADR-0062 cite `rules show` comme lecteur de la page config ; la rétro enchaîne `rules check`
   puis `rules apply`. Les deux continuent de marcher.
7. **Le nom du dossier `.vectorz` reste écrit à un seul endroit** : `RULES_MANIFEST_FILE`
   (`src/core/project-rules.ts:25`). L'ordre avec la fiche
   [Le dossier de contrat d'un projet porte le nom de la méthode](20261101162826995_renommer-le-dossier-contrat-vectorz.md)
   (différée) se fixe au grooming.

Hors périmètre : les verbes d'écriture prévus par le panel (`rules add`, `rules bind`, `rules remove`,
`rules bundles` ; aujourd'hui `check`, `show`, `apply` seulement) ; la page Loi côté mission control
(fiche cop1 sœur) ; le contrat `rules-show/v1` prévu par le panel, que ce bloc remplace.

## Critères d'acceptation

- [ ] `ezk law show --root <projet> --json` : chaque règle de `regles[]` porte `origine` (methode,
  profil ou projet) et `garantie` (kind, ref) ; les valeurs sont celles de `composeProjectRules`.
- [ ] Le même JSON porte un bloc `contrat` : présent, fichier, paquets choisis, empreinte, erreurs
  (message, fichier, règle) et `applique` ; une erreur de contrat ne coupe plus la sortie.
- [ ] `applique` vaut `a-jour` quand `.claude/rules/vectorz-project.md` égale le rendu courant,
  `a-appliquer` sinon, `absent` sans fichier, `non-gere` si le fichier n'est pas celui d'ezk.
- [ ] Le contrat `law-show` reste en version 1 ; le jeu d'essai porte une règle gate, une revue et un
  conseil, et le schéma et l'exemple décrivent `origine`, `garantie` et `contrat`.
- [ ] `ezk rules show --json` et `ezk rules check --json` rendent le même cœur que `law show` : pour
  une même règle, jamais deux garanties différentes.
- [ ] Sur samplerz, les sept règles propres sortent avec `origine: projet` et `garantie.kind: conseil` ;
  sur vectorz, `contrat.present` est faux et aucune règle n'a `origine: projet`.

## Comment vérifier

```bash
# vectorz : pas de contrat, la sortie reste complète
ezk --root "$(git rev-parse --show-toplevel)" law show --json | jq '.contrat'
# samplerz : un autre dépôt du poste, le seul avec un contrat (sept règles en conseil)
S=~/git/samplerz
ezk --root "$S" law show --json | jq '.contrat, [.regles[] | select(.origine == "projet") | {id, garantie}]'
ezk --root "$S" rules show --json | jq '[.rules[] | {id, guarantee}]'      # les mêmes garanties
ezk --root "$S" rules check --json | jq '.erreurs'
# Contrat et tests
pnpm --dir products/mega-city law:contract
pnpm --dir products/mega-city test -- src/__tests__/law-show.test.ts src/__tests__/project-rules.test.ts src/__tests__/project-rules-io.test.ts
```

Aucun écran ne change : pas de preuve avant / après.

## Glossaire

- `contrat du projet` — `.vectorz/rules.yml` (paquets choisis, bindings) et `.vectorz/rules/<id>.md` (les règles propres) ; absent, le projet n'a aucune règle propre.
- `garantie` — ce qui tient une règle : une gate que le projet exécute, une revue, un hook, un contrôle d'agent, ou rien (conseil) ; `must-sans-garde` signale un MUST que rien ne vérifie.
- `gate` — une commande ou un job que le projet lance lui-même ; la méthode ne l'exécute jamais.
- `origine` — qui pose la règle : la méthode (catalogue), le profil lié, ou le projet lui-même.

## Notes / décisions

- Origine : la [carte des écarts du 14 novembre](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md),
  écart D3 ; la carte y range aussi, pour l'écart I3, le sort de `rules show`, décidé ici une fois.
  Capture du [panel Loi / Annuaire du 11 novembre](../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md), § 3 et § 6.
- Décision du PO du 14 novembre : `ezk rules show` reste, vue documentée et mince de `law show` ; un
  seul moteur ; ni retrait, ni implémentation parallèle (point 6 ci-dessus).
- Dépend de : [`ezk law status`](20261114131615164_ezk-law-status-profil-et-fraicheur.md) pour la
  valeur « profil » d'`origine`. Sans elle, `origine` vaut methode ou projet.
- Voisine : [`ezk law show` sert chaque objet de la loi](20261114131615350_ezk-law-show-regle-paquet-profil.md).
- Fiches livrées en amont :
  [Des règles propres à un projet](done/20260910152227744_regles-projet-local-couche-vectorz.md)
  ([ADR-0050](../products/mega-city/docs/adr/0050-couche-regles-projet-local.md)) ;
  [Une règle de rétro peut rester dans le projet où elle est née](done/20261101154419684_retro-cible-projet.md)
  (seul producteur de contrat, source d'un jeu d'essai réaliste) ;
  [Cockpit : la page « config » du projet choisi](done/20261004192802964_cockpit-page-config-en-sections.md)
  (écran retiré ; la copie de test que cite la carte n'a pas été retrouvée dans `products/cop1`).
- Idées parkées liées : [Cadrer toute la problématique des règles](20260910155608287_problematique-regles-ezk-typologie-verification-mesure.md) ;
  [Recette « site produit »](20260821172716540_recette-site-produit-regles-activables.md) (porte le cas samplerz).
- ADR : [ADR-0062](../products/mega-city/docs/adr/0062-le-tableau-de-bord-devient-le-cockpit-multi-projets.md)
  (lecteurs de la page config) ; [ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md).
- Risque : sur vectorz la preuve est vide ; la fiche ne se coche que sur samplerz ou sur le jeu d'essai.
