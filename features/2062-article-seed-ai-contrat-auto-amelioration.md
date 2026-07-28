---
id: 2062
product: mega-city
title: article — « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère »
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0062 — article « Seed AI d'équipe : un contrat d'auto-amélioration auquel la méthode adhère »

## Contexte / Problème

Session vectorz du 2026-07-16 : idée d'un **contrat à part, dans la méthode**, auquel
elle adhère et qui permet d'auto-améliorer ses composants (agents, skills, règles),
orienté outcomes **métier** plutôt que conformité à un rituel. Un chantier de
conceptualisation multi-agents (audits vectorz + mega-city + état de l'art, 3 concepts
concurrents, panel de juges, panel adverse) est en cours côté vectorz ; il produira une
note de concept, un ADR proposé et des fiches backlog. L'article vulgarise ce paradigme
une fois architecturé — deuxième volet du diptyque avec vectorz 0043 (self-hosting).

## Proposition

Article technique vulgarisé (persona à briefer par le PO) présentant le paradigme : des
rétrospectives au double-loop learning, jusqu'au contrat formel sur le modèle du
« contrat de supervisabilité » (précédent maison : fiche 0050, kit émetteur — mega-city
première méthode conforme à un contrat). Écriture via `ezk-article` (0049) quand il
existera, sinon déroulé manuel (persona + panel de relecteurs frais).

## Critères d'acceptation

- [ ] N'écrire qu'APRÈS l'arbitrage PO sur la note de concept (ne pas vulgariser un
      concept non gravé).
- [ ] Brief persona/audience demandé au PO (pas de défaut silencieux).
- [ ] Panel 5 lentilles + contre-lecture finale à froid ; lentille fidélité adossée à la
      note de concept et à l'ADR sources.
- [ ] Emplacement de publication tranché par le PO (docs/ mega-city vs docs/articles/
      vectorz).

## Notes / décisions

- **Rapatriée** le 2026-07-16 : créée par erreur dans le repo mega-city standalone,
  gelé depuis ADR-027 B′ (commit 644b0f0) — le foyer vivant est ce subtree.

- Sujet jumeau : vectorz 0043. Dépend du chantier de conceptualisation seed AI
  (session vectorz 2026-07-16).
- Dépendance souple : 0049 (ezk-article) — non bloquant.
