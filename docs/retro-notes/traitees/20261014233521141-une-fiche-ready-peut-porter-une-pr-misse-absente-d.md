---
date: 2026-10-14
session: "main / vectorz"
type: friction
---

# Une fiche ready peut porter une prémisse absente du code

La fiche « trier les sorties de rétro » (20261002155911271) était ready mais a dû être sautée : elle demande d'aligner la doc sur une 3e surface (« README .rules/ qui range des règles en observation ») et un concept (« règle en observation / buffered ») qui N'EXISTENT nulle part dans le code. Documenter un mécanisme inexistant = anti-pattern « livré ≠ tourne ». Une fiche ready peut donc porter une prémisse qui ne colle plus au code — le grooming n'a pas vérifié l'existence des surfaces citées. Piste : au grooming d'une fiche d'alignement de doc, vérifier que chaque surface/concept cité existe (sinon la fiche décrit un futur à construire, pas un alignement).
