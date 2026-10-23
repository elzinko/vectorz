---
id: "20261011153019643"
title: "Revue design-system : un step composable branché sur ezk-release"
type: feature
priority: P1
product: mega-city
milestone: qualite
version:
labels: [release, design-system, ux]
status: idea
pr:
evidence: none # capacité méthode, pas d'écran propre
created: 2026-10-11
---

# 20261011153019643 — Revue design-system : un step composable d'ezk-release

**En clair.** Avant de taguer une version, on veut vérifier que l'**UI livrée respecte le référentiel
de design du projet** — pour ne plus découvrir tard un rendu hors charte (le « verrou moche » de muti).
Cette revue est un **step qui se branche** sur le skill `ezk-release` (fiche sœur [[20260922175954296]]),
pas une passe mélangée dedans. Elle rend GO/NO-GO et nomme les écarts.

**Si tu arrives frais.** Le *référentiel design-system* d'un projet est un document qui dit à quoi
doit ressembler l'UI (couleurs, espacements, composants) — chez muti, `.rules/design-system.md`.
`ezk-release` est la passe qualité de fin d'itération qui bloque le tag tant que tout n'est pas GO ;
elle est conçue pour accepter des passes supplémentaires déclarées.

## Contexte / Problème

- Symptôme fondateur (muti, 2026-09-22) : des features fonctionnelles mais un rendu **hors design
  system** (le « verrou » moche), découvert tard, avec des retours PO **répétés** faute de contrôle
  avant release.
- `ezk-release` (v0.11) livre le squelette composable + la DoD mécanique + la chasse aux bugs, mais
  **pas** la revue design-system : le PO l'a sortie en step séparé (« pas forcément mélangé — j'aime
  la composition », 2026-10-11).

## Proposition

Un **step `design-system`** déclaré dans `ezk-release` : un agent lit le **référentiel du projet**
(chemin configuré, défaut `.rules/design-system.md`), compare l'UI de la version livrée au référentiel,
et rend **GO/NO-GO** en nommant les écarts bloquants. Référentiel absent → step sauté proprement.
Peut réutiliser l'agent `ezk-ux` prévu (jalon UX) ou un reviewer de référentiel dédié.

## Critères d'acceptation

- [ ] Le step `design-system` se **déclare** dans `ezk-release` sans réécrire le skill (preuve de la
      composition).
- [ ] Il lit le **référentiel du projet** (défaut `.rules/design-system.md`, chemin configurable).
- [ ] Il rend **GO/NO-GO** et **nomme les écarts** sur un lot portant un écart connu.
- [ ] Référentiel absent → step **sauté** proprement, sans bloquer le reste de `ezk-release`.

## Comment vérifier

```bash
# Sur un lot avec un écart design-system connu : NO-GO qui nomme l'écart.
ezk release v0.X.0        # avec le step design-system activé
# Sur un lot conforme : GO.
```

## Notes

- Sortie du grooming de la release-gate (fiche sœur [[20260922175954296]]) le 2026-10-11 : la revue
  design-system est un **step composable**, pas une passe interne. Sans version pour l'instant —
  à ranger dans un jalon UX (agent `ezk-ux`) quand le PO le décide.
- Réutilise le référentiel par projet né côté muti (`.rules/design-system.md`). Première preuve
  visée : muti (le « verrou moche »).
