---
id: 0049
product: vectorz
title: article — « Brancher une méthode qu'on ne possède pas : le pattern sidecar » (ADR-032, cas BMAD)
type: feature
priority: P3
status: idea
pr:
created: 2026-07-17
---

# 0049 — article « Brancher une méthode qu'on ne possède pas : le pattern sidecar »

## Contexte / Problème

L'ADR-032 a été gravé le 2026-07-17 sous forme de guide
(`docs/brancher-une-methode-existante.md`) : comment une méthode existante (dont on ne
contrôle pas les sources — cas d'étude : BMAD) devient supervisable **sans réécriture**, via
un **sidecar-installateur** qui injecte les consignes d'émission dans les prises natives de
la méthode. La matière première-main est riche : le guide, l'ADR, le contrat gelé, et surtout
le **récit du panel adverse** (capture `2026-07-16-panel-adverse-adr-032.md`) — la première
version de l'ADR promouvait l'observateur externe et a été **réfutée sur pièces** avant gravure.

Angle éditorial candidat (fort) : *« notre première architecture était fausse — et c'est le
processus qui l'a attrapée avant qu'on la grave »* : observateur vs installateur, la moitié
fail-safe qu'une observation ne peut pas porter, et le sidecar comme réconciliation.

## Proposition

Article technique vulgarisé (persona à briefer par le PO, cf. déroulé mega-city fiche 0049
`ezk-article`) ; publication `docs/articles/` selon la convention 0025/0026. Idéalement écrit
**après la première implémentation réelle** (0058) pour y intégrer le REX.

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`) — reprendre le déroulé persona + panel
      de relecteurs frais + lentille fidélité (sources : guide, ADR-032, capture panel).

## Notes / décisions

- **P3, non prioritaire** (PO, 2026-07-17). S'ajoute au cycle d'articles : 0043 (self-hosting),
  subtree 0062 (seed AI), 0047 (migration réflexive) — et à la série REX subtree 0059.
- Dépendance souple : le skill `ezk-article` (mega-city 0049) — non bloquant. De préférence
  après 0058 (le REX nourrit l'article).
- L'id vectorz 0048 n'est pas réutilisé (brûlé par la fusion du spike 0048 → subtree 0058).
- Origine : session 2026-07-17 (gravure ADR-032 en guide).
