---
id: agent-ops/pipe-garde-le-code-de-sortie
kind: disposition
level: SHOULD
title: Une commande dont le code de sortie compte ne se pipe jamais sans garder son statut
---

- **En clair.** `commande | tail -3` rend le code de `tail`, pas celui de la commande. Un `git add` qui
  échoue, une suite de tests rouge ou une gate qui tombe passent alors pour réussis. Une commande dont
  le code compte (git add, tests, gate, build) garde son statut : `set -o pipefail`, `&&` avant le
  tuyau, ou un code relevé à part (`; echo "EXIT=$?"`).
- **Symptôme fondateur** (rétro du 2026-11-01) : trois fois, dont deux le même jour,
  `git add a b c 2>&1 | tail -2; git status && git commit`. Un chemin déjà renommé a fait échouer tout
  le `git add`, le tuyau a masqué l'échec, et le commit est parti avec le seul renommage. La revue a
  aussi relevé qu'un `vitest … | tail` masque le code de sortie.
- **Mesure (removability).** Sur les 5 prochains runs : 0 commit partiel et 0 gate lue verte à tort.

Origine : rétro du 2026-11-01, capture `docs/captures/2026-11-01-retro-run-contrats-json-light.md`
(proposition 2, lentilles dev et qualité). Cible : globale.
