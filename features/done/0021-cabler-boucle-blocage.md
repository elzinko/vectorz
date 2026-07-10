---
id: 0021
title: câbler la boucle blocage (services existants) — l'escalade cesse d'être terminale
type: feature
priority: P1
status: shipped
pr: "#50"
created: 2026-07-06
---

# 0021 — câbler la boucle blocage (services existants)

## Contexte / Problème
Aujourd'hui l'escalade est terminale : le Supervisor tier 3 deny l'AskUserQuestion, la story
passe `blocked` dans sprint-status.yaml, et « la reprise » = relancer un run à la main.
Or toute la tuyauterie de résolution est **codée et testée mais jamais instanciée en
production** (audit 2026-07-06) : BlockageService (`.cop1/blocages/BLK-*.yaml`),
EscaladeService (routage par type), BlocageApiHandler (`GET /api/blocages`,
`POST /api/blocages/:id/resolve`), PMDecisionService, AsyncNotificationService,
DecisionHistoryService — zéro `new` hors tests, HttpServer ne route pas `/api/blocages`.
Couvre les FR41-44/FR11/FR31/FR43 du PRD.

## Proposition
1. Instancier et câbler dans le daemon (composition root) : escalade tier 3 → création d'un
   BLK-*.yaml + event STORY_BLOCKED (au lieu du seul flag terminal).
2. Router `/api/blocages` dans HttpServer + onglet mission-control (liste + resolve).
3. Le RÉSOLVEUR est pluggable : l'humain (matin, via l'UI) ou un agent décideur gouverné
   par mega-city (`ezk-pm`, fiche mega-city 0036) en client de l'API/EventBus — conforme à
   la frontière ADR-021/022 (pas de 4e port tant qu'une consultation synchrone n'est pas
   requise ; voir mega-city ADR-0011 §4).
4. Reprise : un blocage `resolved` avec `response` réinjecte la story au prochain run
   (comportement actuel : les `blocked` sont re-tentées — le formaliser).

## Critères d'acceptation
- [ ] une escalade superviseur crée un BLK-*.yaml visible via GET /api/blocages
- [ ] POST resolve avec une réponse débloque la story au run suivant (E2E sur cop1-cobaye)
- [ ] la mission-control affiche les blocages ouverts et permet de répondre
- [ ] zéro nouveau service : uniquement du câblage des classes existantes

## Notes / décisions
Analyse et inventaire du code mort : session mega-city du 2026-07-06. Lien : mega-city
ADR-0011 (le décideur est un agent du catalogue).
