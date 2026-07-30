---
id: 0110
title: remote + licence (backup + base OSS)
type: chore
priority: P2
product: mega-city
status: shipped
pr:
created: 2026-06-26
---

> ⚠️ **Clôturée le 2026-07-17 (review) — prémisse caduque.** Déplacée dans `done/`. Le volet
> **remote** visait `github.com/elzinko/mega-city` (repo standalone) : il est désormais
> **archivé**, mega-city vivant comme sous-projet de l'**umbrella vectorz** (ADR-027) — le
> versioning/tags attendu passe par le remote vectorz, pas par un remote mega-city propre. Le
> volet **licence** (MIT au moment de l'OSS) survit mais **remonte au niveau vectorz** : ce
> n'est plus une décision mega-city. Ouvrir une fiche `LICENSE` au **backlog racine** le jour
> où l'OSS est décidé.

## Contexte / Problème
Pas de backup aujourd'hui (repo local). Pré-requis pour l'OSS plus tard.

## Proposition
Pousser `mega-city` sur un remote privé + ajouter une licence (MIT au moment de l'OSS).

## Critères d'acceptation
- [x] remote configuré, historique poussé — **fait 2026-07-04** : `github.com/elzinko/mega-city` (privé), `origin/main`, auto-delete-branch-on-merge activé.
- [ ] licence décidée (privé d'abord → LICENSE en attente ; MIT au moment de l'OSS)

## Notes
Moitié « remote » livrée ; reste la licence. Le remote débloque le **versioning/tags** attendu par
le modèle de synchro cop1 ↔ mega-city (cf. cop1 ADR-021 § Synchronisation).
