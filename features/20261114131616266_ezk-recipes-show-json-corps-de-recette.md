---
id: "20261114131616266"
title: "`ezk recipes show <id> --json` publie le corps d'une recette"
type: feature
priority: P2
product: mega-city
milestone: board
version:
labels: [recettes, contrat]
status: idea
blocked:
pr:
evidence: none # une commande publiée, aucun écran modifié
created: 2026-11-14
---

# 20261114131616266 — `ezk recipes show <id> --json` publie le corps d'une recette

**En clair.** La vue Recettes de mission control liste les recettes, mais ne peut pas en ouvrir une :
la méthode ne publie que neuf champs par recette, jamais son contenu. On ajoute une commande qui
publie une recette entière en données : ses sections, les recettes qu'elle compose, le chemin réel
de son implémentation. La liste gagne aussi les comptes par statut, calculés par la méthode ; l'écran
pourra ouvrir une page Recette sans rien deviner.

**Si tu arrives frais.** Une recette est un savoir-faire réutilisable, écrit en Markdown dans
`recipes/*.md`, avec un en-tête de champs (le front-matter) et dix sections fixes. Un contrat JSON
est le format versionné d'une commande `ezk … --json` ; mission control le lit sans relire les
fichiers (ADR-086).

## Contexte / Problème

Ce que l'écran attend : la maquette a une page Catalogue, avec les comptes par statut, et une page
Recette, avec le corps, les recettes composées et la source résolue. C'est l'écart G1 de la
[carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

Ce que le code publie le 14 novembre :

- `ezk recipes --json` publie deux listes, `catalogue` et `projet`, avec neuf champs plats par
  recette : id, title, makes, status, source, dir, complete, ici, missing. Contrat en
  `schema_version` 1 :
  `products/mega-city/contracts/recipes/v1/schema.json`.
- La commande ne lit qu'un drapeau `--json`
  (`products/mega-city/bin/ezk-recipes.ts:75`). Le manifeste ne déclare ni verbe ni argument pour
  le domaine `recipes` (`products/mega-city/ezk-manifest.yml:300-304`). Aujourd'hui,
  `ezk recipes show` affiche la liste texte : l'argument est ignoré.
- Les champs `composes`, `home`, `created`, `updated` sont dans le front-matter des 16 recettes,
  posés à la création par `products/mega-city/src/core/recipe-frontmatter.ts:44-56`. Le contrat ne
  les publie pas. Quatre recettes ont un `composes` non vide.
- La source résolue existe en interne : `resolveSource`
  (`products/mega-city/src/core/recipe-discovery.ts:86-91`) développe `~` et les chemins relatifs.
  Elle ne sert qu'à calculer `ici` (lignes 123-127) ; elle n'est jamais publiée.
- Aucun compte par statut. `products/mega-city/bin/regen-recipes.sh:63-69` pose une pastille par
  ligne. La vue Recettes calcule ses totaux elle-même
  (`products/cop1/packages/web/src/board/RecipesView.tsx:104,111,151`), sans ventilation par statut.
- Le corps d'une recette suit les dix sections du gabarit `recipes/RECIPE_TEMPLATE.md:21-85` : En
  clair, Ingrédients, Ustensiles, Préliminaires, Le concept, Exemples pour goûter, Les étapes,
  Checklist, Fichiers de référence, Statut. Rien ne les publie.

Fait du 14 novembre, sur ce poste : 16 recettes au catalogue, 13 `draft`, 3 `ready`. Deux sont
« ici » depuis ce worktree, trois depuis le dossier principal : la source de `secrets-trousseau`
est un chemin absolu vers `~/git/bacasable/vectorz`.

## Proposition

POC d'abord : une commande, un contrat étendu, pas d'écran.

- `ezk recipes show <id> --json [--root <projet>]` publie une seule recette :
  - les champs du front-matter : id, title, makes, status, source, composes, home, created, updated ;
  - `source_resolue` : chemin absolu, `~` développé, ou `null` si la source est vide ;
  - `dir`, `complete`, `missing`, `ici`, comme dans la liste ;
  - `sections[]` : une entrée par section du gabarit, dans l'ordre, avec son titre et son texte
    Markdown brut. Le rendu reste à l'écran.
  - Un id inconnu sort avec un code de retour non nul et un message ; jamais un JSON deviné.
- `ezk recipes --json` ajoute `source_resolue` à chaque recette et un bloc `comptes`, pour le
  catalogue et pour le projet : total, par statut, complètes, incomplètes. La méthode compte,
  l'écran affiche ([ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md),
  décision 1, point 2).
- Le manifeste déclare le verbe `show` et son argument, comme `board show` et `law show`. Sans
  verbe, `ezk recipes` et `ezk recipes --json` ne changent pas.
- Le contrat suit la recette
  [Publier les données d'un outil par un contrat JSON versionné](../recipes/publier-un-contrat-json-versionne.md) :
  producteur strict, schéma publié tolérant, exemple généré sur une fixture, test de contrat.
- Le format des sections n'est pas redéfini ici : il est celui de la fiche livrée
  [« Recette » comme artefact de premier rang](done/20260824185422122_recette-artefact-premier-rang-et-gardien.md).
- Hors périmètre : la page Recette et les comptes à l'écran, portés par la fiche sœur
  [Mission control montre une recette](20261114131616451_mission-control-montre-une-recette.md) ;
  la recette comme nœud du graphe de la méthode (décision journalisée dans la fiche sœur) ; la
  suggestion de recettes par projet
  ([Suggérer les recettes à implémenter par projet](20261029093423195_suggerer-recettes-par-projet-dashboard.md)).

## Critères d'acceptation

- [ ] `ezk recipes show <id> --json` rend une recette avec ses champs de front-matter,
      `source_resolue`, `dir`, `complete`, `missing`, `ici` et `sections[]` dans l'ordre du gabarit ;
      chaque section porte son titre et son texte Markdown.
- [ ] Un id inconnu sort avec un code de retour non nul et un message qui nomme l'id ; jamais un
      JSON vide ou deviné.
- [ ] `ezk recipes --json` publie `source_resolue` pour chaque recette et un bloc `comptes` pour le
      catalogue et le projet : total, par statut, complètes, incomplètes.
- [ ] Le contrat `recipes` reste en `schema_version` 1 : des champs ajoutés, aucun retiré ni renommé ;
      `schema.json` et `example.json` sont régénérés, le test de contrat passe, et la vue Recettes
      d'aujourd'hui lit la liste sans changement.
- [ ] Le manifeste déclare le verbe `show` et son argument pour `recipes` ; l'aide de la méthode
      liste ce verbe ; sans verbe, la sortie texte et la sortie JSON ne changent pas.
- [ ] Depuis le dossier principal de ce poste, `secrets-trousseau` a une `source_resolue` absolue
      sous `~/git/bacasable/vectorz` et `ici: true` ; depuis un worktree, la même `source_resolue`
      et `ici: false`.

## Comment vérifier

```bash
ROOT=/Users/elzinko/git/bacasable/vectorz        # le dossier principal, pas un worktree
ezk --root "$ROOT" recipes show 20261003164801823 --json | jq '{id, title, status, source_resolue, ici, sections: (.sections | length)}'
ezk --root "$ROOT" recipes show inconnu --json ; echo "exit=$?"          # attendu : code non nul, un message
ezk --root "$ROOT" recipes --json | jq '.comptes'
ezk --root "$ROOT" recipes --json | jq '[.catalogue[] | select(.ici)] | length'   # 3 ici ; 2 depuis un worktree
ezk help recipes
pnpm --dir products/mega-city board:contract      # code 1 si schema.json ou example.json n'est plus à jour ; --write régénère
pnpm --dir products/mega-city test -- src/__tests__/board-contract.test.ts src/core/__tests__/recipe-discovery.test.ts
```

- Le contrat vit sous `products/mega-city/contracts/recipes/v1/`. Le schéma et l'exemple sont rendus
  par `products/mega-city/src/io/contract-files.ts` (lignes 55-57 et 279-280), écrits par
  `board:contract --write` et gardés par `src/__tests__/board-contract.test.ts:209-212`. Il n'existe
  pas de script `recipes:contract` ; le test de contrat propre à `recipes show` reste à écrire.
- Pas de preuve d'écran : une commande.

## Glossaire

- `front-matter` — l'en-tête YAML d'un fichier Markdown, entre deux lignes `---`.
- `contrat JSON versionné` — la sortie `--json` d'une commande, décrite par un schéma publié avec un
  numéro de version, un exemple et un test.
- `source résolue` — le chemin absolu de l'implémentation de référence d'une recette, une fois `~`
  et les chemins relatifs développés.
- `dossier principal` / `worktree` — le clone de vectorz sous `~/git/bacasable/vectorz`, et les
  copies de travail isolées que Claude Code crée sous `.claude/worktrees/`.

## Notes / décisions

- Origine : la [carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md)
  du 14 novembre, écart G1 ; pilote « Oui, crée-les ». Statut `idea` : le PO tranche.
- Lignée : la paire livrée le 4 novembre,
  [`ezk recipes --json` publie le catalogue](done/20261104090518008_ezk-recipes-json.md) côté méthode
  et [Mission control montre les recettes](done/20261104090518109_mission-control-montre-les-recettes.md)
  côté cop1. Cette fiche est la moitié méthode de la nouvelle paire ; la moitié cop1 est
  [Mission control montre une recette](20261114131616451_mission-control-montre-une-recette.md).
- Fiches voisines :
  [Découvrir les recettes applicables depuis un projet hôte](done/20261023120000001_declarer-outils-recettes-methodes-projet.md) ;
  [Un test vérifie que chaque écran montre ce que la méthode publie](20261104204526516_controle-auto-des-ecrans-mission-control.md),
  qui a consigné le piège « 2 recettes au lieu de 3 selon le dossier lu ».
- À trancher au grooming : les noms exacts des clés (`source_resolue`, `comptes`, `sections`), en
  français comme `ici` ou en anglais comme le reste du contrat ; et la grammaire `recipes show <id>`
  plutôt que `recipes <id>`, forme retenue parce que les autres domaines publient par `show`.
- Risque : le contrat est un `strictObject` zod (`recipe-discovery.ts:54,73`) ; ajouter un champ
  oblige à régénérer schéma, exemple et test. Côté cop1, `translateRecipes`
  (`ezkRecipesSource.ts:67-73`) tolère des clés en plus : l'ajout est compatible.
- Risque : la recette du contrat note une sortie coupée à 64 Ko sur `ezk board show --json | …` ;
  `show` publie une recette à la fois, la liste ne porte pas les corps.
- Priorité P2 : la liste tourne déjà ; le corps et les comptes sont un confort de lecture, sans
  urgence PO enregistrée sur les recettes.
