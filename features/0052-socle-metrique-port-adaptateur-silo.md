---
id: 0052
product: vectorz
title: Socle vertical — port de métrique + 1er adaptateur (couverture) + remontée build PR + silo
type: feature
priority: P1
epic: 0051
status: todo
ready:
pr:
created: 2026-07-22
---

# 0052 — Socle vertical qualité (MVP end-to-end)

## Contexte / Problème

L'épic [0051](0051-observabilite-qualite-produit.md) tient sur une hypothèse à prouver le
moins cher possible : **capter → garder → lire** une métrique de qualité **réelle**, sur une
**vraie PR**, sans toucher au relicat `@cop1/quality-intelligence` (portes jetables, promis à
résorption) ni au coût tokens (hors sujet ici). Tant que cette tranche verticale n'existe pas,
tout le reste est du papier.

## Proposition

Tranche mince de bout en bout :

1. **`MetricPort`** — port **abstrait, language/outil-agnostic** : « donne-moi la valeur de la
   métrique M pour ce commit/PR ». Testé d'abord avec un **adaptateur stub**.
2. **1ᵉʳ adaptateur réel : couverture, en LOCAL** — lit le **`lcov.info` produit par le
   test-runner du projet** (vitest) au build : format standard, **zéro compte, zéro secret**
   (doctrine local-first, PO 2026-07-24). Codecov (variante SaaS) part au catalogue
   [0054](0054-catalogue-adaptateurs-outils.md).
3. **Remontée au build de PR — writer = tiers** — la méthode **exécute l'outil** en CI et produit
   un **artefact déterministe** (`lcov` / `cobertura`) ; un **mesureur tiers** le **lit** et **appende**
   `quality.measured { metric, value, tool, commit, pr, ts, schema_version }` derrière une
   **interface d'écriture `MetricSink`** (unique porte d'écriture) — dans un **cahier frère
   `.quality/`** (Q2 tranché, ADR-033 : Option B), **isolé du silo 0044** ; **miroir tamper-évident
   hors POC**. *La méthode auditée n'écrit jamais son propre chiffre.*
4. **Lire 1 KPI** — la couverture de la PR, relue depuis le journal.
5. **Afficher (minimal)** — la valeur relue est postée en **commentaire de la PR** (une ligne,
   ex. « couverture : 78 % »), par le **mesureur tiers**, avec le token CI standard — zéro compte
   (tranché PO 2026-07-24 ; le rapport riche reste la fiche
   [0058](0058-rapport-qualite-pr.md)).

## Critères d'acceptation

- [ ] `MetricPort` défini et testé avec un adaptateur **stub** (indépendance à l'outil prouvée)
- [ ] Un **adaptateur couverture réel** produit un chiffre — prouvé **sur une CI réelle** (hook
      GitHub Actions, artefact `lcov` réel produit par le build), **sans secret ni compte
      externe**, pas seulement sur fixture locale
- [ ] `quality.measured` est **écrit par le mesureur tiers** derrière l'interface **`MetricSink`**
      (dans le **cahier frère `.quality/`**, isolé du silo 0044), **indexé commit + PR**, append-only
- [ ] `quality.measured` porte une **version de schéma** (`schema_version`) — condition Q2 (ADR-033)
- [ ] **`MetricSink` est l'unique porte d'écriture** — test « aucune écriture hors du sink »
- [ ] **1 KPI** (couverture de la PR) est **relu** depuis le journal
- [ ] La valeur relue est postée en **commentaire de la PR** (une ligne), par le **mesureur tiers** —
      le gate ne lit **jamais** ce commentaire ; **zéro compte externe**
- [ ] Le relicat `@cop1/quality-intelligence` **n'est pas touché**
- [ ] Gate locale verte (typecheck/lint/tests)

## Notes / décisions

- **Destination = cahier frère `.quality/`** (Q2 tranché le 2026-07-22,
  [ADR-033](../docs/adr/ADR-033-port-metrique-qualite-produit.md) Option B), écrit derrière
  `MetricSink`. Le **writer append (+ futur miroir) est pensé réutilisable/partagé avec 0044**
  (« deux cahiers, un seul stylo »), pas spécifique à `.quality/`. **Miroir tamper-évident : hors
  POC.** Convergence future vers un silo unifié (Option A) laissée ouverte.
- **Local-first (PO 2026-07-24)** : 1ᵉʳ adaptateur = lecture locale du `lcov` (zéro compte).
  **Codecov → 0054** (1ᵉʳ adaptateur SaaS). **Risque n°1 à trancher au grooming** : comment le
  mesureur tiers **écrit `.quality/` depuis la CI** (commit sur la branche ? artefact de workflow ?
  droits du token par défaut ?) — même famille de question que le spike mega-city 0083.
- Remontée **minimale** ici (un chemin PUSH qui marche) ; la remontée **générique multi-outils**
  et l'ajout d'autres outils = [0054](0054-catalogue-adaptateurs-outils.md).
- **Tête buildable de l'épic** — à groomer puis `ready` en premier.
