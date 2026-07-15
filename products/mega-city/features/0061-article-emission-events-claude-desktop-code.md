---
id: 0061
title: article — émettre des events en restant fidèle au fonctionnement de Claude Desktop/Code
type: feature
priority: P1
status: todo
pr:
created: 2026-07-15
---

# 0061 — Article : émettre des events depuis Claude Desktop/Code

## Contexte / Problème

Session du 2026-07-15 : l'explication complète de la mécanique d'émission (hooks Claude
Code vs outils MCP, bloc `tool_use`, « qui tient le stylo » du journal JSONL) a demandé
plusieurs allers-retours et une série de diagrammes refaits pour être compréhensibles.
Le sujet est un bon candidat d'article de vulgarisation : **comment une méthode émet des
événements supervisables SANS sortir du fonctionnement natif de Claude Desktop/Code**
(pas de fork du client, pas de plugin exotique — juste MCP, un script, et des hooks en
renfort). Lignée éditoriale : l'article « contrat de supervisabilité » (cop1 0025, PR
cop1#57) couvre le *pourquoi* du contrat ; celui-ci couvrirait le *comment* du canal
d'émission. Personne n'a encore écrit ce mode d'emploi côté méthode.

## Proposition

Un article dans `docs/articles/` (vectorz), rédigé via `ezk-article` (0049) quand la
skill existe (sinon déroulé manuel : persona + panel de relecteurs frais) :

- **Rappeler le contexte** en ouverture pour un lecteur zéro-contexte : le contrat de
  supervisabilité v0.1, le kit émetteur (fiche 0050), le journal
  `.supervision/runs/<run_id>/events.jsonl` lu par un superviseur indépendant.
- **Le cœur : le choix de la communication des events.** Réutiliser les diagrammes de la
  session (à re-générer en triplets versionnés via `ezk-diagram`) :
  - le flux LLM → hôte (client MCP) → serveur MCP (le modèle n'ouvre jamais de socket) ;
  - les 5 outils du kit émetteur et « un appel = une ligne de journal » ;
  - « qui tient le stylo » : modèle en direct (non fiable) vs script d'append (Claude
    Code) vs serveur MCP (partout, Desktop inclus), classes de conformité A/B ;
- **Un diagramme d'ensemble du système** pour étayer : méthode (skill) → émetteur →
  journal → superviseur/moniteur (lecture seule, zéro couplage vivant).

## Critères d'acceptation

- [ ] L'article explique les deux canaux nominaux (script d'append sous Claude Code,
      serveur MCP sous Claude Desktop) et les hooks classe A en renfort, sans exiger de
      modification des hôtes.
- [ ] Le contexte (contrat v0.1, kit 0050) est rappelé en ouverture — lisible par un
      lecteur qui découvre le sujet.
- [ ] Les diagrammes « choix de la communication des events » sont versionnés via
      `ezk-diagram` (règles de lisibilité appliquées) et intégrés, plus le diagramme
      d'ensemble du système.
- [ ] La boucle qualité d'`ezk-article` (0049) est appliquée si la skill existe ; sinon,
      panel de relecture manuel avec contre-lecture finale.

## Notes / décisions

- Origine : session du 2026-07-15 (discussion hooks / MCP / JSONL, diagrammes refaits).
- Liens : 0049 (l'outil d'écriture), 0050 (le sujet), 0059 (série REX — cet article
  pourrait ensuite y être rattaché comme volet « canal d'émission » ; arbitré fiche
  indépendante à la création).
