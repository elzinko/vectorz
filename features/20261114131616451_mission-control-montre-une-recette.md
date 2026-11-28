---
id: "20261114131616451"
title: "Mission control montre une recette : corps, sections, et où elle est implémentée"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [recettes, theme:mission-control]
status: ready
blocked:
depends: ["20261114131616266"]
pr:
evidence: before-after
created: 2026-11-14
---

# 20261114131616451 — Mission control montre une recette : corps, sections, et où elle est implémentée

**En clair.** Dans mission control, une recette n'est qu'une carte dans une liste : on ne peut ni
l'ouvrir ni savoir dans quels projets elle est implémentée, hors le projet affiché. On ajoute une
page Recette qui montre le corps de la recette, section par section, et la liste des projets
inscrits où elle est déjà implémentée ; le Catalogue affiche les comptes par statut publiés par la
méthode. Tu lis une recette sans ouvrir le dépôt, et tu vois d'un coup d'œil où elle sert déjà.

**Si tu arrives frais.** Une recette est un savoir-faire réutilisable, écrit en Markdown dans le
dépôt de la méthode. Mission control est l'écran de cop1 ; son daemon est le programme de fond qui
appelle `ezk … --json` et sert les pages ; l'écran ne déduit rien lui-même (ADR-086).

## Contexte / Problème

Ce que l'écran attend : la page Recette de la maquette (corps, sections, « implémentée dans ») et
les comptes de la page Catalogue. Ce sont les écarts G1 et G2 de la
[carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

Ce que le code fait le 14 novembre :

- La vue Recettes (`products/cop1/packages/web/src/board/RecipesView.tsx`) affiche deux listes
  depuis la route `/api/recipes/<projet>` (`RecipesView.tsx:55`). Aucune page par recette, aucune
  route par id.
- Le daemon lance `ezk recipes --json` pour le seul projet affiché
  (`products/cop1/packages/app/src/features/board/ezkRecipesSource.ts:78`), avec une mémoire de
  cinq minutes (ligne 12). La route est posée dans
  `products/cop1/packages/app/src/features/daemon/infrastructure/HttpServer.ts:159-161` et 311-312.
- Le champ `ici` dit si une recette est implémentée dans le projet visé
  (`products/mega-city/src/core/recipe-discovery.ts:123-127`). Rien ne dit où elle l'est ailleurs.
  La `source` est publiée brute, `~` non développé.
- La méthode ne connaît pas les projets de cop1
  ([ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md), décision 1,
  point 5). Le croisement est donc à faire côté cop1 ; le daemon connaît la racine de chaque projet
  inscrit (`products/cop1/packages/app/src/features/board/mapsService.ts:72`).
- La vue calcule ses totaux elle-même (`RecipesView.tsx:104,111,151`), sans compte par statut. ADR-086
  veut des comptes déjà interprétés par la méthode.
- Rendu Markdown : cop1 a `products/cop1/packages/web/src/board/inlineMarkdown.tsx` (gras, italique,
  code, paragraphes, puces). Le corps d'une recette a aussi des titres, des listes numérotées, des
  cases à cocher et des blocs de code (gabarit `recipes/RECIPE_TEMPLATE.md:21-85`).
- Le graphe de la méthode n'a pas de nœud recette : `products/mega-city/src/core/graph.ts:27` liste
  rule, agent, skill, bundle, profile, tool ; `products/mega-city/bin/regen-composes-graph.ts:5-6`
  ne trace que le `composes:` des skills. La question est déjà posée par
  [l'ADR-0040](../products/mega-city/docs/adr/0040-modele-fichiers-ezk-compile-schema-valide.md)
  (lignes 179-180 ; point 8 du plan, ligne 292, non coché) et par un critère non coché, lignes 130-131, de
  [la fondation du modèle de fichiers](done/20260826122532943_fondation-modele-fichiers-ezk-avant-recettes.md).

Comptes du 4 novembre, selon
[Les recettes du catalogue rattachées au projet qui les implémente](done/20261104103403956_recettes-rattachees-au-projet-qui-les-implemente.md) :
muti 6, samplerz 1, vectorz 3. Piège consigné dans
[Un test vérifie que chaque écran montre ce que la méthode publie](20261104204526516_controle-auto-des-ecrans-mission-control.md) :
une instance lancée depuis un worktree voit 2 recettes pour vectorz, le dossier principal en voit 3.

## Proposition

POC d'abord : une route, une page, les comptes. La méthode publie d'abord
([`ezk recipes show <id> --json`](20261114131616266_ezk-recipes-show-json-corps-de-recette.md)).

- Le daemon ajoute la route GET `/api/recipes/<projet>/<id>`, servie par
  `ezk recipes show <id> --json --root <racine>`, avec la même mémoire que la liste.
- La page Recette s'ouvre depuis la liste, « Dans ce projet » ou « Catalogue ». Elle montre le titre,
  ce que la recette fabrique, son statut, sa source résolue, ses dates, puis ses sections rendues
  dans l'ordre du gabarit. Les recettes qu'elle compose sont des liens vers leur page.
- « Implémentée dans : muti, samplerz… » : la page croise la `source_resolue` publiée avec les
  racines des projets inscrits dans mission control, projet affiché compris. Autre voie possible :
  relire `ezk recipes --json` par projet, avec la mémoire existante. Jamais en lisant `recipes/*.md`.
- Le Catalogue affiche les comptes par statut depuis le bloc `comptes` publié ; la page ne calcule
  plus ses totaux.
- Le rendu Markdown étend `inlineMarkdown.tsx` (titres, listes numérotées, cases à cocher, blocs de
  code) plutôt que d'ajouter une bibliothèque. À vérifier au grooming.
- Sans données, ou avec un format inconnu, la page dit pourquoi (ADR-086, décision 1, point 6).
- Le carnet de tests `.vectorz/carto/mission-control.yml` déclare la page Recette, comme écran ou
  comme action de l'écran `recipes` (lignes 80-84).
- Hors périmètre : trancher ici si la recette devient un nœud du graphe ; la décision est
  journalisée dans cette fiche avant le build, comme reprise du point 8 de l'ADR-0040. La suggestion
  de recettes par projet reste dans
  [Suggérer les recettes à implémenter par projet](20261029093423195_suggerer-recettes-par-projet-dashboard.md),
  bloquée sur sa maquette. Le compte de recettes par projet dans la vue Projets est une piste pour
  [la page d'accueil, une ligne par projet](20261002115451451_page-une-ligne-par-projet.md).

## Critères d'acceptation

- [ ] Depuis la vue Recettes, chaque recette s'ouvre en page Recette : titre, ce qu'elle fabrique,
      statut, source résolue, dates, et ses sections rendues dans l'ordre du gabarit, titres et
      listes compris.
- [ ] Les recettes qu'elle compose sont des liens vers leur page ; une recette composée inconnue
      s'affiche en texte, sans lien cassé.
- [ ] La page affiche « Implémentée dans » avec le nom de chaque projet inscrit dont la racine
      contient la source résolue, projet affiché compris ; sans aucun, elle le dit.
- [ ] Le Catalogue affiche les comptes par statut (total, par statut, complètes, incomplètes) depuis
      le bloc `comptes` publié ; la page ne calcule plus aucun total elle-même.
- [ ] Toutes les données viennent de `ezk recipes show <id> --json` et `ezk recipes --json`, par le
      daemon ; la page ne lit jamais `recipes/*.md`. Sans réponse, ou avec un `schema_version`
      inconnu, la page dit pourquoi.
- [ ] Les tests de cop1 lisent un exemple JSON rangé dans le dépôt, à jour du contrat `recipes`
      enrichi ; la page Recette est déclarée au carnet de tests.
- [ ] La décision « la recette devient-elle un nœud du graphe ? » est journalisée dans cette fiche
      avant le build, en reprise du point 8 de l'ADR-0040, jamais tranchée en silence.

## Comment vérifier

```bash
ROOT=/Users/elzinko/git/bacasable/vectorz        # le dossier principal, pas un worktree
ezk --root "$ROOT" recipes show 20261003164801823 --json | jq '{source_resolue, ici, sections: (.sections | length)}'   # la méthode répond d'abord
pnpm vitest run products/cop1/packages/app/src/features/board
pnpm --dir products/cop1/packages/web exec vitest run src/board
```

Puis ouvrir mission control lancé depuis le dossier principal, vue Recettes du projet vectorz :

- ouvrir « Ranger des secrets dans le trousseau macOS, que l'agent lit sur demande » : les dix
  sections s'affichent, et « Implémentée dans : vectorz » ;
- ouvrir une recette dont la source mène à muti : « Implémentée dans : muti » ;
- le Catalogue affiche 16 recettes, 3 `ready`, 13 `draft`, et « Dans ce projet : 3 » pour vectorz
  (2 si l'instance lit un worktree : c'est le piège du 4 novembre, pas un bug de la page).

Preuve avant/après dans `docs/pr-evidence/20261114131616451/` : la liste sans page (avant), la page
Recette et les comptes du Catalogue (après), sur le modèle de `docs/pr-evidence/20261104090518109/`.

## Glossaire

- `daemon` — le programme de fond de mission control, qui appelle `ezk` et sert les pages à l'écran.
- `source résolue` — le chemin absolu de l'implémentation de référence d'une recette, `~` développé.
- `dossier principal` / `worktree` — le clone de vectorz sous `~/git/bacasable/vectorz`, et les
  copies de travail isolées que Claude Code crée sous `.claude/worktrees/`.

## Notes / décisions

- Origine : la [carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md)
  du 14 novembre, écarts G1 et G2 ; pilote « Oui, crée-les ». Statut `idea` : le PO tranche.
- Dépend de [`ezk recipes show <id> --json`](20261114131616266_ezk-recipes-show-json-corps-de-recette.md),
  seule propriétaire de l'extension du contrat (`source_resolue`, `comptes`, `sections`). Si cette
  fiche est tirée avant, `source_resolue` s'ajoute ici.
- Lignée : la paire livrée le 4 novembre,
  [`ezk recipes --json` publie le catalogue](done/20261104090518008_ezk-recipes-json.md) et
  [Mission control montre les recettes](done/20261104090518109_mission-control-montre-les-recettes.md).
- Décision à journaliser avant le build : la recette comme nœud du graphe (`NodeKind` + arêtes
  `composes:` entre recettes) ou catalogue à part. Reprise du point 8 de l'ADR-0040, pas un panel
  neuf ; une fiche chore à part si le PO veut la tracer.
- Au grooming, hors de cette fiche : une note datée dans
  [Suggérer les recettes à implémenter par projet](20261029093423195_suggerer-recettes-par-projet-dashboard.md)
  renvoie à cette paire (son blocage `design` porte sur la suggestion, pas sur ces pages) ; le test
  écran ↔ JSON de la vue Recettes s'ajoute à la fiche du contrôle des écrans, pas dans un test neuf.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. « La recette est-elle un nœud du graphe ? » : oui, depuis le sprint du 17 novembre « les recettes entrent dans le graphe et sur la carte ». La page marche avec ou sans ce nœud.
