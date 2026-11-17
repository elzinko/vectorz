---
type: retro
date: 2026-11-17
theme: "Sprint 9 du 17 novembre « l'intégration dit quel commit elle a créé » : une correction née de la rétro précédente, éprouvée dès la clôture"
scope: "neuvième et dernier sprint de la journée (une story : le squash local imprime l'identifiant de son commit), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "La commande `ezk` exécute le code du dossier principal. Une story qui change un outil de la méthode ne profite donc pas de son propre changement au moment de sa propre intégration : la ligne INTEGRATED n'est sortie qu'à l'intégration suivante, celle du compte rendu. Constat à garder en tête pour vérifier un changement d'outillage : le tester sur l'intégration d'après."
    kind: action
    by: [dev, architecture]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le dernier sprint de la journée a livré une petite correction d'outillage : quand une story
est intégrée dans main, l'outil imprime désormais l'identifiant exact du commit créé. C'est la réponse à
la course entre deux sessions vue au sprint 8. Elle a marché dès l'intégration suivante, celle du compte
rendu du sprint.

## 1 · Les faits de départ

- Une story livrée en local (59224ba8), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-l-integration-dit-quel-commit-elle-a-cree.md).
- Tests d'abord, dont un cas où un autre commit arrive juste après l'intégration ; gate de la méthode
  verte (2516 tests et 49 suites).
- Revue adverse GO ; trois réserves étroites notées dans la fiche.
- La ligne n'est pas sortie pour l'intégration de la story elle-même, puis est sortie pour celle du
  compte rendu : `INTEGRATED: 521a412f docs/sprint-report-2026-11-17`.

## 2 · Tour 1 — chaque lentille propose

- **Dev** et **architecture** : P1.
- **Qualité** et **produit** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient au constat.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf.
