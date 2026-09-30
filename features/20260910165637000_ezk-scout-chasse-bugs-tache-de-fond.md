---
id: "20260910165637000"
title: "ezk-scout : chasser les bugs en tâche de fond, sans corriger"
type: feature
priority: P2
product: mega-city
version: V0.2
epic:
depends: ["20260821210633457", "0102", "20260812104022228"]
labels: [test-local]
status: ready
ready: 2026-09-10 # décision PO : garder ezk-scout (bugs) et l'explorateur (features) SÉPARÉS + mutualiser la commande — cf. Notes
pr:
evidence: none # capacité de méthode (skill) ; preuve = ses propres tests + un run de démonstration
created: 2026-09-10
---

# ezk-scout — chasse aux bugs en tâche de fond (trouver et ficher, pas corriger)

## En clair

On veut un outil qu'un agent lance pour **chercher des bugs tout seul, en tâche de
fond**, dans une app qui tourne. Il **trouve** et **rapporte** — il ne corrige
jamais, et il **ne crée pas de fiche tout seul**. Chaque trouvaille est un
**brouillon de fiche** complet dans un **rapport** : description claire,
reproduction, gravité, et en option une **capture d'écran** (bug de rendu) et une
**localisation** dans le code (`fichier:ligne`). Un humain valide le rapport ;
**alors seulement** les fiches retenues entrent au backlog. Quelqu'un décide
ensuite quoi corriger.

L'idée vient d'un run samplerz (2026-09-10) : le prompt « ezk-product-build …
fais-en le maximum, si bloqué teste via la webapp/l'émulateur, crée des fiches
`suggest` » a trouvé **3 vrais bugs** et les a fichés. Ça a bien marché. On veut
en faire un **outil de première classe**, pas un prompt bricolé.

## Contexte / Problème

Aujourd'hui, trouver des bugs est **artisanal** : on l'improvise dans un prompt.
Rien dans la méthode ezk ne dit à un agent « va chasser des bugs et fiche-les ».
Deux manques :

1. **Pas d'outil dédié.** Le run samplerz du 2026-09-10 l'a fait à la main via
   `ezk-product-build ... --mode auto ... « fais en le maximum ... teste via la
   webapp ou l'émulateur ... crée des fiches suggest »`. Résultat : bornes de crop
   non validées (samplerz #403), et deux `500` sur l'export direct — dossier non
   inscriptible **et** BPM cible ≤ 0 (samplerz #404). Trouvés ET fichés dans la
   foulée. Ça a marché parce que : **état isolé**, **sondage systématique**
   (API + UI), et surtout **capturer sans corriger**.
2. **La séparation trouver / corriger n'est pas outillée.** Corriger en tâche de
   fond serait dangereux (changements de code non supervisés) et illisible. Un
   agent qui **cherche** doit pouvoir tourner en fond ; **corriger** reste une
   décision revue (humain, ou `ezk-sprint`). C'est cette frontière que l'outil
   matérialise.

**Quand ça sert le plus** : quand le backlog est **bloqué** (têtes sur gestes
humains — boutique, device, terrain), un agent devrait chasser des bugs
proactivement au lieu de s'arrêter. C'est exactement le repli « si tu es bloqué,
teste » du run samplerz.

## Proposition

Une nouvelle **capacité de méthode ezk** (skill), nom proposé **`ezk-scout`**
(l'éclaireur : il explore et rapporte, il n'engage pas le combat). POC d'abord,
polish ensuite.

Ce qu'elle fait :

- **Sonde bornée, en tâche de fond**, une app qui tourne : la **webapp** via un
  serveur de dev **isolé** (compose `0102 ezk-testbed`). Le chemin **émulateur
  Android** est **conditionné** à l'arrivée sur `main` d'une recette émulateur —
  elle existe en local mais n'est pas encore poussée (cf. Notes) ; ne pas s'y
  raccrocher en dur avant.
- **Isole l'état** de l'app avant de piloter — et **tout** l'état mutable, pas
  seulement les fichiers (prefs / session / credential / cache en tmp) : aussi
  **base de données, volumes, services externes** que l'app touche. `0102
  ezk-testbed` doit énumérer ces dépendances ; si une d'elles ne peut PAS être
  isolée (un service réel partagé), la passe **ne la sonde pas** (STOP sur ce
  chemin) plutôt que de risquer l'état réel (retour Codex : isoler `HOME`/prefs ne
  suffit pas si une base reste réelle). C'est la première leçon du run samplerz.
- **Cherche des classes d'anomalies** : robustesse (un `5xx` sur entrée cassée),
  **trous de validation d'entrée** (bornes absurdes, valeurs ≤ 0…), **bugs de
  rendu** (visuels → capture), écarts **UX / accessibilité**.
- **FIND-ONLY — invariant dur** : ne modifie **jamais** le code produit. La sortie
  est faite de fiches, pas de diffs.
- **Rapporte un brouillon de fiche par trouvaille** — PAS de création autonome.
  ⚠ `ezk-backlog add` **crée ET committe** une carte (SKILL.md ezk-backlog) : ce
  n'est donc pas une « proposition ». La passe **n'appelle jamais `add` seule** ;
  elle rend un **rapport** de brouillons, l'humain arbitre, et `add` n'est invoqué
  **qu'après approbation** (le gate est AVANT `add`). C'est la politique de la
  carte explorateur `20260821210633457` (« aucune carte sans arbitrage humain ») —
  on s'aligne pour ne pas avoir deux contrats contradictoires (retour Codex).
  Chaque brouillon est riche :
  - description « En clair » + **reproduction** exacte (requête / étapes) ;
  - **gravité** + type/priorité suggérés ;
  - **capture d'écran optionnelle** — pour un bug de rendu (compose le mécanisme
    de captures, fiche `20260812104022228`, plutôt que de le réinventer) ;
  - **localisation optionnelle** — un pointeur `fichier:ligne` où le bug vit
    probablement (assistance par recherche de code, **opt-in**, best-effort : un
    indice, pas une garantie).
- **Rapporte un résumé** : N trouvées, M fichées, K écartées (avec raison).
- **Se compose** : invocable seule, **ou** appelée par `ezk-product-build` quand
  le backlog est bloqué (le chemin « si bloqué, teste » du run samplerz).

## Critères d'acceptation

Livré en **POC** (constat du 2026-09-30) : le skill, son format de rapport et ses garde-fous
mécaniques. Ce qui dépend de briques pas encore livrées est écrit en « Suite » plus bas.

- [x] Une capacité ezk dédiée (skill) existe ; un agent l'invoque pour lancer une
      passe de chasse aux bugs, en tâche de fond, sur une app qui tourne.
      *Preuve : `products/mega-city/skills/ezk-scout/SKILL.md` (verbes `help` · `run` · `check` · `file`),
      déployé par `profiles/global.yml`, contrat `src/__tests__/ezk-scout-contract.test.ts`.*
- [x] Elle ne modifie **jamais** le code produit (find-only, vérifiable — p. ex.
      `git diff` du code produit reste vide après une passe).
      *Preuve : `scripts/find-only-guard.sh` compare HEAD, arbre, refs et worktree avant/après ;
      27 contrôles dans `test-find-only-guard.sh`, dont le cas « commit sans toucher le worktree ».*
- [x] Elle isole l'état de l'app avant de piloter (compose la recette d'isolation).
      *Preuve : étape 2 du skill (fichiers, base, volumes, services externes ; un état NON ISOLÉ
      n'est pas sondé) + passe de démonstration avec `HOME` et état en tmp, vérifiés vides après.
      La brique « lanceur universel » n'existe pas encore : voir « Suite ».*
- [x] Chaque trouvaille est un **brouillon de fiche** dans un rapport, portant :
      description + reproduction + gravité + capture optionnelle (bug de rendu) +
      localisation optionnelle (`fichier:ligne`). **Aucune carte n'est créée ni
      committée par la passe** ; `ezk-backlog add` n'est invoqué qu'**après**
      validation humaine du rapport.
      *Preuve : gabarit `assets/SCOUT_REPORT.template.md`, contrôle de forme `scripts/check-report.sh`
      (`test-check-report.sh`), verbe `file` réservé à l'après-validation, exemple réel `examples/demo-report.md`.*
- [x] La passe est **bornée** (budget/temps) et rend un **résumé** en fin.
      *Preuve : `--max-probes` (30) et `--max-min` (15) ; `check-report.sh` refuse un rapport qui
      dépasse ses bornes ou dont le résumé `N trouvées · M fichées · K écartées` ment (N = M + K).*
- [x] Elle **compose** `ezk-backlog`, l'env de test isolé et le mécanisme de captures — sans
      les réimplémenter.
      *POC : `composes: [ezk-backlog, ezk-docker]` (filing après accord ; banc isolé sous compose),
      captures par le Playwright MCP partagé en opt-in (`--ui`). `0102 ezk-testbed` a été absorbée par le
      lanceur universel `20260917162000501` et le mécanisme `20260812104022228` est parqué : les deux se
      brancheront plus tard (voir « Suite »).*
- [x] La **frontière** est documentée vs `ezk-qa` (valide une PR précise),
      `ezk-reviewer` (relit un diff), `ezk-sprint` (construit), `ezk-product-build`
      (décide/construit) : `ezk-scout` explore une app qui tourne et fiche des bugs,
      puis **nourrit** les autres.
      *Preuve : section « Frontière avec les voisins » du SKILL.md (+ `ezk-bug`), ligne dans `method-map.md`.*
- [x] Gate locale verte (typecheck / lint / tests du skill) puis démonstration
      d'un run réel (au moins un bug fiché de bout en bout).
      *Preuve : typecheck, 808 tests, 25 suites bash, lint et liens verts. Passe réelle sur l'app jouet
      `examples/demo-app.mjs` : 12 sondes, 3 brouillons, `find-only : OK`, rapport valide
      (`examples/demo-report.md`) ; `test-demo-app.sh` rejoue les défauts.*

## Comment vérifier

- **Find-only** : capturer le **SHA de HEAD (et l'arbre)** du dépôt cible AVANT et
  APRÈS la passe — ils doivent être **identiques**. Comparer seulement
  `git status`/`git diff` (worktree) ne suffit pas : si la passe ou un outil
  composé **committe**, le worktree paraîtrait propre alors que find-only serait
  violé (retour Codex). Aucune modif de code, aucun commit, aucune carte.
- **État isolé** : le `HOME`/répertoire d'état réel de l'utilisateur n'est pas
  touché (la passe pointe un répertoire d'état en tmp ; vérifier qu'aucun fichier
  sous le vrai `~/.<app>` n'a changé).
- **Passe bornée** : la passe s'arrête d'elle-même (budget/temps) et imprime un
  résumé `N trouvées · M fichées · K écartées`.
- **Bout en bout** : sur une app de démonstration avec un défaut connu, la passe
  produit **au moins une fiche** `ezk-backlog` proposée, avec repro rejouable ;
  si c'est un bug de rendu, la fiche porte une capture.
- **Pas de création autonome** : après une passe, **aucune nouvelle carte
  committée** dans le backlog cible (`git status`/`git log` propres côté
  `features/`) ; le livrable est un **rapport** de brouillons. `ezk-backlog add`
  n'apparaît qu'**après** validation humaine.

## Suite (reliquat hors POC)

- **Brancher `ezk-product-build`** : quand le backlog est bloqué, lancer `ezk-scout` au lieu de
  s'arrêter (le chemin « si bloqué, teste » du run samplerz). Aujourd'hui le skill s'invoque seul.
- **Banc isolé universel** : composer le lanceur `20260917162000501` (qui a absorbé `0102 ezk-testbed`)
  dès qu'il est livré ; il remplacera la « recette déclarée par le projet » de l'étape 2.
- **Captures** : brancher le mécanisme partagé `20260812104022228` (parqué) à la place du Playwright MCP direct.
- **Émulateur Android** : chemin conditionné à l'arrivée de la recette `20260906135450000` sur `main`.
- **Supervision** : émettre vers le Moniteur (bon client du heartbeat, fiche 0103) ; impose de déclarer
  le skill dans `EMITTING_SKILLS` et dans le README du kit.
- **Explorateur de features** (`20260821210633457`) : réutiliser gabarit, scripts et `file` avec la lentille
  `features` (à ajouter au contrôle `check-report.sh`).
- **Profil `daily`** : `ezk-scout` n'y est pas (curated) ; au PO de décider.

## Notes / décisions

- **Relation avec la carte explorateur `20260821210633457` — DÉCISION PO (2026-09-10)** :
  on garde les **deux cartes SÉPARÉES**, avec une division nette de la cible —
  **ezk-scout cherche des BUGS**, l'**explorateur cherche des NOUVELLES FEATURES**
  (adaptations, trous à combler). MAIS les deux **mutualisent la commande
  d'exploration** : une **brique commune** (monter le banc isolé, user l'app,
  collecter des observations, rendre un **rapport** de brouillons sous gate humaine)
  surmontée de deux **lentilles** (bugs vs features). Ne PAS dupliquer cette brique :
  la factoriser, et que chaque carte la compose. La même précision est portée dans
  la carte explorateur. Politique de création commune : proposition → arbitrage
  humain, jamais tiré seul (cf. plus haut). Cette décision lève le blocage `ready`.
- **Prototype validé** : le run samplerz 2026-09-10 (crop #403, export #404) via le
  prompt ad hoc. Cette fiche **productise** ce prompt en outil de première classe.
- **Statut des bugs trouvés** : samplerz a introduit `# status: suggest` (trouvaille
  de test à confirmer). vectorz utilise `idea / ready`. À trancher au build : les
  bugs fichés naissent-ils `idea`, ou introduit-on un marqueur « scouté / à
  confirmer » ? (Ne pas les tirer directement sans revue — c'est le sens du
  find-only.) **Tranché au build (2026-09-30)** : pas de nouveau statut. Un brouillon validé
  naît `idea` (non tirable tant qu'il n'est pas groomé) avec `labels: [scout]` pour garder
  la provenance.
- **Décisions de build (2026-09-30)** : (1) la passe part en HTTP (`curl`), l'UI est opt-in
  (`--ui`) à cause de la règle `development/playwright-mcp-usage` ; (2) rapport, captures et journal
  vivent hors du dépôt cible ; (3) classé `méthode` / bande `cérémonies` dans `taxonomie.yml`, comme
  `ezk-bug` (à déplacer si le PO préfère `modules`) ; (4) la brique commune avec l'explorateur est
  portée par le gabarit, les deux scripts et `file`, la lentille `bugs` étant la seule écrite ici.
- **Capture d'écran** : réutiliser le mécanisme de la fiche `20260812104022228`
  (captures produit → doc/site) plutôt que d'en écrire un second.
- **Env de test isolé** : réutiliser `0102 ezk-testbed` (démarrer un environnement
  de test isolé — PR/branche/local), qui porte déjà l'isolation d'état. ⚠ La
  recette **émulateur Android** existe en local (`20260906135450000`) mais **n'est
  PAS encore sur `origin/main`** (retour Codex PR #217) — ne pas en dépendre en dur
  tant qu'elle n'est pas poussée ; s'y raccrocher quand elle arrive.
- **Localisation `fichier:ligne`** : opt-in et best-effort (une recherche de code
  qui pointe un candidat). Ne pas la vendre comme certaine.
- **Distinct de `20260812104022231`** (« DoR — balayer les surfaces produit au
  grooming ») : celle-là inventorie les surfaces AU GROOMING (avant de construire) ;
  `ezk-scout` chasse des bugs APRÈS coup, sur une app qui tourne.
- **Coût tokens** : une passe multi-sondes peut être lourde. Borner la passe (esprit
  `--tokens lean` d'`ezk-product-build`) et prévenir avant tout fan-out coûteux.
- **Émission de supervisabilité** : une passe en tâche de fond est un bon client du
  heartbeat / run (fiche 0103) pour rester visible au Moniteur.
