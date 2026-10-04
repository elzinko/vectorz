---
id: development/test-philosophy
kind: disposition
level: MUST
title: Testing Philosophy
---

- Fix bugs with a test that captures them (when realistic and stable)
- Maintain clear separation:
  - Unit tests (fast) for domain
  - Integration tests for adapters
  - E2E for critical paths
- DO NOT disable tests to "go faster" without reactivation plan
- SHOULD maintain a smoke test "it starts" (even minimal) to avoid CI round-trips
- **Un test de chaîne ne prouve pas un comportement** (ajout rétro samplerz du 2026-10-03). Pour
  un changement de comportement, un test qui cherche une chaîne dans le code source (un `.vue`, un
  `.js`) ne suffit pas : il casse sur une réécriture sans effet, et laisse passer un vrai bug qui
  garde la même chaîne. Il faut un test qui exécute le code ou affiche le composant. Tant que le
  projet ne sait pas le faire, la fiche déclare cette limite. `ezk-reviewer` le vérifie. Mesure :
  sur les 3 prochains sprints qui touchent une interface, 0 changement de comportement livré avec,
  pour seule garde, un test de chaîne non déclaré. Symptôme : samplerz, sprint 1 du 2026-10-03,
  deux tests de chaîne corrigés et un test qui compare une condition `v-if` mot pour mot.
