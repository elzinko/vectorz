---
id: development/active-views-exclude-terminal-status
kind: disposition
level: MUST
title: Une vue du travail exclut les statuts terminaux par le statut, pas par le dossier done/
enforcements:
  - type: agent-check
    agent: ezk-reviewer
---

- **Toute vue qui présente le TRAVAIL À FAIRE** d'un backlog (board d'avancement, sections
  « tirables » / « actionnable » / « en cours » de `PORTFOLIO.md`, `plan-*`) exclut les fiches
  de statut **terminal** (`superseded` / `merged` / `split`) **par le statut**, pas seulement
  par l'emplacement `done/`. Motif : une fiche terminale peut légitimement **rester dans
  `features/`** — la déplacer dans `done/` casserait ses liens relatifs (dette héritée `0051`).
- **Une seule source** pour la liste des statuts terminaux : la constante `TERMINAUX`
  (`products/mega-city/src/core/avancement-data.ts`). Les vues TS la lisent ; une vue ne
  **redéclare** pas sa propre liste divergente.
- **Frontière avec l'index** : `features/BACKLOG.md` est l'**index de référence** — il liste
  tout, donc il **garde** une fiche terminale, mais **marquée 🗑️** et hors section « Livrées ».
  Ce n'est pas une « vue du travail » : montrer une terminale explicitement badgée n'induit
  personne en erreur. La règle vise les vues qui répondent « que faire ensuite ? ».
- **Mesurable :** une fiche `status: superseded` restée dans `features/` (hors `done/`)
  n'apparaît comme **à faire** dans **aucune** vue de travail (board, sections tirables /
  actionnable / en cours de portfolio) ; elle n'est jamais comptée dans les `actives` /
  `tirables`. Un test de parité casse si une vue redéclare la liste des terminaux.
- Origine : rétro PO du **2026-09-16** (migration A16, PR #240 — 5 fiches-chapeau passées
  `superseded` mais gardées dans `features/` ont **fui au board** : `buildAvancementData`
  filtrait `actives` sur le dossier `!f.done`, jamais sur le statut ; finding Codex P2).
  Vérifié le **2026-09-20** : le board (TS) est corrigé ; `portfolio.sh` filtre déjà par statut
  **positif** (une terminale n'y fuite pas) ; `regen-backlog.sh` la marque 🗑️ dans l'index
  (assumé). La règle **prévient la régression**. Enforcement niveau 1 : `ezk-reviewer`.
