---
id: 0134
title: Propager les maj *breaking* d'un skill aux projets (pull + hook de drift + migrations datées)
type: feature        # feature | bug | refactor | chore
priority: P2         # P0 | P1 | P2 | P3
product: mega-city
status: idea         # idea | todo | in-progress | blocked | shipped
pr:
created: 2026-07-12
---

## Contexte / Problème

Un skill versionné est déployé **par symlink** (une source → global) : son **code** se
met à jour partout instantanément. Mais un changement de **schéma** (nouveau statut,
nouveau champ de front-matter, nouvelle structure de dossier…) impacte les **données
par-projet** (fiches, index, config) qui doivent l'adopter.

- Un ajout **non-breaking** (ex. `status: idea`, cf. skill `ezk-backlog`) = **0 migration**.
- Un changement **breaking** a besoin d'un mécanisme — sinon les N projets qui utilisent
  le skill divergent silencieusement.

Deux faces à outiller : **émettre** une migration quand un contrat mega-city change (côté
auteur), puis la **consommer** sans divergence silencieuse (côté projet) — au démarrage
**et** à chaque commande.

## Proposition

**Pull, pas push** (push skill→repos = risqué) — mécanisme **Skema** (*Skill Schema
Migrations*, cf. article [0175](0175-article-skema-skill-schema-migrations.md)), **généralisé
à tout artefact mega-city** (skill, agent, rule, cap, hook), pas seulement `ezk-backlog`.

### 1. Émission — à CHAQUE changement mega-city (côté auteur)

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

### 2. Consommation — pull, jamais auto-mute (côté projet)

- Chaque projet garde un **marqueur** des migrations **appliquées**.
- **Préflight par-commande** : **chaque commande `ezk-*`** lance un check **cheap (sans
  LLM)** — même primitive que le `check-layout-version.sh` d'`ezk-backlog` (statuts
  `ok | behind | ahead | missing`) — et **alerte / refuse** s'il reste des migrations en
  attente **avant** d'agir sur des données au mauvais schéma. C'est le garde-fou **au point
  d'usage**, complémentaire du signal global ci-dessous.
- **Cas `ahead` = refus, pas « continue »** : si les données par-projet sont **déjà migrées**
  mais que l'artefact/skill a été *rollback* à une version antérieure (statut `ahead`, 0
  migration en attente), le préflight **refuse quand même** — l'outil est en retard sur les
  données, agir corromprait un schéma plus récent — jusqu'à ce que la version de l'outil
  rattrape. `ahead` n'est donc **pas** un état de fonctionnement normal.
- **Cas `missing` = adoption explicite, pas « continue »** : un projet **déjà lié** mais
  **sans marqueur de version** (bind historique d'avant Skema — cf. 0186 : les binds actuels
  n'enregistrent aucune version) doit être **distingué d'un artefact non installé** (celui-là
  n'a pas de préflight du tout). Pour le legacy sans marqueur, le préflight **n'agit pas à
  l'aveugle** : il déclenche une **adoption/bootstrap** — écrire le marqueur à la version
  courante (baseline) si le schéma réel est à jour, sinon rejouer les migrations depuis
  l'origine — jamais un `continue` sur schéma inconnu.
- **SessionStart hook** (bash/node pur, **zéro LLM**) : signal **global** « N migrations en
  attente » en system-reminder → le LLM ne dépense des tokens **que si** l'utilisateur
  déclenche `migrate`.
- **Rollback natif** : données par-projet (`features/`…) **trackées git** → `git revert`
  suffit. Pas de moteur de rollback à écrire.

**Précédent concret (déjà livré)** : `ezk-backlog` **layout v1 → v2** — `VERSION`,
`migrations/002-…`, préflight `check-layout-version.sh`. Skema **existe** ; cette fiche le
**généralise** en standard mega-city (émission systématique + préflight par-commande).

**Portée** : mécanisme **transverse mega-city** — tous les artefacts, toutes les commandes ezk.

## Critères d'acceptation
- [ ] Format de migration défini : **`NNN-slug.md` ordonné** (le format `migrations/` déjà livré par ezk-backlog, ex. `002-…`) + section revert. Ordonnancement par **numéro**, pas par date dans le nom (cohérent avec le précédent) ; horodatage optionnel dans le corps.
- [ ] **Émission** : un changement de contrat **breaking** sur un artefact mega-city (skill/agent/rule/cap/hook) produit une migration, proposée ou rappelée — jamais oubliée silencieusement ; un changement non-breaking n'en produit pas.
- [ ] `VERSION`/`layout_version` porté par l'artefact, incrémenté avec chaque migration.
- [ ] Marqueur des migrations appliquées, par-projet.
- [ ] **Préflight par-commande** : chaque commande `ezk-*` vérifie les migrations en attente (primitive `check-layout-version.sh`) et alerte/refuse avant d'agir — pas seulement le SessionStart hook.
- [ ] **Cas `ahead` traité** : quand l'outil est en retard sur des données déjà migrées, le préflight refuse (schéma plus récent) au lieu de continuer.
- [ ] **Cas `missing` traité** : projet legacy lié sans marqueur → adoption/bootstrap explicite (baseline ou rejeu depuis l'origine), distinct d'un artefact non installé ; jamais de `continue` à l'aveugle.
- [ ] Hook de détection de drift **cheap** (sans LLM) qui remonte le signal global.
- [ ] Commande `migrate` (pull) déclenchée par l'utilisateur.
- [ ] Doc rollback = `git revert` (natif).

## Notes

Complément de [0018 — coquille I/O link vs copy] : 0018 propage le **code** live via
symlink ; 0029 gère les **données/schéma**. Épic, à groomer : granularité du marqueur,
migrations non-linéaires, rollback « dur » (au-delà du git revert). Issu du grooming
session 2026-07-12.

**Lien [0087](0087-plugin-claude-code-distribution.md)** (plugin Claude Code) : cette fiche
postule un `VERSION` porté par le skill — 0087 doit trancher **d'où vient cette version**
(tag umbrella vs version mega-city indépendante). Si 0087 aboutit, le `VERSION` de 0029
devient celui du plugin, et `/plugin update` remplace le « pull » esquissé ici pour le
**code** (0029 garde la charge des **migrations de données**). À re-groomer après 0087.

- **Nommage** : ce mécanisme **EST Skema** (*Skill Schema Migrations*) — voir l'article
  [0175](0175-article-skema-skill-schema-migrations.md) et le précédent d'unification du
  backlog [0064]. Le rendre grep-able ici évite de re-créer une fiche doublon.
- **⚠️ Doublon assumé à consolider avec [0186](0186-skema-versioning-migrations-skills-deployees.md)** :
  0186 spécifie **le même mécanisme Skema** (`VERSION`/`migrations` par-artefact, manifeste de
  version par-projet, checks de statut, migrations de données). 0134 et 0186 sont donc **deux
  fiches *idea* pour le même sujet** — à **consolider ou dé-chevaucher explicitement au
  grooming** (fusionner en une seule, ou cadrer l'une sur l'**émission** et l'autre sur la
  **consommation**). Ne **pas** les groomer indépendamment : risque de deux implémentations
  incompatibles.
- **Enrichissement 2026-08-10 (PO)** : ajout des deux exigences explicites — *émission à
  chaque changement mega-city* + *préflight dans chaque commande ezk* — et ancrage sur le
  précédent **déjà livré** d'`ezk-backlog` (`check-layout-version.sh`, `migrations/002`,
  layout v1→v2). L'**architecture/ADR** se tranchera via `/engineering:architecture` dans
  une **PR dédiée** (hors périmètre de cette fiche : ici on capture le *quoi*, pas le *comment*).
