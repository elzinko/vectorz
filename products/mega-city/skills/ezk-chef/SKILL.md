---
name: ezk-chef
argument-hint: "[help|check|extract|regen|list]"
description: >-
  Hub de la famille d'artefacts « recette » (recipes/*.md) — le point d'entrée
  verbes pour tout ce qui touche une recette. A utiliser quand l'utilisateur
  veut « fais-en une recette », « capitalise cette feature en recette »,
  « extrais une recette depuis la fiche X », « ezk-chef », « vérifie / valide
  cette recette », « range le livre des recettes », ou liste ce qui existe
  déjà comme recette. Pilotable par sous-commandes : help, check (délègue le
  jugement à l'agent `ezk-chef` — gate mécanique + verdict GO/NO-GO), extract
  (produit un BROUILLON de recette `status: draft` depuis une fiche déjà
  shippée — cœur de ce sprint ; extraction depuis une implémentation de
  référence d'un autre projet : à venir), regen/list (réécrit
  `recipes/RECIPES.md` via `regen-recipes.sh`). Orchestrateur MINCE, façon
  `ezk-backlog` : il ne réimplémente pas le jugement de l'agent `ezk-chef`
  (déjà livré) ni le régénérateur du livre (déjà livré) — il les COMPOSE et
  ajoute la partie mécanique manquante (`extract`). N'EST PAS `ezk-ezk` (qui
  fabrique des *skills*, pas des recettes) ; `ezk-chef scan` (sourcer des repos
  froids, fiche 0147) est différé.
---

# ezk-chef

## En clair

`ezk-chef` est le **hub de la famille recette** : un skill de verbes qui ne juge jamais
lui-même — il délègue le jugement à l'**agent** `ezk-chef` (déjà livré, PR #192) et le
rangement mécanique à des scripts déterministes (déjà livrés pour `regen`/`list`, nouveau
pour `extract`). Même idiome que `ezk-backlog` (skill) / `ezk-reviewer` (agent) : le skill
pilote, l'agent tranche.

> **Ce skill ne juge jamais lui-même.** Toute question de qualité d'une recette (front-matter
> valide, pointeur réel, zéro code recopié, playbook en liste de tâches) est répondue par
> l'agent `ezk-chef`, pas ici.

## Usage (sous-commandes)

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau |
| `check [<fichier-ou-id>]` | **Délègue à l'agent `ezk-chef`** : gate mécanique (`regen-recipes.sh`, `check-links.sh`, front-matter) puis jugement (zéro code stocké, playbook + composes, En clair en tête) → verdict GO/NO-GO |
| `extract <id-fiche-shippée>` | Produit un **brouillon** `recipes/<slug>.md` (`status: draft`) depuis une fiche `features/done/<id>_*.md` — mécanique via `bin/ezk-chef-extract.sh`, jugement laissé en `TODO(jugement)` explicites. Source (a) — impl de référence d'un autre projet — **à venir**, non construite ici. |
| `regen` / `list` | Réécrit `recipes/RECIPES.md` depuis le front-matter de chaque recette (`bin/regen-recipes.sh`) — c'est aussi la façon de **lister** les recettes existantes |

## `check` — déléguer le jugement

`ezk-chef` (le skill) ne réimplémente **rien** du jugement : il invoque l'agent `ezk-chef`
(`products/mega-city/agents/ezk-chef.md`) sur la ou les recettes concernées. L'agent lance
d'abord la gate mécanique, puis juge (`no-stored-code`, `lists-tasks-and-composes`,
`plain-language-first` — bundle `rules/recipe/*`) et rend un verdict GO/NO-GO. Si aucun
argument n'est donné, l'agent évalue toutes les recettes du livre.

## `extract` — le cœur de ce sprint (fiche 20260824122629794)

**Entonnoir (ADR-0013) : brouillon révocable, JAMAIS de code recopié, pointeurs
seulement.** `extract` produit une **ossature** que l'agent `ezk-chef` (ou l'humain) finit
de juger — il ne prétend jamais avoir compris le mécanisme à ta place.

### Source (b) — depuis une fiche déjà `shipped` (cœur du MVP)

*« Bien faire la fiche, c'est déjà écrire la recette. »* Une fiche shippée porte déjà le
problème, la proposition, les critères, le « Comment vérifier » et, via sa PR, le diff réel.

1. Lance la partie **mécanique**, déterministe :
   ```bash
   bash products/mega-city/bin/ezk-chef-extract.sh <id-fiche-shippée>
   ```
   Elle localise `features/done/<id>_*.md`, mint un nouvel id horodaté
   (`skills/ezk-backlog/scripts/mint-id.sh`), et instancie `recipes/RECIPE_TEMPLATE.md` avec
   ce qui est **dérivable mécaniquement** :
   - `title` (front-matter de la fiche) ;
   - `pr:` de la fiche → note pointeur (numéro de PR ; `gh pr view` reste **best-effort**,
     à toi de l'interroger si tu veux le diff réel — le script ne l'appelle pas) ;
   - la section **En clair** recopiée telle quelle ;
   - un **amorçage du playbook** depuis les listes numérotées/à puces de « Proposition » et
     « Comment vérifier » de la fiche, chaque ligne préfixée `TODO(jugement, depuis « … »)` ;
   - `status: draft`, `home: central`, `created`/`updated` à aujourd'hui.
   Refuse net (erreur, pas de fichier créé) si l'id est introuvable, ambigu (plusieurs
   fiches), ou si la destination `recipes/<slug>.md` existe déjà — jamais d'écrasement
   silencieux.
2. **Toi (le LLM), tu complètes le jugement** que le script ne peut pas faire : `makes`,
   `source:` (racine réelle de l'implémentation — pas juste la PR), `composes:`, `profile:`,
   Ingrédients, Ustensiles, Préliminaires, le schéma du mécanisme, les pointeurs
   `fichier:ligne` (section « Fichiers de référence »), et retravailler le playbook amorcé
   en vraies étapes actionnables. Tout ce qui reste `TODO(jugement)` dans le brouillon est un
   signal explicite de ce qu'il te reste à faire.
3. **Le LLM ne range pas le livre.** Une fois le brouillon jugé satisfaisant, relance
   `ezk-chef regen` (`bin/regen-recipes.sh`) pour que `recipes/RECIPES.md` le référence
   (ADR-0001 : le script range, le LLM juge). Fais ensuite passer la recette à l'agent
   `ezk-chef` (`ezk-chef check`) avant de la faire basculer `status: ready`.

### Source (a) — depuis une implémentation de référence d'un autre projet (À VENIR)

**Différée.** Analyser le code d'un projet tiers (ex. `muti`) pour en extraire une recette
n'est **pas construit** dans ce MVP — trop coûteux à bien faire mécaniquement, et la
voie (b) couvre le besoin immédiat. Quand elle sera construite, elle prendra un chemin de
projet en argument et pointera sa racine dans `source:`, sans jamais recopier de code
(même doctrine ADR-0013).

## `regen` / `list` — le livre (déjà livré, mince ici)

```bash
bash products/mega-city/bin/regen-recipes.sh
```

Régénère `recipes/RECIPES.md` depuis le front-matter de **toutes** les recettes
(`id`, `title`, `makes`, `status`, `home`) — déterministe, aucun jugement (ADR-0001 §2).
C'est aussi la commande à lancer pour **lister** l'état actuel du livre : ouvre
`recipes/RECIPES.md` après régénération plutôt que de parcourir `recipes/*.md` à la main.

## Frontière avec les voisins

- **`ezk-ezk`** fabrique des **skills** (playbook + capacité outillée) depuis une
  *discussion de session*. `ezk-chef extract` fabrique des **recettes** (plan tâche-après-
  tâche + rules/profil) depuis une *feature déjà codée* (fiche shippée ou, plus tard, une
  implémentation de référence). Objets différents, sources différentes.
- **`ezk-chef scan`** (fiche `0147`, ex-`ezk-recipy`, **différé**) sourcera des recettes
  depuis des **repos froids** (scan large, propositions), pas une extraction ciblée sur une
  fiche/feature précise.
- **`0178`** (recette manuelle déclenchable) reste une recette écrite à la main — `extract`
  en produit un **premier jet**, pas un substitut au jugement humain final.

## Comment ça s'« installe »

Rien à initialiser : `recipes/` existe déjà à la racine de vectorz (D4, fiche
`20260824185422122`), avec son gabarit `RECIPE_TEMPLATE.md`, son bundle `rules/recipe/*` et
son livre `RECIPES.md`. `ezk-chef` (le skill) ne fait qu'ajouter des verbes par-dessus ce qui
existe déjà — aucune nouvelle structure de fichiers.
