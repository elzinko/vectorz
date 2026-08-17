---
id: "20260817113353676"
title: "Article « Templates de réponse adaptés aux LLM » (via ezk-article)"
type: feature
priority: P2
product: mega-city
epic:
depends: ["0191"]
labels: [article, lisibilite]
status: idea
ready:
pr:
created: 2026-08-17
---

# 20260817113353676 — Article « Templates de réponse adaptés aux LLM »

**En clair.** La fiche 0191 (livrée) a rendu la description de PR lisible pour un lecteur neuf
(onboarding dans la fiche, garde déterministe, lentille reviewer). Reste à en tirer un article
vulgarisé « Templates de réponse adaptés aux LLM » : structure ouverte, barre « nouveau venu »,
renfort au bon moment.

**Si tu arrives frais.** *ezk-article* = le skill qui écrit un article technique vulgarisé avec un
persona explicite + un panel de relecteurs frais comme gate de publication.

## Contexte / Problème

AC5 déportée de la fiche [[0191]]. L'article était le 5ᵉ critère, hors du MVP resserré construit
en sprint.

## Proposition

Écrire l'article via `ezk-article` (persona = dev / PM qui arrive sur un projet). Matière : 0191 +
ADR-0029 (la fiche est le document, la PR en est le rendu) + la lentille « nouveau venu »
(`docs/newcomer-readability-lens.md`).

## Critères d'acceptation

- [ ] article rédigé via `ezk-article`, persona dev/PM arrivant sur un projet
- [ ] relu par le panel de relecteurs frais (gate `ezk-article`) avant publication

## Comment vérifier

<à groomer : l'article existe et a passé le panel `ezk-article`.>

## Notes / décisions

- Fille de [[0191]] ; à groomer avant build.
