---
name: ezk-backlog
argument-hint: "[help|init|list|add|groom|ready|next|review|ship|regen]"
description: >-
  Suit le backlog de features/bugs d'un projet en markdown versionné, pour ne
  jamais les perdre entre worktrees ni entre sessions. A utiliser quand
  l'utilisateur demande « c'est quoi la suite / les prochaines features »,
  veut initialiser le suivi des features d'un projet, ajouter/noter une idée ou
  un bug (avec dédoublonnage), groomer une fiche vers la Definition of Ready
  (« elle est ready ? »), passer le backlog en revue (sanity check), demander la
  prochaine fiche tirable, regrouper des fiches, marquer une feature livrée,
  (re)prioriser, cibler une version/jalon, ou voir l'état du backlog.
  Pilotable par sous-commandes : help, init, list, add, groom, ready, review,
  ship, regen. A la
  première invocation dans un projet, INITIALISE la structure (dossier features/,
  sous-dossier done/, fichier de suivi index) ; ensuite charge le backlog trié
  par priorité en contexte de session. Format léger : une fiche markdown par
  sujet, front-matter YAML = source de vérité du statut, index régénéré. Se
  branche sur ezk-sprint (qui pioche la prochaine fiche) et
  ezk-commits. Si le repo a déjà sa convention (roadmap/, docs/specs…),
  l'épouser plutôt que d'en imposer une.
---

# ezk-backlog

Tu maintiens le **backlog d'un projet** en markdown versionné dans le repo : une liste
de features/bugs **stable, ordonnée par priorité, et qui ne se perd jamais** — ni entre
worktrees, ni entre sessions, ni quand une branche est abandonnée.

## Usage (sous-commandes)

`/ezk-backlog [sous-commande] [args]` — ou en langage naturel (« c'est quoi la suite ? »).

| Sous-commande | Effet |
|---|---|
| `help` (ou **sans argument**) | Affiche ce tableau d'usage + l'état du backlog s'il existe |
| `init` | Initialise le suivi : `features/` + `done/` + index (helper `init.sh`) |
| `list` / `next` | Charge le backlog **trié par priorité** (P0→P3) en contexte de session |
| `add <description>` | Crée une fiche **après anti-doublon + cadrage** : vérifie qu'elle n'existe pas déjà, propose de regrouper / re-prioriser, fixe type & version (cadre via `product-brainstorming` si flou) |
| `groom <id>` | Fait mûrir UNE fiche vers la **DoR** (problème / valeur / critères) via `product-brainstorming` ciblé — ne change ni statut ni `ready:` |
| `ready <id>` | **Gate DoR** : refuse si un slot manque ; au vert pose `ready: <date>` (+ flip `idea→todo` le cas échéant) + regen + commit |
| `next --ready-only` | Renvoie LA prochaine fiche **tirable** (ready, non-épic) — point d'entrée unique d'ezk-sprint / ezk-product-builder (`next` seul reste l'alias de `list`) |
| `review [--delta]` | Sanity check du stock : rapport + propositions, arbitrage PO (jamais d'auto-modification) |
| `ship <id> [#PR]` | Passe la fiche `shipped`, la déplace dans `done/`, régénère l'index |
| `regen` | Régénère l'index depuis le front-matter des fiches |

> **Help** : invoquée sans sous-commande (ou avec `help`/`?`), affiche d'abord ce tableau, puis,
> si un backlog existe, son état trié par priorité. Sans sous-commande reconnue → traite la
> demande en prose (la skill reste pilotable naturellement).

## Comment ça s'« installe » dans un projet

La **skill elle-même est globale** : installée une seule fois dans `~/.claude/skills/`
(via le `install.sh` du repo claude-skills), elle est dispo dans **tous** tes projets.
Tu ne « l'installes » donc pas par projet — ce qui se crée **par projet**, c'est la
**structure de suivi**, scaffoldée par `init` à la première invocation.

## Invariant n°1 — le backlog vit sur `main`, commité

La cause des pertes « entre worktrees », ce n'est pas le format, c'est de stocker le
backlog dans un fichier **non-commité** (scratch local à un worktree). Donc : le dossier
de suivi et son index sont **commités**, la référence vit sur `main`, et on lit « la
prochaine feature » depuis là (visible depuis n'importe quel worktree). Un éventuel
« sprint en cours » (genre `SPRINT.md`) peut rester éphémère par-branche — **mais la
liste des features, elle, est sur main**.

## Layout par défaut

```
features/
  README.md            # index/suivi auto-généré (id, titre, type, priorité, statut, PR)
  0001-slug.md         # features/bugs ACTIFS (idea / todo / in-progress / blocked), id 4 chiffres
  0002-autre-slug.md
  done/                # fiches LIVRÉES (déplacées ici quand status: shipped)
    0000-vieux-slug.md
```

Chaque fiche commence par un **front-matter YAML = source de vérité** :

```yaml
---
id: 0002
title: Échec de connexion mobile invisible (caméra tourne, zéro erreur)
type: feature        # feature | bug | refactor | chore | epic
priority: P0         # P0 | P1 | P2 | P3
version:             # optionnel — jalon ciblé, ex. "V1.1" (vide si non pertinent)
epic:                # optionnel — id de la fiche épic parente (type: epic) ; jamais d'épic → épic (ADR-0017)
status: todo         # idea | todo | in-progress | blocked | shipped
ready:               # YYYY-MM-DD — posé par le gate `ready <id>` (DoR complète) ; vide = non-ready
pr:                  # ex. "#118" quand une PR existe
created: 2026-06-23
---
```

Puis le corps libre (cf. `feature-template.md`) : Contexte/Problème, Proposition, Critères
d'acceptation (cases à cocher), Notes. Statuts : 💡 idea · 🔴 todo · 🟠 in-progress · ⛔ blocked · ✅ shipped.

> **Une seule source de vérité** : le **front-matter** de chaque fiche. L'index `README.md`
> est **régénéré** (`regen`) — on ne l'édite jamais à la main (ça tue la double-saisie statut).

## Le statut `idea` — le cran « pas encore groomé » (Definition of Ready)

Tout ce qui arrive n'est pas une fiche **actionnable**. Une **direction**, une **question**
ouverte, une intuition à explorer = `status: idea` (pas `todo`). C'est le cran de
raffinement **d'avant le backlog** (l'« Icebox » Scrum / la colonne *Triage* de GitHub
Projects) : capturé **cheap** pour ne rien perdre, **sans polluer** la liste de travail
P0→P3. Le **grooming** (`groom <id>`, moteur `product-brainstorming`) le fait mûrir,
et le **gate `ready <id>`** le promeut en `todo` **ready** quand on le tire — c'est là
qu'on fixe problème/valeur/critères, pas à la capture (ADR-0016).

- `list` / `regen` **trient les `idea` à part**, sous l'actionnable (comme `blocked`) —
  ils ne comptent pas dans le flux P0→P3.
- `add` : si la demande est une **direction non mûre** plutôt qu'une fiche prête, crée-la
  directement en `status: idea` (au lieu de forcer un `todo` creux **ou** de tout
  brainstormer à froid maintenant). La priorité **situe** l'idée — on la demande, on ne
  l'invente pas.
- Volontairement **MVP** : un cran `question`/`spike` distinct est **différé** — un `idea`
  suffit pour l'instant.

## `init` — initialiser le suivi dans un projet

1. **Détecter une convention existante** (`roadmap/`, `docs/specs/`, `.lifefindsaway/`,
   GitHub Issues…). Si oui → l'épouser, **ne rien créer**.
2. Sinon, **scaffolder** via le helper de cette skill, à la racine du projet :
   `bash <skill>/init.sh` (crée `features/` + `features/done/` + `README.md` index vide +
   `feature-template.md`). Idempotent (n'écrase pas un `roadmap/` existant).
3. Commit `chore(features): init backlog`. Confirmer le chemin créé.

## Épouser une convention existante (NE PAS churner)

- **`roadmap/`** (ex. job-app : `roadmap.md` index + `backlog/` + `implemented/` + `adr/`)
  → opère DESSUS : `list` = `roadmap/backlog/*.md` triées par la table `roadmap.md` ;
  `ship` = `git mv` backlog→`implemented/` + retirer la ligne de `roadmap.md`.
- **`docs/specs/`, `.lifefindsaway/`, GitHub Issues…** → suis l'existant.
- Rien de tout ça → `init`.

Le but de la skill est la **discipline** (backlog commité, 1 fiche/sujet, statut unique en
front-matter, dossier `done/`, 1 PR/feature), pas un dossier précis.

## Multi-backlogs (monorepo) — quel backlog viser ?

Un monorepo peut porter plusieurs backlogs (ex. vectorz : `features/` racine +
`products/mega-city/features/`). Règle (ADR-0017 A13) : **le backlog le plus proche du
cwd** ; si l'ambiguïté demeure (cwd à la racine, sujet côté produit), **demander** —
ne jamais deviner. Toutes les sous-commandes (`add`, `groom`, `ready`, `next`,
`review`, `ship`, `regen`) opèrent sur le backlog ainsi résolu ; `regen` se lance avec
la racine et le titre du backlog visé (script paramétré).

## Détail des sous-commandes

### `list` / `next` — « c'est quoi la suite ? »
1. Aucun suivi encore ? → `init`. 2. Localise le backlog. 3. Lis le front-matter de chaque
fiche **active** (hors `done/`), charge-les en contexte et **affiche-les triées par priorité**
(P0 d'abord), format court `Pn · id · titre · statut` (suffixe ` · vX.Y` si une version est ciblée).
`blocked` à part ; les `idea` **tout en bas** (non-groomées, hors flux P0→P3). Ne dump pas le contenu.

### `add <description>` — créer une fiche, SANS doublonner ni diluer le backlog

Avant de créer quoi que ce soit, **protéger la cohérence du backlog** (l'ordre des étapes compte ;
sur un backlog vide ou minuscule, les étapes 2-3 sont triviales — ne les sur-joue pas) :

1. **Clarté d'abord.** Si la demande est vague (une ligne floue, ni problème ni valeur claire),
   ne crée PAS une fiche `todo` creuse. Deux issues : soit **cadrer** en invoquant
   **`product-management:product-brainstorming`** (problème réel, valeur, critères d'acceptation)
   puis revenir avec une description nette ; soit, si l'utilisateur veut juste **la garder**
   sans la cadrer maintenant, la **capturer telle quelle en `status: idea`** (le grooming
   viendra quand il la tirera). Saute cette étape si la demande est déjà précise.
2. **Anti-doublon.** Charge le backlog (fiches actives **+ `done/`**) et compare la demande aux
   fiches existantes **par intention** (pas juste par mots-clés). Si une fiche **équivalente existe** :
   - active → ne crée pas de doublon ; propose de l'**enrichir / re-prioriser** ;
   - `shipped` → signale-la ; ne rouvre que si c'est un **vrai** nouveau besoin (alors « suite de #id »).
   Montre la/les fiche(s) candidate(s) et **demande confirmation** avant de poursuivre.
3. **Regroupement.** Si la demande **recoupe partiellement** une/des fiche(s) (même domaine, ou
   sous-tâche d'un épic) → propose de **regrouper** (fusionner, ou rattacher comme sous-point/critère)
   plutôt que de multiplier les fiches. L'utilisateur tranche.
4. **Type, priorité, version.**
   - `type` ∈ {feature | bug | refactor | chore} — déduis, **demande si ambigu**.
   - `priority` ∈ {P0…P3} — **demande si absente**, ne l'invente jamais. Profite de l'ajout pour
     **proposer un re-classement** des priorités si la nouvelle fiche change l'ordre relatif (sans l'imposer).
   - `version` *(optionnel)* — si l'utilisateur cible un jalon (ex. `V1.1`), renseigne `version:` ; sinon laisse vide.
5. **Création.** Seulement maintenant : `id` = max(actifs + done) + 1 (4 chiffres) ; `slug` kebab court ;
   fiche depuis `feature-template.md`, front-matter rempli (`status: todo` — ou `idea` si non-groomé,
   cf. étape 1 ; `created` = date du jour — demande-la si inconnue, ne l'invente pas). Puis `regen`.
   Commit `docs(features): add <id> <slug>`.

### `groom <id>` — faire mûrir UNE fiche vers la DoR (ADR-0016, fiche 0056)

1. Charge la fiche ; identifie les slots **DoR** manquants — **problème** (contexte réel,
   reproduction si bug), **valeur** (pourquoi ça compte), **critères d'acceptation**
   (observables, vérifiables).
2. Session de raffinement **ciblée** sur ces slots via
   `product-management:product-brainstorming` ; le panel de challenge (fiche 0057) est
   composable en étape optionnelle.
3. Écris les enrichissements dans la fiche. **Ne change ni le statut ni `ready:`** —
   c'est le job du gate.

Quand groomer : au moment de **tirer** la fiche (pas à la capture — une `idea` jamais
tirée ne mérite pas de grooming). Cadrer une demande floue à la création reste le job
d'`add` (étape 1).

### `ready <id>` — le gate DoR (bloquant)

1. Vérifie les 3 slots DoR. **Un slot manque → REFUS motivé** (dis précisément quoi
   groomer) ; ne touche à rien.
2. Au vert : pose `ready: <YYYY-MM-DD>` dans le front-matter (date du jour — demande-la
   si inconnue), flip `idea → todo` le cas échéant, `regen`, commit
   `docs(features): ready <id>`.

Règles (ADR-0016 §2) : un `todo` né via `add` n'est **pas présumé ready** (pas de champ
`ready:` = non tirable sans passage ici) ; **aucun grandfathering** des fiches
antérieures au gate ; `review` peut proposer la **révocation** d'un `ready:` devenu faux.

### `next --ready-only` — LA prochaine fiche tirable (point d'entrée unique)

Parcours le backlog trié (P0→P3 puis id) et renvoie la **première fiche éligible** :
`status: todo` **et** `ready:` posé.

**Réponds toujours en deux parties** : (a) la fiche tirable (ou « aucune ») ET (b) la
**tête bloquée** — les fiches **`status: todo` sans `ready:`** de priorité *supérieure*
sautées (et rien d'autre : `idea`, `blocked`, `in-progress` et `type: epic` sont hors
de ce signal — ils ne sont pas tirables par nature et ne se groome-gatent pas à
l'intake). **Ne saute jamais silencieusement un `todo` de tête non-ready** : construire
une P2 ready pendant qu'un `todo` P0 non-ready attend est une inversion de priorité
que l'appelant doit arbitrer (groomer la tête d'abord, ou décision journalisée).

- Une fiche `type: epic` (ADR-0017) n'est **jamais tirable** : descends sur son prochain
  enfant ready (champ `epic:`), sinon passe à la fiche suivante.
- Aucune fiche éligible → dis-le et **propose le groom de la fiche de tête** ; en run
  autonome, c'est le checkpoint bloquant « aucune fiche ready » d'ezk-product-builder.
- **Soupape PO** : l'opérateur peut décider de tirer une fiche non-ready — décision
  explicite, **journalisée** (note dans la fiche + scratch de sprint).

ezk-sprint et ezk-product-builder passent par **ici** : aucune logique de gate
réimplémentée en aval (test de séparabilité).

### `review [--delta]` — le sanity check du stock (ADR-0016 §4, fiche 0071)

Deux modes, à **cadence bornée** :
- **complet** : après tout pivot structurant (ADR accepté qui invalide des fiches) et
  tous les **5 sprints** (défaut, réglable). Porte sur tout le stock actif
  (+ `done/` pour les doublons).
- **`--delta`** : avant les sprint plannings intermédiaires — uniquement les fiches
  modifiées depuis le dernier complet + le top P0/P1.

Contrôles (jugement LLM) :
1. **Validité** — la fiche est-elle encore vraie (code livré entre-temps, ADR
   postérieur qui contredit) ?
2. **Doublons / regroupements** par intention (même moteur que l'anti-doublon d'`add`).
3. **Cohérence de l'ordre** P0→P3 sur l'ensemble (l'ordre relatif, pas juste les buckets).
4. **Staleness** — vieux `todo` jamais tirés → proposer rétrogradation en `idea` ou clôture.
5. **Cohérence épic/enfants** (ADR-0017) — épic `shipped` avec enfants actifs, épic
   `todo` aux enfants tous livrés, épic fourre-tout sans objectif livrable.
6. **Révocation** — `ready:` devenus faux (le contexte a bougé depuis le gate).

Les **compteurs viennent du script** (`regen`, doctrine ADR-0001 — ne les recompte
jamais à la main) : fiches par statut, `todo` ready, création médiane des `todo`.
Sortie = **rapport + propositions numérotées** ; l'arbitrage est au **PO** — aucune
modification de fiche sans son accord explicite (jamais d'auto-suppression).

### `ship <id> [#PR]`
1. Front-matter : `status: shipped`, `pr: "#X"`. 2. `git mv features/<id>-<slug>.md features/done/`
(layout `roadmap/` : backlog→`implemented/`). 3. `regen`. Commit `docs(features): ship <id> (#X)`.

### `regen`
Délègue au script **paramétré** `bin/regen-backlog.sh [racine] [titre]` (fiche 0072 —
le MÊME script sert tous les backlogs, plus d'« adaptation » manuelle). Il reconstruit
la table depuis le front-matter de **toutes** les fiches : colonnes
`# | Titre | Type | Prio | Statut | PR`, triées par priorité puis id, plus deux
**colonnes conditionnelles** (ADR-0017 A12) : `Version` si au moins un `version:`,
`Épic` si au moins un `epic:`. Sections à part, hors tri actionnable P0→P3 :
« 🧭 Épics » (les `type: epic`, jamais tirables) et « 💡 Idées (non groomées) ».
Le script émet aussi sur stdout les **compteurs déterministes** (par statut, `todo`
ready, épics, création médiane des `todo`) — `review` les lit tels quels, le LLM ne
recompte jamais (ADR-0001 / ADR-0016 §5) — et des **warnings d'intégrité** non
bloquants sur stderr (A7) : `epic:` pendant, cible non-épic, sous-épic (2 niveaux max).
DoD exécutable du script : `bin/test-regen-backlog.sh`.

## Intégration

- **ezk-sprint** : à l'intake d'un sprint, ce skill fournit *la prochaine fiche tirable*
  (`next --ready-only`) ; à la clôture, `ship`. ezk-backlog = le **quoi/où**,
  ezk-sprint = le **comment**.
- **ezk-commits** : commits `chore(features): …` / `docs(features): …` ; 1 PR/feature.

## Garde-fous

- Ne jamais inventer une priorité, une date ou un n° de PR : demander si inconnu.
- Gate DoR **bloquant** : pas de tirage d'une fiche sans `ready:` — sauf soupape PO
  (décision explicite journalisée). Seul `ready <id>` pose le champ.
- Une **direction non mûre** = `status: idea`, pas un `todo` creux (ne pas polluer l'actionnable ; groomer au moment de la tirer).
- **Avant tout `add` : anti-doublon obligatoire** — 1 sujet = 1 fiche ; regrouper plutôt que multiplier ; jamais de fiche creuse (cadrer via `product-brainstorming` si flou).
- Ne pas éditer l'index à la main (toujours `regen`).
- Ne pas créer `features/` si le repo a déjà une convention → l'épouser.
- Le backlog est commité sur `main` ; un scratch de sprint peut rester par-branche.
