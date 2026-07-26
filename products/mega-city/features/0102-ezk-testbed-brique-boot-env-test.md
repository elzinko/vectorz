---
id: 0102
title: "ezk-testbed — démarrer un environnement de test isolé (PR, branche ou local) : une brique autonome, pas un chapitre d'ezk-pr-pilot"
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

# 0102 — `ezk-testbed` : la brique qui démarre un environnement de test

## Contexte / Problème

Quand on veut **voir tourner** un travail en cours — une PR à relire, une branche, l'arbre
courant — il faut aujourd'hui deviner : quelle commande lance l'app ? sur quel port ?
est-ce que ça va écraser mes données de test perso ? comment j'arrête sans casser mes
autres stacks ?

Chaque projet **a** la réponse. Elle n'est écrite nulle part, donc elle est re-devinée à
chaque fois — par un humain ou par un agent.

### Quatre rôles de la méthode ont ce besoin, aucun ne sait le satisfaire

| Qui | Ce qu'il fait aujourd'hui |
|---|---|
| `ezk-pr-pilot run` | « démarre les bancs » — bancs **génériques**, aucun contrat projet |
| `ezk-preview` **cas B** | commence par *« lance l'app en local (ou demande à la lancer) »*, puis **devine le port** (3000 / 5173 / 8080 / 4321 / 8000) |
| `ezk-sprint` étape 6 | délègue à `ezk-qa`, qui « lance l'app » — sans savoir comment |
| `verify` / `run` | même trou |

### Le besoin n'est pas lié aux PRs — c'est constaté, pas supposé

`city-guided` a écrit `scripts/preview-pr.sh` pour les PRs, puis l'a **généralisé lui-même** :
`PREVIEW_ENTRY=pr|branch` (le même script sert `pnpm preview:pr` et `pnpm preview:branch` —
`preview-branch.sh` n'est qu'un `exec` vers lui) × `PREVIEW_MODE=node|docker`. Deux axes sont
apparus sur le terrain, sans guidance de la méthode : **la cible** (ce qu'on démarre) et
**la recette** (comment on le démarre). Personne ne le leur a demandé.

### LA LOI a déjà l'ancrage, personne ne le lit

`rules/development/use-project-scripts.md` (**MUST**) : *« If operational scripts exist :
MUST be the standard interface used by npm/pnpm scripts · SHOULD manage lifecycle by
environment · SHOULD centralize setup/start/stop/logs/wait/deploy »*. La déclaration est à
moitié exigée par les règles ; **aucun skill ne la consomme**.

### La demande amont

Samplerz porte une fiche **P0** (`features/backlog/pr_local_stack_testable.feature`, PR de
grooming #318) : une commande = stack de CETTE PR + état neuf + open. Sa recommandation de
grooming était **« étendre `ezk-pr-pilot` »**. Cette fiche la corrige sur un point : le
besoin est plus large que les PRs, et le loger dans un orchestrateur casse l'autonomie des
briques (voir ci-dessous).

## Valeur

- **`ezk-testbed` s'utilise seul.** « Démarre-moi l'env de cette branche » n'oblige plus à
  charger un chef de stock de PRs — qui, par doctrine, veut prendre la main sur la session
  (`profiles/README.md:23`, test `profiles-sync.test.ts:44`).
- **Les autres briques maigrissent.** `ezk-preview` **retire** son heuristique de port :
  deviner → lire. Moins de prose load-bearing (doctrine ADR-0001).
- **`ezk-pr-pilot` ne grossit pas** : il gagne **une ligne** dans sa table « je délègue à »,
  au même titre que `ezk-preview` / `ezk-device` / `ezk-backlog`.
- **Samplerz** obtient sa P0 sans que la méthode lui impose Docker ni sa politique de session.
- **city-guided** cesse d'être un pattern orphelin : son `pr|branch × node|docker` devient
  la preuve du contrat — **sans qu'une ligne de son code ne remonte** dans mega-city.

## Décision — option B, **directement** (pas de phasage)

> Une **capacité utilisée par plusieurs rôles ne vit pas dans un orchestrateur** : elle
> devient une brique autonome que les rôles composent. Voir **ADR-0020** (proposé), qui
> amende explicitement **ADR-0009 §2** (« un seul nouveau skill pour la consommation »).

**Options écartées :**

| | Option | Pourquoi non |
|---|---|---|
| **A** | Renommer `ezk-pr-pilot` → `ezk-pr` + y loger le contrat | Le renommage touche ~12 fichiers + une liste figée dans `expand.test.ts:93`, pour zéro changement de comportement. Et loger la capacité dans l'orchestrateur casse l'autonomie des briques. Renommage = décision cosmétique **séparable**, hors périmètre. |
| **B′** | B **en deux temps** : contrat d'abord dans `ezk-pr-pilot`, extraction plus tard sur preuve | Écarté après arbitrage PO (2026-07-26, doctrine « briques autonomes composables ») : construit délibérément la mauvaise forme pour la défaire ensuite, et coûte **plus** de prose dans `ezk-pr-pilot` que la délégation directe. |
| **C** | Statu quo (gap 100 % projet-local) | Deux projets sur trois ont déjà écrit l'adaptateur à la main, séparément ; quatre rôles de la méthode ont le besoin. Ce n'est pas un gap samplerz. |
| **D** | Mettre ça dans `ezk-docker` ou `ezk-preview` | `ezk-docker` : docker n'est **qu'une recette** — un projet en mode node n'a pas à charger docker. `ezk-preview` : son métier est de **partager vers l'extérieur** (tunnel, Vercel, tailnet, règles de sécurité sur les credentials) ; démarrer en local isolé est un autre métier, avec un autre profil de risque. Fusionner ferait une brique grasse. |

## Le skill `ezk-testbed`

**Nom** : `testbed` = banc d'essai, sans ambiguïté pour quelqu'un qui découvre la brique
hors méthode. (`ezk-bench` écarté : se lit « benchmark ». `ezk-sandbox` écarté : promettrait
une isolation de sécurité qu'on ne fournit pas — même limite honnête qu'`ezk-docker`.)

**Sous-commandes** (gabarit maison : `help` sans argument, langage naturel accepté) :

| Sous-commande | Effet |
|---|---|
| `help` (ou sans argument) | Le tableau + l'état de la déclaration du repo |
| `init` | Installe la déclaration dans le repo (4 slots), en **épousant l'existant** |
| `check` | Pré-requis de la recette déclarée (docker répond, ports libres…) |
| `start [cible]` | Démarre et **imprime / ouvre l'URL**. Cible : `pr <n>` · `branch <nom>` · `local` (défaut) |
| `stop [cible]` | Arrête **cette cible seule** |
| `list` | Les cibles actuellement démarrées |

**Deux axes** — et c'est tout le modèle :

| Axe | Valeurs | Qui décide |
|---|---|---|
| **Cible** — *quoi démarrer* | `pr <n>` · `branch <nom>` · `local` | l'appelant (humain, `ezk-pr-pilot`, `ezk-sprint`…) |
| **Recette** — *comment démarrer* | `node` · `docker` · `make` · deploy provider · … | **le projet**, jamais la méthode |

> ⚠️ **Vocabulaire.** Ces « recettes » n'ont **rien à voir** avec `caps/`, qui désigne dans
> mega-city les **adaptateurs d'hôte** (claude-code, claude-desktop). Ne jamais écrire
> « caps » pour ça — aucun dossier, aucun mot partagé.

**Ce que le projet déclare — 4 slots, rien de plus :**

1. **`start`** — UNE commande littérale, paramétrée par la cible, qui imprime ou ouvre l'URL.
2. **`stop`** — UNE commande littérale, **scopée à cette cible seule**.
3. **État de départ** — UNE phrase : ce que « neuf » veut dire ici, et comment c'est garanti.
   **Projet-local, jamais imposé.**
4. **Périmètre d'isolation** — ce qui est isolé (ports, DB, volumes, worktree) **et ce qui
   ne l'est pas**. L'aveu compte autant que la garantie.

**Où vit la déclaration** : là où le projet déclare **déjà** ses commandes. Doctrine
`ezk-backlog` (« épouser une convention existante, NE PAS churner ») + règle **MUST**
`development/use-project-scripts` : l'interface **est** `package.json` / `Makefile`.
`init` n'impose **aucun format de config** — il exige que les 4 slots soient trouvables en
**un** endroit, et que la commande littérale soit recopiée là où un relecteur la lira
(corps de PR quand la convention `ezk-pr-pilot` est en place ; README sinon).

## Frontières (aucun recouvrement)

| Besoin | Brique | Ce qu'elle ne fait PAS |
|---|---|---|
| Démarrer / arrêter un env de test isolé pour une cible | **`ezk-testbed`** | ne merge rien, ne planifie rien, **n'expose rien sur Internet** |
| Ordonner / tester / merger un **stock de PRs** | `ezk-pr-pilot` | ne démarre plus d'env « à sa façon » — **délègue** (une ligne) |
| **URL partageable** vers l'extérieur | `ezk-preview` | ne démarre plus la stack — **retire son heuristique de port**, consomme l'URL rendue par `ezk-testbed` |
| Bras `compose` sûr (`-p`, teardown, blast-radius) | `ezk-docker` | ne connaît ni cible, ni état neuf — c'est **une recette possible**, invoquée par le projet |
| Pipeline GitHub Actions en local | `ezk-ci` | rien à voir (frontière déjà écrite dans `ezk-docker`) |
| Produire / corriger une PR | `ezk-sprint` | devient un **appelant** à l'étape 6 (validation E2E) |

## Portabilité — 3 repos, 3 réponses, 1 brique

| Repo | Cible(s) | Recette | État de départ |
|---|---|---|---|
| **samplerz** | `pr <n>` | `docker` — `make preview-pr PR=<n>` / `-stop` | **session vide** : volume éphémère, jamais `samplerz_session` |
| **city-guided** | `pr <n>` **et** `branch <nom>` | `node` \| `docker` (déjà écrit) | **DB isolée** `cityguided_pr_<n>` / `cityguided_<slug>` |
| **vectorz** | `branch` / `local` | `node` (`pnpm --dir …`) | **sans objet, déclaré** (ou journal de supervision en répertoire temporaire) |

## Critères d'acceptation

- [ ] **AC1 — brique autonome.** `ezk-testbed start` fonctionne dans un repo qui n'a **ni**
      `ezk-pr-pilot`, **ni** backlog, **ni** aucun autre skill ezk installé — la seule
      exigence est la déclaration du projet. Vérifiable sur un repo jetable ne contenant que
      la déclaration.
- [ ] **AC2 — la méthode lit, elle ne devine plus.** `ezk-testbed start` exécute la commande
      **déclarée** ; en l'absence de déclaration il **refuse et propose `init`** — il ne
      devine jamais un port. `ezk-preview` cas B **perd** son heuristique
      (`3000/5173/8080/4321/8000`) et délègue.
- [ ] **AC3 — neutre à la cible, prouvé sur 2 repos réels.** La **même** déclaration exprime
      `pr <n>`, `branch <nom>` et `local` ; **samplerz** (cible PR, recette docker) **et**
      **city-guided** (cibles PR **et** branche, recettes node|docker) sont couverts **sans
      forker la méthode** et **sans qu'une ligne de leur code ne remonte** dans mega-city.
- [ ] **AC4 — l'état de départ reste projet-local.** La méthode **n'impose aucune** politique :
      `init` refuse une déclaration dont le slot « état de départ » est vide, et **accepte
      « sans objet » explicite**. Grep de contrôle : aucun `SKILL.md` de mega-city ne
      contient `samplerz_session` ni `cityguided_`.
- [ ] **AC5 — composition, pas duplication.** `ezk-pr-pilot` gagne **une ligne** de
      délégation dans sa table « Frontière & délégation » et **aucune** logique de boot ;
      `ezk-sprint` / `ezk-qa` pointent vers `ezk-testbed` pour l'étape E2E. Aucun
      `SKILL.md` ne réimplémente `start`/`stop`.
- [ ] **AC6 — la méthode reste décrite.** Dans la **même PR** (règle « carte vivante ») :
      `skills/README.md` (nouvelle ligne de catalogue), `profiles/global.yml` +
      `expand.test.ts` (19 skills), `docs/method-map.md`, org-chart 0028, et **ADR-0020**
      passé de `proposé` à `accepté`. Au passage, `ezk-pr-pilot` — aujourd'hui **absent**
      de la couche 1 de `method-map.md` — y figure.

## Dépendances externes

- **samplerz** (`~/git/samplerz`) — fiche P0 `features/backlog/pr_local_stack_testable.feature`,
  PR de grooming #318 · **accès constaté le 2026-07-26**.
- **city-guided** (`~/git/bacasable/city-guided`) — `scripts/preview-pr.sh`,
  `scripts/preview-branch.sh`, scripts `preview:*` du `package.json`
  · **accès constaté le 2026-07-26**.

## Séquence

1. **Samplerz livre son adaptateur** (`make preview-pr` + politique session vide) — sa P0,
   son repo, indépendant de cette fiche.
2. **Cette fiche** — `ezk-testbed` + ADR-0020 + les deux délégations (`ezk-pr-pilot`,
   `ezk-preview`). Doit atterrir **après** le 1, pour être écrite contre une commande qui
   existe vraiment.
3. **city-guided** déclare ses deux cibles → c'est le second dogfood, celui qui prouve que
   la brique n'est pas PR-only.

## Notes

- **DoR** : les 4 slots sont remplis (problème constaté / valeur / critères observables /
  dépendances externes datées) → `ready: 2026-07-26`. Gate posé lors de la rédaction ;
  révocable par le PO.
- **Renommage `ezk-pr-pilot` → `ezk-pr` : hors périmètre**, explicitement. Décision
  cosmétique, à trancher dans sa propre PR — jamais couplée à un changement de frontière
  (sinon la revue mélange « est-ce le bon découpage ? » et « est-ce le bon mot ? »).
  Après ce split, `ezk-pr-pilot` reste le nom juste : c'est un pilote de **stock**.
- **Risque connu — `composes` n'existe pas encore.** ADR-0012 est **proposé**, fiche
  **0044** `todo` : aucun `SKILL.md` ne porte de champ `composes:`. La composition
  `ezk-pr-pilot → ezk-testbed` sera donc en **prose**, invisible à `expand`/`bind` — un
  profil pourrait binder l'un sans l'autre sans erreur. **Pas bloquant** (les 18 skills
  actuels sont dans le même cas), mais la doctrine « briques autonomes **composables** »
  rend 0044 nettement plus utile qu'avant : bon moment pour la tirer.
- **Contexte de liste** : fiche déposée dans le backlog **mega-city** (sujet = méthode).
  Si la fiche racine **0064** (liste unique via champ `product:`) est livrée avant, la
  migration est mécanique (ajout d'un champ), pas un déplacement.
- **Constat à router vers la fiche racine 0064 et vers [mc-0090](0090-coherence-de-sprint.md)** —
  cette fiche est née `0099`, a dû devenir `0102`, et `0100` aurait aussi collisionné.
  Trois numéros brûlés en une journée, **à l'intérieur d'une seule liste**, parce que
  quatre worktrees vivaient en parallèle et que chacun calculait `max(id)+1` contre son
  arbre **local**. La proposition de 0064 (liste unique via champ `product:`) traite les
  collisions **entre** les deux listes — elle n'aurait couvert **aucun** de ces trois cas.
  Mitigation immédiate applicable tout de suite dans `ezk-backlog add` : calculer le max
  contre `origin/main` **fetché** *et* toutes les branches non mergées, pas contre le
  worktree courant. Un trou dans la numérotation est sans conséquence — un id est un
  identifiant, pas un compteur.
