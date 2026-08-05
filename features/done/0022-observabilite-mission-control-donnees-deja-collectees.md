---
id: 0022
title: mission-control — afficher ce qui est déjà collecté (heure, durée, agent, historique, $)
type: feature
priority: P2
product: vectorz
status: shipped
ready: 2026-08-05
pr: "#105"
created: 2026-07-06
---

# 0022 — mission-control : afficher ce qui est déjà collecté

## Contexte / Problème
La wish-list d'observabilité (« ce qui a été lancé — agent/skill —, suivi des tâches, budget
tokens, à quelle heure, pendant combien de temps ») est un déficit d'AFFICHAGE, pas de
collecte (audit 2026-07-06) : timestamps sur chaque event SSE, startedAt/endedAt dans les
ExchangeRecords, sprint-log-*.jsonl — rien n'est montré. (La mention initiale d'un
« budget journalier YAML ventilé (TokenBudgetService) » était fausse : jamais écrit en
prod, service supprimé par la fiche 0036.) Les onglets Projects/Agents/Tasks de la
web pointent sur des API inexistantes (404).

## Proposition
1. Vue run : heure de lancement, durée écoulée, agent/commande courante (les données SSE
   les portent déjà).
2. Historique des runs (sprint-log JSONL + .cop1/history/) : liste, durée, issue
   (completed/aborted/escalated), tokens.
3. ~~Ventilation budget par agent/commande depuis le YAML journalier.~~ **Rescopé
   (fiche 0036, 2026-07-15)** : le YAML journalier n'était jamais écrit en prod
   (`TokenBudgetService` dormant, supprimé — ADR-017). La ventilation par agent est de
   la **re-collecte**, pas de l'affichage → hors périmètre de cette fiche ; afficher à la
   place les tokens par run depuis les données réellement collectées (SSE/sprint-log),
   + conversion $ si maxUsdPerSession est configuré.
4. ~~Réparer ou retirer les onglets 404 (Projects/Agents/Tasks) — pas de promesse morte dans
   l'UI.~~ **FAIT** — onglets retirés (`web/src/App.tsx` référence cette fiche ; constat
   panel 0034, 2026-07-15).

## Critères d'acceptation
- [x] un run affiche heure de départ, durée live, agent courant
- [x] l'historique liste les N derniers runs avec issue et coût tokens
- [x] les tokens par run (et $ si configuré) sont visibles depuis les données déjà collectées
- [x] plus aucun onglet ne pointe sur une API inexistante (onglets retirés — `App.tsx`)

## Notes / décisions
Aucune nouvelle collecte : uniquement lecture des fichiers/events existants.
