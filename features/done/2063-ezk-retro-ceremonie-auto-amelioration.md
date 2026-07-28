---
id: 2063
product: mega-city
title: ezk-retro — cérémonie d'auto-amélioration de la méthode (round-robin d'agents → règles mesurables → juge de cohérence → DoD/rules)
type: feature
priority: P2
status: shipped
pr: "#21"
created: 2026-07-16
---

# 0063 — ezk-retro — cérémonie d'auto-amélioration de la méthode

## Contexte / Problème

Deux sujets distincts se cachaient derrière « l'auto-amélioration » (session 2026-07-16,
carte : `docs/captures/2026-07-16-carte-auto-amelioration.md` côté vectorz) :

- **Sujet A — on améliore la méthode** : *l'humain déclenche*. On lance une rétro quand on
  veut, les agents proposent, le PO garde la main. **C'est cette fiche.**
- **Sujet B — la méthode s'auto-améliore** : *un chiffre déclenche*. Le contrat
  d'améliorabilité mesuré (ADR-030 proposé, fiches vectorz 0044/0045/0046, subtree 0061).
  Plus ambitieux, plus tard.

Les deux partagent la même « plomberie » en aval (juge de cohérence + rangement des règles
dans mega-city + contrôle PO) — cette fiche livre le Sujet A, le plus simple, et pose la
plomberie que le Sujet B réutilisera.

Le besoin vient de trois douleurs vécues : les leçons ré-expliquées à chaque session, les
propositions de rétro qui meurent en markdown, l'absence d'un lieu où une règle « née d'un
symptôme » atterrit proprement sans casser la cohérence de l'ensemble.

**Le métier est déjà là — presque tout est codé ET testé** (inventaire fichier par fichier,
2026-07-16). Ton modèle existe en pièces détachées côté cop1, jamais assemblées ni câblées :

- **Round-robin 2 tours → consensus** : ✅ `RoundTableEngine` (`products/cop1/packages/ceremony-engine/…/round-table`),
  `maxRounds=2`, testé « 2 tours × 3 agents ». (Ordre déterministe, pas aléatoire.)
- **Cérémonie de rétro qui pond des propositions** : 🟠 `RetroCeremony`
  (`…/ceremony-engine/…/retrospective`) — codée, exige ≥1 proposition, MAIS **orpheline**
  (`grep 'new RetroCeremony(' = vide`, jamais câblée dans l'orchestrateur).
- **Règle mesurable liée à un symptôme** : ✅ `AutoRuleSuggestionService`
  (`…/sprint-core/…/auto-rule-suggestion`) — `blocageRate>0.3`→règle, `coverage<80`→règle,
  `dodRejectionRate>0.2`→`strengthen-dor-validation`, avec `reason` chiffré ; `improvementScore`.
- **Juge de cohérence** : 🔴 **spécifié, pas codé** — fiche [0008 chief-judge](../0008-chief-judge.md)
  (todo) + couche « Juge » de [0034](../0034-garde-fous-integrite-agents.md) ; au runtime,
  `RuleApplicationService.checkDuplicate` ne détecte que les **doublons**, pas les contradictions.
- **DoD/DoR + stockage des règles** : ✅ `DoDCheck` (ADR-020), règles en `rules/`/`bundles/`
  (53 migrées, fiche done/0006).

Il ne manque donc pas la machinerie — il manque **3 soudures** : (1) un déclencheur « rétro à
la demande » rebranchant la cérémonie orpheline, (2) le juge de cohérence, (3) le pont
proposition → `rules/` mega-city (le retour de règle écrit encore côté cop1 `iamthelaw/*.yaml`).

## Proposition

Un skill `ezk-retro` (nom candidat) — orchestrateur MINCE, il **assemble les 3 soudures**
manquantes autour de la machinerie qui existe déjà :

- **Déclenchement à la demande** (`/ezk-retro`) [soudure 1], sur un périmètre au choix : une
  PR, un sprint, une friction ponctuelle, ou « la méthode en général ». C'est le déclencheur
  qui rebranche la cérémonie orpheline (`RetroCeremony`).
- **Cérémonie en round-robin** : réutilise le `RoundTableEngine` existant (**2 tours**,
  seuil de consensus) avec les bons agents (`ezk-architect`, `ezk-qa`, `ezk-reviewer`,
  `ezk-tdd`, `ezk-pm`…) — tour 1 : chacun observe et propose ; tour 2 : chacun réagit →
  **consensus**. *Option : tirer l'ordre au sort pour couper l'effet d'ancrage (petit ajout,
  l'ordre est déterministe aujourd'hui).*
- **Sortie typée** : chaque proposition est **rattachée à un symptôme** et **porte un critère
  mesurable**, et tombe dans l'une des catégories : `action` · `feature`/fiche backlog ·
  `spike` · **`règle`** (lint, principe d'archi, item de DoD/DoR, outil de contrôle,
  convention de communication). Pas de symptôme ou pas de mesure → pas de règle.
- **Passage au juge de cohérence** (compose la fiche 0008 / `ezk-steward`) : « cette règle
  contredit-elle une règle existante ? doublon ? » — avis, le PO trancherait.
- **Rangement sous contrôle PO** : les propositions non-règles partent au backlog
  (`ezk-backlog`) ; les **règles validées** atterrissent dans `rules/`, un `bundle`, ou le
  DoD/DoR. **Le PO garde la main sur la liste** : il valide, peut imposer une règle
  directement, et **peut en retirer** (une règle est réversible — c'est le pendant de
  « construire → prouver → retirer »).

## Critères d'acceptation

- [ ] `/ezk-retro` lance une cérémonie round-robin 2 tours avec un sous-ensemble d'agents
      choisi selon le périmètre, et produit des propositions typées.
- [ ] Chaque proposition de type `règle` porte un **symptôme** ET un **critère mesurable** ;
      le skill refuse d'en ranger une qui n'a pas les deux.
- [ ] Les règles candidates passent par un **avis de cohérence** (fiche 0008 / ezk-steward)
      avant rangement ; l'avis est consultatif, le PO tranche.
- [ ] Le rangement respecte la structure existante (`rules/<cat>/`, `bundles/`, DoD) — pas
      de nouveau silo — et est **réversible** (retrait documenté).
- [ ] Doc du skill : quand l'utiliser (rétro de méthode, post-mortem d'une friction), quand
      ne pas l'utiliser (le Sujet B mesuré = ADR-030, pas ça).

## Notes / décisions

- **Sujet A de l'auto-amélioration** ; jumeau mesuré = **Sujet B** (ADR-030). Les deux
  partagent le juge de cohérence et le rangement des règles → cette fiche pose la plomberie.
- **Contrôle PO explicite pour l'instant** (2026-07-16) : aucune auto-application ; le
  versionnage des règles est différé (« on verra plus tard »).
- Compose : [0008 chief-judge](../0008-chief-judge.md), `ezk-steward`, `rules/`, `bundles/`,
  `ezk-backlog`. Voisin de 0034 (garde-fous intégrité agents) et 0028 (modèle typé
  interaction/autorité).
- **Groomé `idea → todo` le 2026-07-16** (premier self-host : la méthode affûte son propre
  backlog). Décisions de grooming :
  - **Périmètre MVP** = les **3 soudures** uniquement (déclencheur « rétro à la demande » +
    avis de cohérence + pont proposition → `rules/`). L'option « ordre tiré au sort » est
    **différée** (petit ajout post-MVP).
  - **Skill générique round-robin ?** **Non au départ** (YAGNI) : la cérémonie est intégrée à
    `ezk-retro` ; extraction en skill réutilisable seulement si un 2ᵉ consommateur apparaît
    (règle de 3).
  - **Machinerie cop1 existante** (`RoundTableEngine`, `RetroCeremony`,
    `AutoRuleSuggestionService`) = **référence d'algorithme** à ré-encoder en orchestration de
    skills markdown, **pas** du code à réutiliser tel quel (E4 le retire).
  - **Nom** : `ezk-retro` par défaut (renommage trivial) — micro-décision PO au démarrage du sprint.
- **Prêt pour sprint (DoR)** : contexte clair, portée MVP fixée, critères d'acceptation
  observables, compose des briques identifiées (0008, `ezk-steward`, `rules/`, `ezk-backlog`).
