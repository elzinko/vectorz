---
id: 0173
title: Méthode ezk — 3 bandes + naming (ezk-pr, caps, archive=capacité)
type: feature
priority: P1
product: mega-city
status: in-progress
ready: 2026-07-30
pr: "#72"
created: 2026-07-30
---

# 0173 — Méthode ezk : 3 bandes + naming

## Contexte / Problème

Confusion récurrente entre **`ezk-backlog`** (pile de fiches) et
**`ezk-pr-pilot`** (stock de PRs) ; `-pilot` bruyant ; `ezk-archive` dessinés
comme orchestrateur alors que c'est une **hygiène de clôture** ; capacités
(`testbed` / sandbox) confondues avec les rôles.

## Proposition

1. **Doctrine** — ADR-0022 (3 bandes, backlog≠pr, archive=capacité, naming).
2. **Diagramme** — `products/mega-city/diagrams/ezk-methode-globale/` (v3).
3. **`ezk-ezk`** — section « Carte de la méthode » pour guider la fabrique.
4. **Notes soft** sur `ezk-pr-pilot` / `ezk-archive` / `ezk-backlog` (alias,
   bande) — rename mécanique code/tests/profils = **suivi** (hors de cette PR
   si trop large).

## Critères d'acceptation

- [ ] ADR-0022 proposé + lié depuis le diagramme et `ezk-ezk`.
- [ ] Diagramme : orchestrateurs = product-builder → sprint → pr ; **archive**
      sous Capacités.
- [ ] Tableau backlog vs pr documenté (objet / question / intersection).
- [ ] Pref. names : `ezk-pr`, `ezk-caps-*`, `ezk-sandbox` ; Validation →
      `backlog init` (intention ; migration mécanique OK en suivi).
- [ ] Après merge : rappeler de **mettre à jour les skills locaux**
      (`bind` / `/reload-skills`).

## Notes / décisions

- ADR-0020 avait rejeté le rename cosmétique `pr-pilot`→`pr` *dans le contexte
  d'y loger testbed* ; ici on **souhaite** le rename pour clarté, sans y coller
  de capacité captive.
- IDs 0168–0172 réservés par une autre branche (orphan-run) → cette fiche = **0173**.
