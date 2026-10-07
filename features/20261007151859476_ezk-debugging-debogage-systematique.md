---
id: "20261007151859476"
title: "ezk-debugging — skill de débogage systématique (4 phases)"
type: feature
priority: P2
product: vectorz
milestone:
version:
labels: [outillage, debug]
status: idea
pr:
evidence: none
created: 2026-10-07
---

# 20261007151859476 — ezk-debugging : débogage systématique

**En clair.** vectorz n'a **pas** de skill de débogage. On en ajoute un : une **méthode systématique
en 4 phases** (reproduire, isoler, cause racine, vérifier), pas une vague consigne « débogue mieux ».
Quand un bug résiste, l'agent suit une procédure au lieu de bricoler.

**Si tu arrives frais.** Dans la carte de la méthode (ADR-0020), un skill « technique » appartient à
la bande **Outillage** : il ne connaît pas le sprint, donc il est réutilisable partout. Prior art :
**Superpowers** et sa skill `systematic-debugging`.

## Contexte / Problème

Quand un bug résiste, l'agent tâtonne sans méthode : il change des choses au hasard, perd du temps,
et parfois « corrige » un symptôme sans trouver la cause. Une **procédure nommée** structure la
recherche et rend le résultat vérifiable.

## Proposition

POC d'abord : la procédure + un cas réel déroulé.

1. Skill **`ezk-debugging`**, bande Outillage (ADR-0020), composable hors sprint.
2. **Quatre phases** : (a) reproduire de façon fiable ; (b) isoler (réduire au plus petit cas) ;
   (c) trouver la **cause racine** (pas le symptôme) ; (d) vérifier que le correctif tient (test).
3. Compose l'existant quand utile : `ezk-bug` (intake/repro), Playwright pour un bug d'écran.

## Critères d'acceptation

- [ ] Le skill porte une **procédure en 4 phases** (reproduire / isoler / cause racine / vérifier), pas une étiquette.
- [ ] Il se place dans la bande **Outillage** (ADR-0020), composable hors sprint.
- [ ] Un **cas réel** déroulé de bout en bout le valide (symptôme → cause racine → correctif testé).

## Comment vérifier

```bash
# Le skill existe et déclare sa bande + ses 4 phases.
ls products/mega-city/skills/ezk-debugging/SKILL.md
grep -nE "reproduire|isoler|cause racine|vérifier" products/mega-city/skills/ezk-debugging/SKILL.md
```

## Notes / décisions

- **Origine** : session de brainstorm du 2026-10-07 (comparaison avec Superpowers).
- **Prior art** : Superpowers `systematic-debugging` (analyse de cause racine en phases).
- **Garde-fou** : une vraie procédure, pas un label. La valeur est dans la méthode nommée.
- **Nommage** : `ezk-debugging` (bande Outillage, ADR-0020). Hors du thème portabilité — planifiable seul.
