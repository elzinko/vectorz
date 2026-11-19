> 🗎 Rendu de la fiche [features/20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md](../20261114131616818_mission-control-menu-par-portee-et-vocabulaire.md)

# 20261114131616818 — Mission control range son menu par portée et parle compétence, agent, commande, module

**En clair.** Le menu de mission control a trois groupes, Global, Projet et Méthode ; le groupe
« Méthode » donne l'impression que la méthode est un module branché sur l'écran, alors que c'est
l'inverse : l'écran lit la méthode. On range le menu par portée, « Global » et « Projet · nom », et
on corrige les mots des écrans : compétence, agent, commande, module ; lancements plutôt que runs ;
but du sprint plutôt que le nom de branche. Tu retrouves les mêmes mots à l'écran, dans la loi et
dans le glossaire, et le nom de la méthode ne sert plus que de titre à son Annuaire.

**Si tu arrives frais.** Mission control est l'écran de cop1 ; il lit ce que la méthode publie par
`ezk … --json` et ne déduit rien lui-même (ADR-086). Un module est un outil qui se branche à un
projet sans faire partie de la méthode : GitHub, la CI, la revue Codex (ADR-0039). Une compétence
est ce que le code appelle encore « skill ».

## Contexte / Problème

Ce que l'écran attend : l'amendement du 12 novembre de la
[capture du panel Loi / Annuaire](../../docs/captures/2026-11-11-panel-loi-projet-annuaire-maquette.md),
lignes 129 à 131. Le menu suit la portée : « Global » porte « Projets » et « Annuaire de la
méthode » ; « Projet · nom du projet » porte le reste. Le nom de la méthode ne vit plus que dans le
titre de la page Annuaire et son « i » (« lu par ezk »). L'écran parle Scrum ; « run » devient
« lancement ». C'est l'écart I2 de la
[carte des écarts](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

Ce que le code fait le 14 novembre, dans `products/cop1/packages/web/src/board/` :

- `Board.tsx:46-54` : le groupe Projet (Vue d'ensemble, Pilotage, Cadrage, Développement, Fiches,
  Chronologie, Configuration) ; `Board.tsx:56` : le groupe Global (« Tous les projets ») ;
  `Board.tsx:58-63` : le groupe Méthode (Process, Loi, Recettes, Cartes). Les trois titres sont
  rendus aux lignes 338, 352 et 366 ; le code dit « Méthode », la maquette du 11 novembre disait
  « Méthode mega-city ». Le test `Board.test.tsx:21` vérifie « la navigation Projet et Méthode ».
- `viewIds.ts:6-20` : treize vues, ni « annuaire » ni « objectifs ». Le carnet de tests
  `.vectorz/carto/mission-control.yml` déclare un écran par vue ; `cartoTree.test.ts:30-31` compare
  les deux listes.
- `ActivityTable.tsx:19` titre « Runs de cadrage récents » et « Runs de développement ».
- `OverviewView.tsx:129-130` lit le nom de branche d'un sprint comme son « objectif ». Or
  « Objectif » est le mot des milestones (décision PO du 11 novembre).
- `ConfigView.tsx:158` titre une carte « Intégration » (GitHub, Sans PR). Mais le champ
  `integration` du contrat `config-show` veut dire autre chose : « Sans PR : comment une story
  arrive sur main » (`products/mega-city/contracts/config-show/v1/schema.json:35-41`).
- Déjà conforme : `TimelineView.tsx:25,34` dit « jalon » pour le gate ; aucune forme `/ezk-x` ni le
  mot « plugin » dans `web/src/board`. La maquette, elle, dit encore « Plugins ».
- Côté méthode, les mots sont tranchés : « module » par l'amendement de
  [l'ADR-0039](../../products/mega-city/docs/adr/0039-trois-etages-moteur-methode-branchements-plugin.md)
  (lignes 137-146, « Plugin » écarté à cause des plugins Claude Code) et par
  `products/mega-city/taxonomie.yml:38` ; « compétence » par `products/mega-city/src/core/loi-view.ts:207,214` ;
  les ids `skill:<id>` et `agent:<id>` du contrat `law-show`. Restent « Plugin GitHub » dans
  `.vectorz/config.example.yml:9` et « plugin » dans `products/mega-city/bin/ezk-config.ts:2,17,241`.

Prérequis de la page Annuaire, hors de cette fiche : `ezk help` ne rend que du texte
(`products/mega-city/bin/ezk.ts:67-84`) ; `ezk graph check --json` existe
(`products/mega-city/bin/ezk-graph.ts:27,34-35`) sans contrat versionné.

## Proposition

Première coupe : le menu et les libellés. Le contenu de l'Annuaire vient avec son lot.

- Deux groupes. « Global » : « Projets » (l'actuel « Tous les projets »), « Carte de la méthode »
  et « Annuaire de la méthode ». « Projet · nom du projet » : Vue d'ensemble, Pilotage, Cadrage, Développement, Fiches,
  Chronologie, Process, Loi, Recettes, Cartes, Configuration. Le groupe « Méthode » disparaît.
- « Annuaire de la méthode » est présente mais grisée tant que la page n'existe pas. Son « i » nomme
  ce que la méthode doit publier d'abord :
  [`ezk help --json`](../done/20261114131613129_ezk-help-json-commandes-etage-famille.md) et
  [le graphe en contrat compilé](../20261114131614982_graphe-de-la-methode-en-contrat-compile.md).
- Pas d'entrée « Objectifs » grisée : Pilotage montre déjà les objectifs, les milestones (`PilotageView.tsx:73`).
  Le lot Objectifs ([Les objectifs publiés comme objets](../done/20261114131612572_objectifs-publies-comme-objets.md))
  tranche si Pilotage devient Objectifs, ou si une page s'ajoute.
- Libellés : « Lancements de cadrage récents » et « Lancements de développement » dans
  ActivityTable ; « But du sprint » à la place du nom de branche dans OverviewView (mot confirmé par
  le PO le 15 novembre) ; « Modules » à la place d'« Intégration » dans ConfigView, la ligne
  « Sans PR » gardant son nom.
- Vocabulaire des chaînes de l'écran : compétence (skill), agent, commande (`ezk <domaine> <verbe>`).
  Une forme `/ezk-x` n'apparaît que comme « rendu Claude Code » d'une compétence, jamais comme son
  identité : l'identité est l'id `skill:<id>` publié par `law show`.
- Les textes des « i » viennent de
  [`ezk glossaire show --json`](../20261114131616634_ezk-glossaire-show-json.md) quand il existe. En
  première coupe, le seul texte figé toléré est le « i » de l'entrée grisée.
- Hors périmètre : le contenu de l'Annuaire ; l'amendement d'ADR-086 décision 3 et « module » côté
  méthode (`config.example.yml`, `ezk config github`), portés par
  [Amendements d'ADR du 12 novembre](../done/20261114131614058_amendements-adr-du-12-novembre.md) ; la
  chronologie à deux niveaux (ADR-079 D11) : elle reprend l'écran livré par
  [Board : chronologie à 3 niveaux](../done/20261015082118382_board-chronologie-3-niveaux-accueil-projets.md), et aucune fiche du 14 novembre ne la porte.

## Critères d'acceptation

- [x] Le menu a deux groupes : « Global » (Projets, Carte de la méthode, Annuaire de la méthode) et
      « Projet · nom du projet » (Vue d'ensemble, Pilotage, Cadrage, Développement, Fiches,
      Chronologie, Process, Loi, Recettes, Cartes, Configuration) ; le groupe « Méthode » n'existe
      plus. Le groupe « Archives » ne change pas.
- [x] « mega-city » n'apparaît pas dans le menu, ni dans un titre de groupe ni dans une entrée ; il ne
      vit que dans le titre de la page Annuaire et dans son « i ».
- [x] L'entrée « Annuaire de la méthode » est grisée tant que la page n'existe pas, et son « i » nomme
      ce que la méthode doit publier ; aucune entrée « Objectifs » n'est ajoutée avant la décision du
      lot Objectifs.
- [x] Les écrans disent « Lancements … » au lieu de « Runs … », « But du sprint » au lieu du nom de
      branche lu comme objectif, « Modules » au lieu
      d'« Intégration » ; la ligne « Sans PR » garde son nom.
- [x] Les chaînes de l'écran disent compétence, agent, commande ; aucune forme `/ezk-x` n'y sert
      d'identité.
- [x] Un test de la vue vérifie les deux groupes et leur ordre ; le carnet de tests déclare toute vue
      ajoutée ; la page ne lit aucune donnée nouvelle hors `ezk … --json`.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web exec vitest run src/board/Board.test.tsx src/board/cartoTree.test.ts
grep -rn 'Runs de\|Intégration\|>Méthode<' products/cop1/packages/web/src/board --include='*.tsx' | grep -v '\.test\.'   # attendu : rien
grep -rn '/ezk-' products/cop1/packages/web/src/board    # attendu : rien
```

Puis ouvrir mission control sur vectorz : la barre de gauche a deux groupes, « Global » et
« Projet · vectorz » ; « Annuaire de la méthode » est grisée avec son « i » ; la Vue d'ensemble dit
« But du sprint » ; Configuration titre « Modules ». Preuve avant/après dans
`docs/pr-evidence/20261114131616818/` : la barre de gauche à trois groupes puis à deux ; la carte
« Intégration » puis « Modules » ; « Runs de cadrage récents » puis « Lancements de cadrage récents ».

Captures rangées (1440 px) : [menu avant](../../docs/pr-evidence/20261114131616818/menu-before.png),
[menu après](../../docs/pr-evidence/20261114131616818/menu-after.png),
[configuration après](../../docs/pr-evidence/20261114131616818/configuration-after.png),
[cadrage après](../../docs/pr-evidence/20261114131616818/cadrage-after.png),
[vue d'ensemble après](../../docs/pr-evidence/20261114131616818/overview-after.png).

## Glossaire

- `module` — ce qu'une config de projet allume ou éteint : un outil qui se branche à un projet sans
  faire partie de la méthode (GitHub, CI, Codex) ; mot emprunté à BMAD, « plugin » écarté (ADR-0039).
- `lancement` — le mot d'écran pour un run : une exécution de la méthode, lue dans le journal.
- `Annuaire de la méthode` — la page globale qui liste compétences, agents, règles, profils, commandes, glossaire et documents.

## Notes / décisions

- Origine : la [carte des écarts](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md)
  du 14 novembre, écart I2 ; pilote « Oui, crée-les ». Statut `idea` : le PO tranche.
- Décisions du PO relayées par la capture : menu par portée, pas par produit (amendement du 12
  novembre) ; « Objectif » reste le mot des milestones (11 novembre). Compétence, agent, commande,
  module entrent dans [ADR-086](../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  décision 3 par la fiche des amendements, dont celle-ci dépend.
- Décision A8 du PO du 14 novembre : aucun numéro court n'est stocké sur les fiches ; les ids
  horodatés restent ([Fiches datées](../done/0180-idees-sans-numero.md) tient). Si l'écran affiche un
  numéro court, c'est un affichage calculé par cop1, pas un champ de la méthode ni d'un contrat. Une
  note, pas un critère.
- Dépend de [Amendements d'ADR du 12 novembre](../done/20261114131614058_amendements-adr-du-12-novembre.md)
  et, pour les textes des « i », de
  [`ezk glossaire show --json`](../20261114131616634_ezk-glossaire-show-json.md).
- Fiches voisines : [Une page d'accueil, une ligne par projet](../20261002115451451_page-une-ligne-par-projet.md),
  qui devient l'entrée « Projets » ;
  [Un test vérifie que chaque écran montre ce que la méthode publie](../20261104204526516_controle-auto-des-ecrans-mission-control.md),
  qui porte déjà le contrôle « tout vient de `ezk --json` ».
- Risque restant : le « i » de l'entrée grisée est un texte figé, contre le critère strict « aucun
  texte figé » de l'écart I2. Écart assumé tant que `ezk glossaire show --json` n'existe pas.

### Grooming du 2026-11-19

Run autonome. La Carte de la méthode, livrée le 17 novembre, décrit la méthode entière, la même
pour tous les projets : elle va dans « Global », à côté de l'Annuaire. Le groupe « Archives » (lien
vers les archives v1) reste hors périmètre, inchangé. « But du sprint » est confirmé par le PO le 15 novembre (décisions de la coupe,
ADR-0088) : la réserve est levée. La dépendance aux
[Amendements d'ADR du 12 novembre](../done/20261114131614058_amendements-adr-du-12-novembre.md) est
livrée. Le Process, désormais l'écran de gauche à droite, passe dans le groupe « Projet » avec Loi,
Recettes et Cartes. Aucune dépendance externe.

Prête le 2026-11-19 : DoR atteinte, concurrence `ezk-pm` GO (run autonome, sans `--stamp-ready`).

### Revue adverse du 2026-11-19

Verdict GO, les six critères prouvés par le relecteur (`ezk-reviewer`). La seule ligne que rend la
recherche `/ezk-` est un chemin de fichier dans un test, pas une identité de compétence. Réserves
gardées :

- P2 : « run » reste dans quatre boutons et titres hors du périmètre de la fiche (« Lancer le run »,
  « Voir le run », « Étapes du run », « Tout le run »). À reprendre dans une suite, si le PO veut
  « lancement » partout.
- P3 : le « i » de l'Annuaire ne nomme que ce qui reste à publier (le graphe en contrat), puisque
  `ezk help --json` est déjà livré.



## Validation

| Modalité | Statut |
|---|---|
| Tests locaux | ✅ cop1, web 277, mega-city gate 49 suites |
| Revue adverse | ✅ GO ezk-reviewer, 6/6 critères prouvés |
| Before / after (UI) | ✅ docs/pr-evidence/20261114131616818/ |
