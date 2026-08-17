---
id: "20260817113353538"
title: "Étude prior-art BMAD (templates + elicitation) — ce qui se transpose à une méthode LLM-native"
type: chore
priority: P2
product: mega-city
epic:
depends: ["0191"]
labels: [bmad, lisibilite, doc]
status: idea
ready:
pr:
created: 2026-08-17
---

# 20260817113353538 — Étude prior-art BMAD (templates + elicitation)

**En clair.** BMAD structure ses réponses via un système de templates + « elicitation ». La fiche
0191 (livrée) a porté l'onboarding « nouveau venu » dans le template de fiche ; reste à instruire ce
que ce système apporterait **en plus** à une méthode LLM-native — et ce qui **ne se transpose pas**.
Sortie attendue : une note courte « transposable / non-transposable ».

**Si tu arrives frais.** *BMAD* = une méthode agile-agent packagée (templates + workflows) qu'on
étudie ici comme prior-art ; *méthode LLM-native* = la méthode ezk (skills + règles) pilotée par un LLM.

## Contexte / Problème

AC4 déportée de la fiche [[0191]] (« Lisibilité qui tient »). 0191 a livré son MVP resserré
(onboarding dans la fiche + garde déterministe + lentille reviewer). L'étude prior-art BMAD était le
4ᵉ critère, hors du MVP — mais reste utile pour cadrer les prochaines briques de lisibilité.

## Proposition

Lire le système de templates + elicitation de BMAD ; produire une note courte : ce qui se transpose à
la méthode ezk (LLM-native), ce qui ne se transpose pas, et pourquoi. Réf. [[0049]] (article sidecar),
[[0162]] (2ᵉ méthode émettrice).

## Critères d'acceptation

- [ ] note « transposable / non-transposable » du système de templates BMAD vers une méthode LLM-native
- [ ] au moins un exemple concret retenu (ou explicitement écarté) pour la méthode ezk

## Comment vérifier

<à groomer : la note existe dans `docs/` et cite ses sources BMAD.>

## Notes / décisions

- Fille de [[0191]] ; à groomer avant build.
