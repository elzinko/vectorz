---
id: 0186
title: Généraliser Skema — versioning + migrations des skills déployées (registre de bind)
type: feature
priority: P2
product: mega-city
epic:
status: idea
ready:
pr:
created: 2026-08-09
---

# 0186 — Généraliser Skema : versioning + migrations des skills déployées

## Contexte / Problème

Le pattern **Skema** (Skill Schema Migrations) existe et est documenté
(`skills/ezk-backlog/migrations/README.md`), mais il n'est **implémenté que pour
une seule skill : `ezk-backlog`**, et il versionne le **layout des artefacts que
cette skill gère** (le dossier `features/` d'un projet : README-index v1 →
README curé + `BACKLOG.md` v2), pas les skills elles-mêmes.

Constat après audit (2026-08-09) :

- Aucune autre skill (21) ni agent (7) ne porte de `layout_version` ni de
  dossier `migrations/`.
- Le `bind` (cap `claude-code` / `claude-desktop`) matérialise les skills dans
  le `.claude/` d'un projet **sans enregistrer quelle version a été posée** → pas
  de chemin déterministe pour « mettre à jour proprement les skills déployées »
  quand la source évolue.
- Donc si un front-matter de skill change (ou une étape de son contrat), rien ne
  propose la mise à jour aux projets déjà intégrés — ce que Skema fait pourtant
  déjà, mais uniquement pour le layout `features/`.

Cible : rendre le mécanisme **général** — chaque skill peut être versionnée et
migrée, et un projet sait quelles versions il a déployées.

## Proposition

Étendre Skema du cas `ezk-backlog` (layout d'artefacts) au **déploiement des
skills** elles-mêmes, en réutilisant le même contrat (VERSION entière +
front-matter + migrations `NNN-slug.md` ordonnées, jamais de mutation sans OK).

**Lot 1 (MVP déterministe)** — registre de bind :

- au `bind`, écrire un **manifeste versionné** dans le projet cible (ex.
  `.claude/.skema.json` ou `.iamthelaw/skema.lock`) : `{ skill: version }` posé,
  + hash de source, + date.
- `skema status <projet>` : compare le manifeste posé vs les VERSION sources →
  `PENDING` par skill (réutilise la logique de `check-layout-version.sh`).

**Lot 2** — migrations par skill :

- convention `skills/<skill>/migrations/NNN-*.md` + `VERSION` généralisée (pas
  seulement `ezk-backlog`) ;
- `skema upgrade <projet> [--apply]` : **propose** les migrations pending (helpers
  mécaniques optionnels), n'applique qu'avec `--apply` — règle d'or inchangée.

**Lot 3** — propagation de contrat : une migration peut toucher les artefacts du
projet (ex. changement de front-matter de fiches), pas seulement les fichiers de
la skill. C'est déjà le cas de la migration `002` d'ezk-backlog — la généraliser.

Frontière déterministe (ADR-0001) : le LLM **propose/juge**, le script **range**
(écrit le manifeste, applique les helpers, commit). Aucune mutation silencieuse.

## Critères d'acceptation

- [ ] Le `bind` écrit un manifeste versionné `{skill: version}` dans le projet cible (idempotent).
- [ ] `skema status <projet>` liste, par skill, `INSTALLED / CURRENT / PENDING` sans rien muter.
- [ ] Au moins deux skills (dont une autre qu'`ezk-backlog`) portent une `VERSION` + `migrations/`.
- [ ] `skema upgrade` propose les migrations pending et n'applique qu'avec `--apply` (règle d'or respectée).
- [ ] Une migration de démonstration met à jour un front-matter d'artefact dans un projet client (cas reproduit).
- [ ] Gate locale verte (typecheck/lint/tests).

## Notes / décisions

- Prérequis conceptuel de l'article **0187** (« LLM skills migration ») — l'écrire
  en parallèle force à clarifier le design ici.
- Réutiliser tel quel `skills/ezk-backlog/scripts/check-layout-version.sh` comme
  brique de comparaison (ne pas ré-inventer).
- Premier client naturel du registre : le bind des skills ezk dans un produit
  (ex. `gmail-cleanerz`).
- Surface potentiellement gelée une fois posée (le manifeste devient un contrat) —
  à trancher au design.
