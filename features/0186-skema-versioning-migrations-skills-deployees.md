---
id: 0186
title: Skema généralisé — versioning + migrations de tout artefact mega-city (émission · registre de bind · consommation)
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-09
---

# 0186 — Skema généralisé : versioning + migrations de tout artefact mega-city

> **Fiche consolidée le 2026-08-12** : fusionne l'ancienne **0134** (« propager les maj
> *breaking* d'un skill aux projets ») dans celle-ci. C'était **le même mécanisme Skema**
> vu sous deux angles — une seule fiche désormais (le détail de 0134 vit dans les sections
> *Émission* et *Consommation* ci-dessous ; son historique reste dans git).

## Contexte / Problème

Le pattern **Skema** (*Skill Schema Migrations*, cf. article
[0175](0175-article-skema-skill-schema-migrations.md)) existe et est documenté
(`skills/ezk-backlog/migrations/README.md`), mais il n'est **implémenté que pour une
seule skill : `ezk-backlog`**, et il ne versionne que le **layout des artefacts que cette
skill gère** (le dossier `features/` d'un projet : README-index v1 → README curé +
`BACKLOG.md` v2), pas les skills elles-mêmes ni les autres contrats.

Un skill est déployé **par symlink** (une source → global) : son **code** se met à jour
partout instantanément. Mais un changement de **schéma** (nouveau statut, nouveau champ de
front-matter, nouvelle structure de dossier…) impacte les **données par-projet** (fiches,
index, config) qui doivent l'adopter.

- Un ajout / changement **non-breaking** (ex. `status: idea`) = **0 migration**.
- Un changement **breaking** a besoin d'un mécanisme — sinon les N projets qui utilisent
  le skill divergent silencieusement.

Constat après audit (2026-08-09) :

- Aucune autre skill (21) ni agent (7) ne porte de `VERSION`/`layout_version` ni de dossier
  `migrations/`.
- Le `bind` (cap `claude-code` / `claude-desktop`) matérialise les skills dans le `.claude/`
  d'un projet **sans enregistrer quelle version a été posée** → pas de chemin déterministe
  pour « mettre à jour proprement les skills déployées » quand la source évolue.

Cible : rendre le mécanisme **général** — **tout artefact mega-city** (skill, agent, rule,
cap, hook) peut être versionné et migré ; un projet **sait** quelles versions il a
déployées, et **consomme** les migrations sans divergence silencieuse.

## Proposition

**Pull, pas push** (push skill→repos = risqué) — étendre Skema du seul cas `ezk-backlog`
(layout d'artefacts) à **tout artefact mega-city et au déploiement des skills elles-mêmes**,
en réutilisant le même contrat (`VERSION` entière + front-matter + migrations `NNN-slug.md`
ordonnées, **jamais de mutation sans OK**). Trois faces à outiller : **émettre**,
**enregistrer ce qui est déployé**, **consommer**.

### 1. Émission — à CHAQUE changement breaking (côté auteur)

- Toute création / modification / suppression d'un artefact mega-city qui **casse** un
  **contrat consommé par-projet** (statut, champ de front-matter, structure de dossier,
  nom de script/commande…) **émet une migration** : entrée markdown **ordonnée**
  (`NNN-slug.md`, exactement le format `migrations/` déjà livré par `ezk-backlog`, ex.
  `002-…`), avec sa section « revert ». L'ordre vient du **numéro** (pas d'une date dans le
  nom) ; l'horodatage éventuel va dans le corps. Le déclencheur est le caractère
  **breaking**, pas la simple modification.
- Un ajout / changement **non-breaking** (ex. `status: idea`, nouveau champ optionnel) =
  **0 migration**. La règle est donc **unique et décidable par un gate** : migration ⇔
  rupture de contrat.
- L'émission est une **discipline outillée**, pas un réflexe humain : le geste d'auteur
  (via `ezk-ezk` / le steward, ou un gate côté repo skills) **propose** la migration dès
  qu'un changement de contrat est détecté — jamais oubliée silencieusement.
- L'artefact porte un `VERSION` (ou `layout_version`) qui **incrémente avec la migration**.

### 2. Registre de bind — quelle version est déployée (côté déploiement)

- Au `bind`, écrire un **manifeste versionné** dans le projet cible (ex.
  `.claude/.skema.json` ou `.iamthelaw/skema.lock`) : `{ artefact: version }` posé, + hash
  de source, + date. C'est le **marqueur** des versions déployées, par-projet.
- `skema status <projet>` : compare le manifeste posé vs les `VERSION` sources → par
  artefact `INSTALLED / CURRENT / PENDING`, **sans rien muter** (réutilise la logique de
  `check-layout-version.sh` d'`ezk-backlog`, ne pas ré-inventer).

### 3. Consommation — préflight par-commande, jamais auto-mute (côté projet)

- **Préflight par-commande** : **chaque commande `ezk-*`** lance un check **cheap (sans
  LLM)** — même primitive `check-layout-version.sh` (statuts `ok | behind | ahead |
  missing`) — et **alerte / refuse** s'il reste des migrations en attente **avant** d'agir
  sur des données au mauvais schéma. Garde-fou **au point d'usage**, complémentaire du
  signal global.
- **Cas `ahead` = refus, pas « continue »** : si les données par-projet sont **déjà
  migrées** mais que l'artefact/skill a été *rollback* à une version antérieure (statut
  `ahead`, 0 migration en attente), le préflight **refuse quand même** — l'outil est en
  retard sur les données, agir corromprait un schéma plus récent — jusqu'à ce que la
  version de l'outil rattrape. `ahead` n'est **pas** un état de fonctionnement normal.
- **Cas `missing` = adoption explicite, pas « continue »** : un projet **déjà lié** mais
  **sans marqueur de version** (bind historique d'avant Skema — les binds actuels
  n'enregistrent aucune version) doit être **distingué d'un artefact non installé** (celui-là
  n'a pas de préflight du tout). Pour le legacy sans marqueur, le préflight **n'agit pas à
  l'aveugle** : il déclenche une **adoption/bootstrap** — écrire le marqueur à la version
  courante (baseline) si le schéma réel est à jour, sinon rejouer les migrations depuis
  l'origine — jamais un `continue` sur schéma inconnu.
- **SessionStart hook** (bash/node pur, **zéro LLM**) : signal **global** « N migrations en
  attente » en system-reminder → le LLM ne dépense des tokens **que si** l'utilisateur
  déclenche la mise à jour.
- **`skema upgrade <projet> [--apply]`** (le « pull », déclenché par l'utilisateur) :
  **propose** les migrations pending (helpers mécaniques optionnels), n'applique qu'avec
  `--apply` — **règle d'or inchangée**.
- **Rollback natif** : données par-projet (`features/`…) **trackées git** → `git revert`
  suffit. Pas de moteur de rollback à écrire.

### Portée des migrations : contrat, pas seulement fichiers de skill

Une migration peut toucher les **artefacts du projet** (ex. changement de front-matter de
fiches), pas seulement les fichiers de la skill — c'est déjà le cas de la migration `002`
d'`ezk-backlog`, à généraliser.

**Frontière déterministe (ADR-0001)** : le LLM **propose / juge**, le script **range**
(écrit le manifeste, applique les helpers, commit). Aucune mutation silencieuse.

**Précédent concret (déjà livré)** : `ezk-backlog` **layout v1 → v2** — `VERSION`,
`migrations/002-…`, préflight `check-layout-version.sh`. Skema **existe** ; cette fiche le
**généralise** en standard mega-city (émission systématique + registre de bind + préflight
par-commande).

## Critères d'acceptation

- [ ] **Format de migration** défini : **`NNN-slug.md` ordonné** (le format `migrations/`
      déjà livré par ezk-backlog, ex. `002-…`) + section revert. Ordre par **numéro**, pas
      par date dans le nom ; horodatage optionnel dans le corps.
- [ ] **Émission** : un changement de contrat **breaking** sur un artefact mega-city
      (skill/agent/rule/cap/hook) produit une migration, proposée ou rappelée — jamais
      oubliée silencieusement ; un changement non-breaking n'en produit pas.
- [ ] **`VERSION`/`layout_version`** porté par l'artefact, incrémenté avec chaque migration ;
      au moins **deux artefacts** (dont un autre qu'`ezk-backlog`) en portent un + `migrations/`.
- [ ] **Registre de bind** : le `bind` écrit un manifeste versionné `{artefact: version}` dans
      le projet cible (idempotent).
- [ ] **`skema status <projet>`** liste, par artefact, `INSTALLED / CURRENT / PENDING` sans
      rien muter.
- [ ] **Préflight par-commande** : chaque commande `ezk-*` vérifie les migrations en attente
      (primitive `check-layout-version.sh`) et alerte/refuse avant d'agir — pas seulement le
      SessionStart hook.
- [ ] **Cas `ahead` traité** : quand l'outil est en retard sur des données déjà migrées, le
      préflight refuse (schéma plus récent) au lieu de continuer.
- [ ] **Cas `missing` traité** : projet legacy lié sans marqueur → adoption/bootstrap
      explicite (baseline ou rejeu depuis l'origine), distinct d'un artefact non installé ;
      jamais de `continue` à l'aveugle.
- [ ] **Hook de détection de drift** cheap (sans LLM) qui remonte le signal global en SessionStart.
- [ ] **`skema upgrade <projet> [--apply]`** (pull) : propose les migrations pending, n'applique
      qu'avec `--apply` (règle d'or respectée).
- [ ] **Migration de démonstration** met à jour un front-matter d'artefact dans un projet client
      (cas reproduit).
- [ ] **Doc rollback** = `git revert` (natif).
- [ ] Gate locale verte (typecheck/lint/tests).

## Notes / décisions

- **Nommage** : ce mécanisme **EST Skema** (*Skill Schema Migrations*) — voir l'article
  [0175](0175-article-skema-skill-schema-migrations.md), l'article compagnon
  [0187](0187-article-llm-skills-migration.md) et le précédent d'unification du backlog [0064].
- **Consolidation (2026-08-12)** : fusionne l'ancienne fiche **0134** (« propager les maj
  *breaking* d'un skill aux projets », créée 2026-07-12). Les deux décrivaient le même
  mécanisme Skema ; 0134 apportait le détail **émission** (déclencheur breaking) et
  **consommation** (préflight par-commande, cas `ahead`/`missing`, rollback git, pull) —
  intégré ci-dessus. 0134 est retirée du backlog actif (historique dans git).
- **Lien [0087](0087-plugin-claude-code-distribution.md)** (plugin Claude Code) : cette fiche
  postule un `VERSION` porté par l'artefact — 0087 doit trancher **d'où vient cette version**
  (tag umbrella vs version mega-city indépendante). Si 0087 aboutit, ce `VERSION` devient
  celui du plugin et `/plugin update` remplace le « pull » esquissé ici pour le **code**
  (Skema garde la charge des **migrations de données**). À re-groomer après 0087.
- **Arbitrage déploiement local vs cloud (grooming 2026-08-12)** — deux axes **orthogonaux**
  souvent confondus : (1) **où vit le CODE** de l'artefact — symlink global (`~/.claude` →
  vectorz, *link mode* [0123]/[0130]) vs copie committée par-projet (*copy mode*) ; (2)
  **comment migrent les DONNÉES** du projet — c'est Skema (cette fiche). Point de vigilance :
  **la migration est de la donnée projet, pas du code → elle existe dans les deux modes de
  déploiement à l'identique**, elle ne départage donc **pas** link vs copy (copier les skills
  dans le repo ne dispense d'aucune migration).
- **Vrai discriminant = portée cloud** : un environnement Anthropic cloud **clone le repo** et
  ne voit **jamais** les symlinks `~/.claude` → seul le **committé** y arrive. Posture
  recommandée (à valider au design) :
  - **code des skills = reste global/symlink** pour le loop d'auteur (source unique,
    edit-once-live-everywhere — [0018]) ; ne pas vendoriser N copies d'une logique éditée en continu ;
  - **le projet committe (petit, data-like, cloud-friendly)** : le **lock Skema**
    `{artefact: version}` (le registre de bind ci-dessus) **+** le **pack de pratiques portable**
    ([0177](0177-pack-pratiques-projet-portables.md)) pointé depuis le README, lu par n'importe
    quel driver LLM (cloud compris) ;
  - **cloud = matérialiser le CODE dans l'env cloud**, via deux options — **distinctes de la
    *direction* de mise à jour** (matérialiser ≠ pousser : une copie n'est **pas** un « push ») :
    - **(a) plugin/marketplace ([0087](0087-plugin-claude-code-distribution.md))** — **une**
      source versionnée tirée par local ET cloud (`/plugin update`) ;
    - **(b) copie committée par-projet (*copy mode*)** — le code vit dans le repo, mis à jour
      par un **installeur/updater pull-based par-projet** (pattern `vectorz init` / BMAD décrit
      en [0087](0087-plugin-claude-code-distribution.md)). Ceci **respecte** « pull, pas push » :
      ce que la règle rejette, c'est un **push central** skill → N repos, **pas** la
      matérialisation copiée en soi.
  - **Reste à trancher (ADR, couplé [0087](0087-plugin-claude-code-distribution.md))** : plugin
    vs copy mode pour la brique cloud. Attention aux **faux axes** : ce n'est ni push/pull, ni
    « une copie vs N copies » — **les deux matérialisent des copies** (un plugin est copié à
    l'installation et n'évolue qu'au `/plugin update` ; `vectorz init` committe une copie
    versionnée par-projet). Le **vrai** critère = le **périmètre de stockage & de mise à jour** :
    **géré centralement** (registre/marketplace, `/plugin update` propage la version à tous les
    installs) vs **committé dans le projet** (la copie vit dans le repo, versionnée avec lui,
    mise à jour par-projet).
- **Complément de [0018 — coquille I/O link vs copy]** : 0018 propage le **code** live via
  symlink ; Skema gère les **données/schéma**.
- **Prérequis conceptuel de l'article [0187](0187-article-llm-skills-migration.md)** —
  l'écrire en parallèle force à clarifier le design ici.
- Premier client naturel du registre : le bind des skills ezk dans un produit (ex.
  `gmail-cleanerz`).
- Surface potentiellement gelée une fois posée (le manifeste devient un contrat) — à
  trancher au design.
- **Épic, à groomer** : granularité du marqueur, migrations non-linéaires, rollback « dur »
  (au-delà du `git revert`). L'**architecture/ADR** se tranchera via `/engineering:architecture`
  dans une PR dédiée (ici on capture le *quoi*, pas le *comment*).
