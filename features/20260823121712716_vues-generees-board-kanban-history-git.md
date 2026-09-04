---
id: "20260823121712716"
title: "Vues générées — board kanban + historique des décisions relu depuis git (pas dans la fiche)"
type: feature
priority: P2
product: mega-city
status: idea
ready:
pr:
created: 2026-08-23
---

# Vues générées — un board kanban, et l'historique daté sans l'empiler dans la fiche

## En clair

On veut **voir** le backlog comme un tableau kanban (colonnes = statuts), et **retrouver** l'historique
daté des décisions (« quand cette fiche est-elle passée *Ready* / *Livré* ? »). Mais **sans stocker des
dates dans la fiche** (risqué, ça dérive). La solution : deux vues **générées** — le board depuis le
front-matter, l'historique **depuis git**.

## Contexte / Problème

- Pas de vue kanban : le `BACKLOG.md` est une table triée par priorité, pas un board par colonnes.
- L'historique des transitions (qui/quand une fiche a changé de statut) n'est pas consultable simplement.
  L'empiler dans la fiche complexifie le schéma **et** risque la dérive (échange PO 2026-08-23).

## Proposition

- **Board kanban** : une vue markdown **générée** depuis le front-matter, colonnes = statuts du schéma
  ([[20260823121712652]]), à côté de `BACKLOG.md`. Générée, jamais éditée (doctrine ADR-0001).
- **`history <id>`** : relit les transitions de statut **depuis git** — chaque tampon est déjà un commit
  daté (`docs(features): ready 0169`, `docs(features): ship …`). Sortie = **liste datée des décisions**.
  La date **sort de la fiche** ; git en est la source immuable.

> **Limite à trancher au grooming (retour Codex #164)** : le repo **squash-merge et supprime** les
> branches. Les transitions committées **sur une feature branch** (ex. *En cours*, *Revue*) sont donc
> **aplaties** par le squash → invisibles de `history <id>`. L'historique git ne capture fidèlement que
> les transitions **committées sur `main`** (typiquement `ready`/`ship`, faits par `ezk-backlog`).
> Options à arbitrer : (a) n'autoriser les transitions de statut que **sur `main`** (commits dédiés) ;
> (b) accepter que seules celles-là sont tracées ; (c) une source d'historique complémentaire.

## Critères d'acceptation (à groomer)

- [ ] Un **board kanban** markdown est généré depuis le front-matter (colonnes = schéma).
- [ ] `history <id>` liste les **transitions datées** relues depuis git (pas depuis la fiche).
- [ ] **Aucune** date de décision n'est stockée dans le front-matter des fiches.
- [ ] Les deux vues sont générées (jamais éditées à la main).

## Comment vérifier

Passer une fiche en *Ready* (un commit) → le board la déplace de colonne, et `history <id>` affiche la
date du tampon **sans** qu'elle figure dans la fiche.

## Notes / voisins

- Dépend de [[20260823121712652]] (le schéma définit les colonnes du board).
- Voisin : [[20260812100109940]] (synchroniser les vues de planning au `ship`) — même famille « vues
  générées qui ne mentent pas ».
- **Non ready** — à groomer (format du board, extraction git des transitions).
