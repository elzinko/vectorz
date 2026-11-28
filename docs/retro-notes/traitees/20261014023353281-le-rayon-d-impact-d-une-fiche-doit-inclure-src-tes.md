---
date: 2026-10-14
session: "fix/v014-bughunt-findings / solar-car-charging-feasibility-cd67a1"
type: friction
---

# le rayon d'impact d'une fiche doit inclure src/__tests__

Run v0.14 : le grep des lecteurs de SPRINT.md (fiche 1) et de --cleanup (fiche 6) était limité à skills/ + bin/, et a manqué les tests TS de src/__tests__/. Résultat : plan-lot-bin.test.ts (fiche 1) et ezk-archive-light-contract.test.ts (fiche 6) cassés, rattrapés seulement par `pnpm test`. Geste : grepper AUSSI src/__tests__/ et lancer `pnpm test` quand on touche un fichier lu par du TS.
