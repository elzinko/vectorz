---
id: 0074
title: article — la loi de Pareto dynamique (rollout à curseur : mesurer d'abord, détailler sur preuve)
type: feature
priority: P3
status: idea
pr:
created: 2026-07-17
---

# 0074 — Article : la loi de Pareto dynamique

## Contexte / Problème

Améliorer un process « le plus vite possible » pousse à tout construire d'un coup.
L'alternative expérimentée (ADR-0016 §5) : un rollout en deux phases avec un
**curseur ajustable** — phase 1 = rituels + mesure minimale à ~zéro code (les
compteurs sortent des données déjà là), phase 2 = les détails (scoring, vélocité,
rendus) **seulement sur preuve d'usage**. Le « signal de s'arrêter » (ADR-0013 §4 :
l'envie d'enrichir EST le signal) complète le dispositif : le % du Pareto n'est pas
fixe, il se règle sur ce que la mesure de phase 1 révèle — d'où « Pareto dynamique ».

## Proposition

Article technique vulgarisé (via ezk-article, 0049) : formuler la loi de Pareto
dynamique comme patron systémique réutilisable (mesure d'abord, curseur, clause
d'arrêt), illustré par le cas backlog/scrum (ADR-0016) et le gate anti-méta-outillage
(ADR-0013). Généralisable au-delà du dev.

## Critères d'acceptation

- [ ] À groomer au tirage (DoR : angle, persona lecteur, plan) — cf. ezk-article (0049).

## Notes / décisions

- Capturée en `idea` sur demande opérateur (2026-07-17) ; priorité P3 (idée de fond,
  sans jalon). Candidate à la série REX (0059).
