---
id: 0181
title: Méthode ezk — Opus 4.8 par défaut + restitutions lisibles sur toutes les commandes
type: feature
priority: P0
product: mega-city
epic:
status: shipped
ready: 2026-08-03
pr: "#92"
created: 2026-08-03
---

# 0181 — Opus 4.8 + restitutions « En clair » pour toute la méthode ezk

## Contexte / Problème

Après le sprint 0176 et la clôture `/ezk-archive`, le PO constate deux frictions
récurrentes sur **toute** la méthode (pas seulement archive) :

1. **Modèle** — les sous-agents / skills ezk doivent cibler explicitement
   **Claude Opus 4.8** via le pin `claude-opus-4-8` (pas l'alias `opus`, qui peut
   dériver vers Opus 5). Secours : `model_spare: sonnet`. Skills orientés Claude
   Code ; Cursor = hôte de délégation (slug 4.8 / spare).
2. **Lisibilité** — les restitutions (archive, sprint checkpoints, backlog
   `next`/`review`, product-builder, etc.) restent souvent des dumps jargon
   (gate, REAL/ABSORBED, tableaux P1–P8). L'humain ne sait pas quoi faire en 3
   secondes. La règle `human-facing-lisibility` + le patch archive (#91) amorcent
   le chantier ; il faut le **généraliser**.

Amorce déjà livrée (PR #91) : ezk-archive (gabarit En clair, pin `claude-opus-4-8` +
`model_spare: sonnet` — amendé pour éviter dérive Opus 5). Cette fiche = le **reste
de la méthode**.

## Proposition

1. **Inventaire** des agents `products/mega-city/agents/ezk-*.md` et des skills
   qui délèguent / restituent à l'humain (`ezk-sprint`, `ezk-backlog`,
   `ezk-product-builder`, `ezk-pr-pilot`, `ezk-retro`, `ezk-pm`, reviewer,
   architect, qa, tdd, steward…).
2. **Modèle** — pour chaque agent de jugement / restitution PO :
   `model: claude-opus-4-8` (+ `model_spare: sonnet`) documenté dans le skill
   appelant (même contrat qu'ezk-archive). **Interdit** l'alias `opus` et Opus 5.
   Les agents purement mécaniques peuvent rester sonnet si le coût le justifie —
   **décision explicite** dans la fiche / ADR court.
3. **Lisibilité** — chaque skill qui parle à l'humain ouvre par **« En clair »**
   (≤ 3 phrases : fait / à faire / suite). Étendre le contrat de test
   `human-facing-lisibility-contract.test.ts` à ces skills (non-récidive).
4. **POC** : un lot prioritaire (sprint + backlog `next`/`review` +
   product-builder checkpoint) avant de balayer tout le catalogue.

## Critères d'acceptation

- [x] Inventaire agents/skills publié (tableau dans Notes ou ADR court).
- [x] Agents de jugement / restitution PO : `model: claude-opus-4-8` +
      `model_spare: sonnet` (sauf dérogation motivée sonnet-only).
- [x] Skills listés en POC ouvrent leurs restitutions par « En clair » et citent
      `human-facing-lisibility`.
- [x] Contrat vitest étendu : régression si on retire En clair / model_spare /
      le pin 4.8 sur les cibles POC.
- [x] Doc : mapping Cursor Task (`claude-opus-4-8` → slug
      `claude-opus-4-8-thinking-high` ; spare → sonnet ; Grok seulement sur
      demande humaine ; **jamais** Opus 5).
- [x] Gate locale verte (tests mega-city + scripts unicity concernés).

## Notes / décisions

- Amorce : PR #91 — archive (`ezk-archive` opus + spare + gabarit En clair).
- Inventaire + politique : `products/mega-city/docs/ezk-model-and-lisibility.md`
  — pin **`claude-opus-4-8`** (pas alias `opus` → risque Opus 5).
- Dérogation sonnet : `ezk-tdd`, `ezk-qa`, `ezk-steward` (mécanique / bas effort).
- PLAN : tête hygiène/NOW — tirée avant 0062.
- Hors scope : pin exact Opus 5 ; modèles par défaut de la session Cursor parente.
