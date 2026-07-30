---
id: 0043
title: article — « Self-hosting : le jour où cop1 développera cop1 » (dogfooding → self-hosting → RSI)
type: feature
priority: P2
product: vectorz
status: idea
pr:
created: 2026-07-16
---

# 0043 — article « Self-hosting : le jour où cop1 développera cop1 »

## Contexte / Problème

Session du 2026-07-16 : clarification des trois paradigmes qui jalonnent la trajectoire
du projet — **dogfooding** (le jalon README « unassisted dogfooding », à deux stubs près),
**self-hosting** (utiliser cop1 pour développer cop1, l'équivalent du compilateur qui se
compile — section ajoutée au README ce jour), et **auto-amélioration récursive** (seed AI)
comme horizon. Cette trajectoire est un sujet d'article de première main : le repo fournit
les artefacts réels (V1-light closé, stubs `commit_anchor`/`BMADCommandRunner`,
transcripts, rétros) pour raconter chaque marche.

Précédent éprouvé : les articles 0025 (« contrat de supervisabilité », PR cop1#57) et
0026 (« fenêtres de mise à jour »), publiés dans `docs/articles/` avec le déroulé
persona + panel de relecteurs frais.

## Proposition

Article technique vulgarisé (persona à briefer par le PO, cf. déroulé mega-city
fiche 0049) racontant la trajectoire dogfooding → self-hosting d'un orchestrateur
d'agents, adossé aux artefacts du repo. Écriture via le skill `ezk-article` quand il
existera (mega-city 0049, todo) ; sinon déroulé manuel qui a fait ses preuves sur 0025.

## Critères d'acceptation

- [ ] Brief persona/audience demandé au PO avant écriture (pas de défaut silencieux).
- [ ] Panel de relecture 5 lentilles + contre-lecture finale à froid (cf. mega-city 0049).
- [ ] Fidélité aux faits du repo (jalons, dates, stubs) — lentille fidélité obligatoire.
- [ ] Publié dans `docs/articles/` selon la convention des articles 0025/0026.

## Notes / décisions

- Sujet jumeau : products/mega-city 0062 (article seed AI / contrat d'auto-amélioration) —
  diptyque possible.
- Dépendance souple : mega-city 0049 (skill ezk-article) — non bloquant.
- Origine : session 2026-07-16 (« un jour sera-t-il possible d'utiliser vectorz pour
  continuer à développer vectorz ? »).
