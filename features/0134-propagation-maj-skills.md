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

- **Toute** création / modification / suppression d'un artefact mega-city qui touche un
  **contrat consommé par-projet** (statut, champ de front-matter, structure de dossier,
  nom de script/commande…) **émet une migration** : entrée markdown **ordonnée + datée**,
  façon Flyway, avec sa section « revert ».
- Un ajout **non-breaking** (ex. `status: idea`) = **0 migration** (règle inchangée).
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
- [ ] Format de migration défini (markdown daté + revert) — réutilise le format `migrations/` d'ezk-backlog.
- [ ] **Émission** : un changement de contrat sur un artefact mega-city (skill/agent/rule/cap/hook) produit une migration, proposée ou rappelée — jamais oubliée silencieusement.
- [ ] `VERSION`/`layout_version` porté par l'artefact, incrémenté avec chaque migration.
- [ ] Marqueur des migrations appliquées, par-projet.
- [ ] **Préflight par-commande** : chaque commande `ezk-*` vérifie les migrations en attente (primitive `check-layout-version.sh`) et alerte/refuse avant d'agir — pas seulement le SessionStart hook.
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
- **Enrichissement 2026-08-10 (PO)** : ajout des deux exigences explicites — *émission à
  chaque changement mega-city* + *préflight dans chaque commande ezk* — et ancrage sur le
  précédent **déjà livré** d'`ezk-backlog` (`check-layout-version.sh`, `migrations/002`,
  layout v1→v2). L'**architecture/ADR** se tranchera via `/engineering:architecture` dans
  une **PR dédiée** (hors périmètre de cette fiche : ici on capture le *quoi*, pas le *comment*).
