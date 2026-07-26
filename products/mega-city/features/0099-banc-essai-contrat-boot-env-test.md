---
id: 0099
title: "Démarrer un environnement de test — contrat projet « cible × recette » : l'extraire d'ezk-pr-pilot au lieu de l'y enfermer"
type: feature
priority: P1
epic:
depends: []
labels: [method, enabler]
status: todo
ready: 2026-07-26
pr:
created: 2026-07-26
---

# 0099 — Le banc d'essai est une capacité, pas un chapitre d'`ezk-pr-pilot`

## Contexte / Problème

Samplerz porte une fiche **P0** (`features/backlog/pr_local_stack_testable.feature`, PR de
grooming #318) : chaque PR doit pouvoir démarrer **la stack de CETTE PR**, ouvrir l'UI avec
un **état neuf**, et offrir un mini-guide BDD humain. L'infra Docker existe déjà (#97) ; ce
qui manque est le **contrat** « une commande = env de cette cible + état neuf + open » et
son bloc obligatoire dans le corps de PR. Sa recommandation de grooming : **étendre
`ezk-pr-pilot`**. Cette fiche re-vérifie cette recommandation **côté méthode** — et la
corrige sur un point structurant.

### Ce que l'inventaire montre (vérifié 2026-07-26)

1. **Le besoin n'est pas PR-spécifique — c'est empirique, pas théorique.**
   city-guided a écrit `scripts/preview-pr.sh`, puis l'a **généralisé lui-même** :
   `PREVIEW_ENTRY=pr|branch` (le même script sert `pnpm preview:pr` et `pnpm preview:branch`,
   `scripts/preview-branch.sh` n'est qu'un `exec` vers lui) × `PREVIEW_MODE=node|docker`.
   Deux axes sont apparus sans aucune guidance de la méthode : **la cible** (ce qu'on
   démarre : une PR, une branche, l'arbre courant) et **la recette** (comment on le démarre :
   process node, compose, demain un deploy provider). Enfermer la capacité dans un skill
   nommé « pr » revient à re-perdre l'axe que le terrain a déjà trouvé.

2. **La capacité a ≥ 4 consommateurs dans la méthode, dont un seul est `ezk-pr-pilot`.**
   `ezk-pr-pilot run` « démarre les bancs » · `ezk-preview` **cas B** commence par
   *« Lance l'app en local (ou demande à la lancer) »* puis **devine le port** par
   heuristique (`3000 / 5173 / 8080 / 4321 / 8000`, ou lecture du `docker-compose.yml`) ·
   `ezk-sprint` étape 6 délègue à `ezk-qa` qui « lance l'app » · `verify`/`run`.
   Une capacité partagée par quatre rôles qui vit dans **un** orchestrateur est exactement
   la redondance qu'on veut éviter : les trois autres continueront à deviner.

3. **`ezk-pr-pilot` est un orchestrateur de *stock*, et c'est mécaniquement gravé.**
   `src/__tests__/profiles-sync.test.ts:44` l'exclut de `cop1-target` **au titre des
   orchestrateurs** (avec `ezk-product-builder`, `ezk-sprint`, `ezk-ezk`) — doctrine
   « deux chefs dans la même session » (`profiles/README.md:23`, `profiles/cop1-target.yml:4`).
   Conséquence directe : aujourd'hui, **« démarre-moi l'env de cette branche » (sans PR)
   oblige à charger un chef de stock** qui va vouloir prendre la main sur la session.

4. **LA LOI a déjà l'ancrage — personne ne le lit.**
   `rules/development/use-project-scripts.md` (**MUST**) : *« If operational scripts exist :
   MUST be the standard interface used by npm/pnpm scripts · SHOULD manage lifecycle by
   environment (local|ci|staging|prod) · SHOULD centralize setup/start/stop/logs/wait/deploy »*.
   Le contrat est à moitié écrit dans les règles ; **aucun skill ne le consomme**. Le gap
   n'est donc pas « inventer un format », c'est **rendre la déclaration lisible et lue**.

5. **`ezk-pr-pilot init` n'a jamais tourné nulle part.** Aucun
   `docs/PR_VALIDATION.md` ni `.github/PULL_REQUEST_TEMPLATE.md` dans **vectorz**,
   **samplerz** ou **city-guided** (vérifié 2026-07-26) — y compris dans le repo où le skill
   est né. Le follow-up de dogfooding de la fiche 0027 (« première exécution réelle de
   `plan`/`run` ») est resté ouvert. **Zéro run réel** : c'est l'argument décisif pour ne
   **pas** payer maintenant un renommage ni créer un 2ᵉ skill spéculatif — mais aussi pour
   ne pas empiler du contrat non éprouvé dans un skill jamais exécuté.

### Le vrai gap, en une phrase

La méthode sait **orchestrer un stock de PRs** et sait **produire une URL partageable**.
Elle ne sait pas **demander à un projet comment démarrer un environnement de test isolé
pour une cible donnée, avec quel état de départ** — alors que deux projets sur trois ont
déjà écrit l'adaptateur à la main, chacun dans son coin.

## Valeur

- **Samplerz** obtient sa P0 sans que la méthode lui impose du Docker ni sa politique de
  session — elle lui demande seulement de **déclarer**.
- **city-guided** cesse d'être un pattern orphelin : son `pr|branch × node|docker` devient
  la preuve du contrat, sans que son code ne remonte dans la méthode.
- `ezk-preview` peut **retirer** son heuristique de port (deviner → lire) : moins de prose
  load-bearing, doctrine ADR-0001.
- « Tester une branche » cesse d'exiger un chef de stock (point 3).

## Options considérées — et l'arbitrage

| | Option | Verdict |
|---|---|---|
| **A** | Renommer `ezk-pr-pilot` → `ezk-pr` + enrichir `init`/`run` du contrat de boot | **Rejetée en l'état.** Le renommage touche ~12 fichiers + un test *golden* (`src/__tests__/expand.test.ts:93` fige la liste des 18 skills), les 3 fichiers du diagramme org-chart 0028, ADR-0009/0016/0018, `profiles/global.yml`, le symlink `~/.claude/skills/` — pour **zéro** gain fonctionnel, sur un skill **jamais exécuté**. Et après un split, `ezk-pr` serait *moins* juste que `ezk-pr-pilot` : c'est bien un pilote de **stock**, pas « le skill des PR ». Le renommage reste une décision cosmétique **séparable** — jamais couplée à un changement structurel dans la même PR. |
| **B** | **Séparer** : `ezk-pr-pilot` garde le cycle de vie du stock ; une **capacité** « boot d'un environnement de test » (cible PR \| branche \| local × recette) devient autonome | **Retenue — mais par étapes** (voir ci-dessous). Les points 1→4 la justifient ; le point 5 interdit de la livrer d'un bloc sans preuve. |
| **C** | Statu quo documenté (gap 100 % projet-local) | **Rejetée** : le point 1 (city-guided a généralisé tout seul) et le point 2 (4 consommateurs) montrent un besoin de méthode, pas un besoin Samplerz. **C reste néanmoins l'issue possible de la phase 1** si le dogfood ne matérialise aucun consommateur hors-PR — auquel cas on clôt ici, sans 2ᵉ skill. |

### Recommandation : **B, en deux phases — contrat d'abord, extraction sur preuve**

> **Phase 1 — le contrat, hébergé provisoirement par `ezk-pr-pilot`.** On écrit la
> déclaration et on la fait **lire** ; `ezk-pr-pilot init`/`run` en est le premier
> consommateur. Coût dans le skill : ~10 lignes de prose (un bloc de template + « lis la
> déclaration, ne devine pas »). **Aucun nouveau skill.**
>
> **Phase 2 — extraction, seulement si la preuve tombe.** Dès qu'un **2ᵉ consommateur hors
> PR** est matérialisé (une cible `branch`/`local` réellement démarrée par la méthode), on
> sort la capacité dans son propre skill et les ~10 lignes deviennent **une** ligne de
> délégation. Sinon : option C, écrite noir sur blanc.

C'est le `construire → prouver → retirer` maison, pas un pari d'archi.

## Le contrat — « recettes / stratégies » (⚠️ **pas** `caps/`)

> **Vocabulaire.** `caps/` désigne dans mega-city les **adaptateurs d'hôte** (claude-code,
> claude-desktop). Ce qu'on décrit ici sont des **recettes** (ou stratégies) de banc d'essai :
> aucun rapport, aucun partage de dossier, aucun partage de mot. Ne jamais écrire « caps »
> pour ça.

Le projet déclare, la méthode lit. **Deux axes** :

| Axe | Valeurs | Qui décide |
|---|---|---|
| **Cible** — *quoi démarrer* | `pr:<n>` · `branch:<nom>` · `local` (arbre courant) | l'appelant (humain, `ezk-pr-pilot`, `ezk-sprint`…) |
| **Recette** — *comment démarrer* | `node` · `docker` · `make` · `deploy-provider` · … | **le projet**, jamais la méthode |

**Ce que le projet DOIT déclarer** (4 slots, rien de plus) :

1. **`start`** — UNE commande littérale, paramétrée par la cible, qui **imprime ou ouvre l'URL**.
2. **`stop`** — UNE commande littérale, **scopée à cette cible seule** (les autres stacks du
   poste, et le `dev` habituel, restent intacts).
3. **Politique d'état neuf** — UNE phrase : *ce que « neuf » veut dire ici* et *comment c'est
   garanti*. **Projet-locale, jamais imposée** (Samplerz : volume de session éphémère, jamais
   `samplerz_session` ; city-guided : DB dédiée `cityguided_pr_<n>` ; vectorz : sans objet →
   le déclarer explicitement « sans objet » est une réponse valide).
4. **Périmètre d'isolation** — ce qui est isolé (ports, DB, volumes, worktree) **et ce qui ne
   l'est pas**. L'aveu compte autant que la garantie.

**Où vit la déclaration : là où le projet déclare déjà ses commandes.** Doctrine
`ezk-backlog` (« épouser une convention existante, NE PAS churner ») + règle **MUST**
`development/use-project-scripts` : l'interface **est** `package.json` / `Makefile`
(`preview:pr`, `preview:branch`, `preview:*:stop`, `make preview-pr`…). La méthode
n'impose **aucun nouveau fichier de config** : elle exige que les 4 slots soient
**trouvables en un endroit** (section « Comment démarrer » de `docs/PR_VALIDATION.md`) et
que la commande littérale soit **recopiée dans le corps de la PR**.

## Installation dans un projet (`init`)

`ezk-pr-pilot init` gagne, dans `assets/PR_VALIDATION.template.md`, une section
**« Comment démarrer »** avec les 4 slots + le bloc correspondant dans le squelette de PR.
Règles `init` **inchangées** : template absent → créer un squelette mince ; template
**existant → jamais écrasé**, section-lien agrégée. Idempotent.

Si un projet n'a pas de banc (une lib, un skill-repo) : les 4 slots se remplissent
« sans objet » — **une déclaration vide explicite est valide**, l'absence de déclaration
ne l'est pas.

## Frontières nettes (aucun recouvrement)

| Besoin | Qui | Ce qu'il ne fait PAS |
|---|---|---|
| Ordonner / tester / merger un **stock de PRs** | **`ezk-pr-pilot`** | ne démarre plus d'env « à sa façon » : il **lit la déclaration** |
| Démarrer/arrêter un **env de test isolé** pour une cible | **la capacité** (phase 1 : dans `ezk-pr-pilot` · phase 2 : skill dédié) | ne merge rien, ne planifie rien, n'expose rien sur Internet |
| **URL partageable** (montrer à quelqu'un d'autre) | `ezk-preview` | ne démarre pas la stack — il **consomme** l'URL déclarée (et **retire** son heuristique de port en phase 2) |
| Bras `compose` sûr (`-p`, teardown, blast-radius) | `ezk-docker` | ne connaît ni PR, ni branche, ni worktree, ni état neuf — c'est **une recette possible**, pas le contrat |
| Pipeline GitHub Actions en local | `ezk-ci` | rien à voir (frontière déjà écrite dans `ezk-docker`) |
| Produire/corriger une PR | `ezk-sprint` | — (devient un **consommateur** de la capacité à l'étape 6/E2E) |

## Portabilité (3 repos, 3 réponses, 1 contrat)

| Repo | Cible(s) | Recette | État neuf |
|---|---|---|---|
| **samplerz** | `pr:<n>` | `docker` (`make preview-pr PR=<n>` / `-stop`) | **session vide** — volume éphémère, jamais `samplerz_session` |
| **city-guided** | `pr:<n>` **et** `branch:<nom>` | `node` \| `docker` (déjà écrit : `PREVIEW_ENTRY` × `PREVIEW_MODE`) | **DB isolée** `cityguided_pr_<n>` / `cityguided_<slug>` |
| **vectorz** | `branch` / `local` | `node` (`pnpm --dir …`) | **sans objet, déclaré** (ou répertoire de journal temporaire pour la supervision) |

> city-guided est cité comme **preuve de besoin portable**, pas comme code à importer :
> aucune ligne de `scripts/preview-pr.sh` ne remonte dans mega-city.

## Séquence

1. **Samplerz d'abord (P0, son repo)** — l'adaptateur `make preview-pr` + politique session
   vide + `ezk-pr-pilot init` adapté. C'est le **dogfood**, il ne dépend pas de cette fiche.
2. **Phase 1 (cette fiche)** — le contrat dans le template + `run` qui **lit au lieu de
   deviner**. Peut partir **en parallèle** du 1 ; doit atterrir **après** lui pour que le
   template soit écrit contre un banc qui existe vraiment.
3. **Phase 2 (cette fiche, conditionnelle)** — 2ᵉ consommateur hors-PR matérialisé
   (city-guided `branch`, ou `ezk-sprint`/`ezk-qa`) → extraction + **ADR-0020 amendant
   ADR-0009 §2** + délégations. Sinon → option C écrite, fiche close.

Pas de même sprint que Samplerz : un template écrit avant que la commande existe serait
de la prose non éprouvée — exactement le défaut du point 5.

## Critères d'acceptation

- [ ] **AC1 — le contrat existe et s'installe.** `ezk-pr-pilot init` produit une section
      « Comment démarrer » exigeant les **4 slots** (`start`, `stop`, politique d'état neuf,
      périmètre d'isolation) + le bloc correspondant dans le squelette de PR. Relancé sur un
      repo qui a déjà un template : **rien n'est écrasé**, une section-lien est agrégée
      (comportement `init` actuel préservé — testable sur un repo jetable).
- [ ] **AC2 — la méthode lit, elle ne devine plus.** `ezk-pr-pilot run` exécute la commande
      **déclarée** quand elle existe, et ne retombe sur l'heuristique de port
      (`ezk-preview` cas B) **que** si le repo ne déclare rien — en **disant explicitement
      lequel des deux chemins il a pris**. Vérifiable : un repo déclarant / un repo nu.
- [ ] **AC3 — le contrat est neutre à la cible, prouvé sur 2 repos réels.** La **même**
      déclaration exprime `pr:<n>`, `branch:<nom>` et `local` ; **samplerz** (cible PR,
      recette docker) **et** **city-guided** (cibles PR **et** branche, recettes node|docker)
      sont décrits par le contrat **sans forker la méthode** et **sans qu'aucune ligne de
      leur code ne remonte** dans mega-city.
- [ ] **AC4 — la politique d'état neuf reste projet-locale.** La méthode **n'impose aucune**
      politique : elle **refuse** une déclaration dont le slot « état neuf » est absent, et
      **accepte** « sans objet » explicite. Aucun `SKILL.md` de mega-city ne contient de
      politique de session/DB propre à un projet (grep de contrôle : pas de
      `samplerz_session`, pas de `cityguided_`).
- [ ] **AC5 — l'extraction est décidée sur preuve, pas sur intuition.** À l'issue de la
      phase 1, **une** issue écrite : soit un skill dédié (nom tranché par le PO — proposition
      **`ezk-bench`**, « banc » étant déjà le mot de `ezk-pr-pilot run` ; alternative
      `iso-cube` de la réserve `docs/naming.md`) **avec ADR-0020 amendant explicitement
      ADR-0009 §2**, `ezk-preview`/`ezk-sprint`/`ezk-qa` en délégation et l'heuristique de
      port d'`ezk-preview` **retirée** ; soit **option C** documentée. **Aucun 3ᵉ skill créé
      avant cette décision.**
- [ ] **AC6 — la carte reste vraie.** `docs/method-map.md`, `skills/README.md` et le
      diagramme org-chart 0028 sont à jour **dans la même PR** (règle « carte vivante ») —
      et `ezk-pr-pilot`, aujourd'hui **absent** de la couche 1 de `method-map.md`, y figure.

## Dépendances externes

- **samplerz** (`~/git/samplerz`) — fiche P0 `features/backlog/pr_local_stack_testable.feature`,
  PR de grooming #318 · **accès constaté le 2026-07-26**.
- **city-guided** (`~/git/bacasable/city-guided`) — `scripts/preview-pr.sh`,
  `scripts/preview-branch.sh`, scripts `preview:*` du `package.json`
  · **accès constaté le 2026-07-26**.

## Notes

- **DoR** : les 4 slots sont remplis (problème constaté / valeur / critères observables /
  dépendances externes datées) → `ready: 2026-07-26`.
- **Renommage `ezk-pr-pilot` → `ezk-pr` : explicitement hors périmètre.** Décision
  cosmétique, séparable, à trancher par le PO dans sa propre PR — jamais couplée à un
  changement de frontière (sinon la revue mélange « est-ce le bon découpage ? » et « est-ce
  le bon mot ? »). Aucune trace de discussion de rename n'existe aujourd'hui dans le repo.
- **Risque connu — `composes` n'existe pas encore.** ADR-0012 est **proposé**, fiche
  **0044** `todo` : aucun `SKILL.md` ne porte de champ `composes:`. Une capacité extraite en
  phase 2 serait donc composée **en prose**, invisible à `expand`/`bind` — exactement la
  prose load-bearing qu'ADR-0012 dénonce. **Pas un bloquant** (les 18 skills actuels sont
  dans le même cas), mais la phase 2 est un bon déclencheur pour tirer 0044.
- **Finding annexe** : `ezk-pr-pilot` n'apparaît pas dans la couche 1 de
  `docs/method-map.md` alors qu'il est first-class partout ailleurs (ADR-0009 accepté,
  fiche 0027 shipped, `profiles/global.yml:37`, org-chart 0028, deux tests mécaniques).
  Couvert par AC6 ; la règle enforced correspondante est la fiche **0068**.
- **Contexte de liste** : fiche déposée dans le backlog **mega-city** (sujet = méthode).
  Si la fiche racine **0064** (liste unique via champ `product:`) est livrée avant celle-ci,
  la migration est mécanique (ajout d'un champ), pas un déplacement.
