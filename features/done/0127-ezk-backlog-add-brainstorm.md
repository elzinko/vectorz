---
id: 0127
title: ezk-backlog add — proposer un brainstorm pour façonner une fiche vague
type: feature
priority: P2
product: mega-city
status: shipped
pr: local (via migration ezk-backlog #31, fiche 0024)
created: 2026-06-27
---

## Contexte / Problème
Aujourd'hui `/ezk-backlog add` est purement **mécanique** : il enregistre la description
telle quelle (id + fiche depuis le template + priorité demandée + regen + commit). Il ne
lance **aucun** brainstorm. Quand l'utilisateur ne sait pas exactement quoi ajouter, il
fait un brainstorm séparément (commandes `/product-management:*`) puis revient — l'`add`
n'intègre pas cette phase de cadrage.

## Proposition
Sur une description **vague** (ou via un flag `--brainstorm`), `add` **compose**
`/product-brainstorming` (et éventuellement `/architecture` si la fiche est structurante)
pour **façonner la fiche AVANT de l'enregistrer** : le résultat alimente Contexte /
Proposition / Critères. Même idiome que `ezk-ezk` (compose brainstorm → archi → fabrique),
appliqué au **backlog**. Reste **optionnel** : une description claire passe direct, sans
brainstorm imposé.

## Critères d'acceptation
- [ ] `add` détecte une description vague (ou `--brainstorm`) → propose de composer `/product-brainstorming`
- [ ] le résultat du brainstorm façonne le corps de la fiche avant enregistrement (avec validation utilisateur)
- [ ] description claire → `add` direct, **aucun** brainstorm imposé (garde-fou anti-friction)
- [ ] mécanique d'enregistrement inchangée (id, priorité demandée, regen, commit)

## Notes
- Le skill `ezk-backlog` vit encore dans `claude-skills` (gelé, ADR-0006) → l'implémentation
  se fait **après** migration d'ezk-backlog dans `mega-city/skills/` (même idiome que 0004 pour ezk-commits).
- Même famille qu'`ezk-ezk` (0021) : composer brainstorm/archi sans réinventer.
- Issu de la session 2026-06-27 (constat : `add` ne brainstorme pas, c'est l'agent qui cadre inline).
