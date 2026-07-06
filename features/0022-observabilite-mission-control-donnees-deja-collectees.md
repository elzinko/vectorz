---
id: 0022
title: mission-control — afficher ce qui est déjà collecté (heure, durée, agent, historique, $)
type: feature
priority: P2
status: todo
pr:
created: 2026-07-06
---

# 0022 — mission-control : afficher ce qui est déjà collecté

## Contexte / Problème
La wish-list d'observabilité (« ce qui a été lancé — agent/skill —, suivi des tâches, budget
tokens, à quelle heure, pendant combien de temps ») est un déficit d'AFFICHAGE, pas de
collecte (audit 2026-07-06) : timestamps sur chaque event SSE, startedAt/endedAt dans les
ExchangeRecords, sprint-log-*.jsonl, budget journalier YAML ventilé par agent et par
commande (TokenBudgetService) — rien n'est montré. Les onglets Projects/Agents/Tasks de la
web pointent sur des API inexistantes (404).

## Proposition
1. Vue run : heure de lancement, durée écoulée, agent/commande courante (les données SSE
   les portent déjà).
2. Historique des runs (sprint-log JSONL + .cop1/history/) : liste, durée, issue
   (completed/aborted/escalated), tokens.
3. Ventilation budget par agent/commande depuis le YAML journalier (+ conversion $ si
   maxUsdPerSession est configuré).
4. Réparer ou retirer les onglets 404 (Projects/Agents/Tasks) — pas de promesse morte dans
   l'UI.

## Critères d'acceptation
- [ ] un run affiche heure de départ, durée live, agent courant
- [ ] l'historique liste les N derniers runs avec issue et coût tokens
- [ ] la ventilation par agent est visible pour la journée courante
- [ ] plus aucun onglet ne pointe sur une API inexistante

## Notes / décisions
Aucune nouvelle collecte : uniquement lecture des fichiers/events existants.
