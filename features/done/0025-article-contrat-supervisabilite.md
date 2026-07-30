---
id: 0025
title: Article « contrat de supervisabilité » — lecture de première main + article publié dans la doc
type: feature
priority: P2
product: vectorz
status: shipped
pr: "#57"
created: 2026-07-13
---

# 0025 — Article « contrat de supervisabilité »

## Contexte / Problème

Le balayage prior-art du 2026-07-13
([docs/captures/2026-07-13-prior-art-contrat-supervisabilite.md](../../docs/captures/2026-07-13-prior-art-contrat-supervisabilite.md))
conclut que le contrat complet (gates déclarés par la méthode, stop-par-défaut vérifiable,
escalade à deux étages, schéma versionné, adoption de version aux gates) **n'existe nulle part**,
et que le créneau d'article est **libre mais se referme** (Rel(AI)Build et Faramesh tournent
autour depuis début 2026). L'angle défendable : *« les control planes gardent les actions ;
personne ne garde les méthodes »*. mega-city = première implémentation de référence, cop1 =
premier superviseur — le format « spec + reference implementation » qui crédibilise un article.

⚠️ Les références du balayage viennent de recherches web agentiques : rien ne se publie sans
lecture de première main.

## Proposition

Trois phases, la 3e optionnelle :

1. **Recherche préalable (première main).** Lire et ficher les 4 sources les plus proches —
   Rel(AI)Build (arXiv 2606.26924), Agent Protocol (LangChain, spec CDDL), A2A v1.0
   (Linux Foundation), Faramesh (arXiv 2601.17744) — + contrôler les 2 affirmations tierces
   (Forrester mars 2026 « cross-plane governance schemas » ; survey arXiv 2504.16736 sans
   catégorie superviseur↔méthode). Sortie : notes de lecture avec citations exactes vérifiées,
   corrections éventuelles du doc prior-art.
2. **Article dans la doc du projet** (`docs/articles/`) — la « première base publiée » :
   un markdown autonome (lisible sans le repo) qui expose et documente le sujet, étaye le
   positionnement produit, et sert de source citable aux ADRs. **Forme : raconter une
   histoire** — ouvrir par le récit de comment la problématique est apparue (des runs cop1 la
   nuit, mega-city qui évolue en journée, « que fait-on d'un process en cours quand la méthode
   change ? », deux sessions qui se marchent dessus…) et vulgariser avant de formaliser : c'est
   ce qui fait adhérer. Contenu attendu ensuite : le problème (garder les méthodes, pas les
   actions), les 5 clauses (a)-(e), le squelette v0 du contrat (repris/raffiné du prior-art §5),
   le positionnement vs les 5 voisins, la lignée intellectuelle (CNP → FIPA → institutions
   électroniques → BPM → Temporal → A2A), **un glossaire** qui nomme — et assume d'inventer/
   proposer — les termes nouveaux (contrat de supervisabilité, siège d'autorité, escalade
   régalienne vs métier, adoption aux gates…), et une section **« pour aller plus loin »**
   (les 4 sources + voisins, pour qui veut pousser la réflexion). Relecture éditoriale
   (bmad-editorial-review) avant merge.
3. **Publication externe : explicitement différée** — « on verra plus tard ». Envisageable à la
   fin, si le projet tourne (ou presque) et que l'article est mûr ; le contrat devra avoir été
   éprouvé par au moins un run réel (mega-city → cop1).

## Critères d'acceptation

- [ ] Notes de lecture de première main des 4 sources, avec citations vérifiées (URL + passage),
      et diff appliqué au doc prior-art si une affirmation du balayage était fausse.
- [ ] `docs/articles/<slug>.md` : article autonome, **ouvert par un récit** (genèse de la
      problématique, vulgarisée), positionnement vs ≥5 voisins, squelette v0 du contrat inclus,
      nom du contrat tranché (candidat : « contrat de supervisabilité » / Supervisability
      Contract).
- [ ] Glossaire des termes (existants + proposés) et section « pour aller plus loin » avec les
      sources de première main.
- [ ] L'article ne contredit ni ADR-021 ni la capture 2026-07-13 (ou les fait réviser explicitement).
- [ ] Relecture éditoriale passée (structure + prose).
- [ ] Gate locale verte (lint markdown si outillé ; pas de code).

## Notes / décisions

- Dépend des 2 captures du 2026-07-13 (décisions D1–D7 + prior-art). Indépendant du code cop1.
- Priorité P2 car la fenêtre se referme (concurrents conceptuels publiés janv./juin 2026) —
  mais à groomer : le scope exact de la phase 2 (longueur, audience FR/EN) reste à cadrer.
- L'article est aussi l'antichambre de l'ADR « contrat de supervisabilité » (capture §6.1) :
  même matière, deux artefacts (l'ADR décide pour le repo, l'article expose pour l'extérieur).
