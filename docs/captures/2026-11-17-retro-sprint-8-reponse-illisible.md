---
type: retro
date: 2026-11-17
theme: "Sprint 8 du 17 novembre « une réponse illisible n'est plus prise pour une coupure » : une petite correction, et une course entre deux sessions sur main"
scope: "huitième sprint de la journée (une story : le chargement des cartes distingue une réponse illisible d'une coupure réseau), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "L'identifiant du commit d'intégration a été lu sur le dernier commit de main ; l'autre session venait d'y committer, et la fiche a été livrée avec le mauvais identifiant (corrigé à la main). L'intégration doit imprimer l'identifiant qu'elle crée, et ezk-sprint le lire là."
    kind: feature
    by: [dev, qualite]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117150620910 (l'intégration locale imprime son commit), P2."
    date: 2026-11-17
  - proposition: "La revue a trouvé un cas voisin du défaut corrigé (un JSON valide mais vide) ; il a été corrigé dans la même story, avec son test, avant l'intégration. Garder ce réflexe pour un cas voisin de quelques lignes."
    kind: action
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le sprint a livré une petite correction : quand le daemon renvoie autre chose que du JSON,
les cartes le disent au lieu d'annoncer un serveur injoignable. Une course entre les deux sessions a
fait noter un mauvais identifiant de commit dans la fiche : corrigé, et la rétro en fait une fiche pour
que l'intégration imprime elle-même son identifiant.

## 1 · Les faits de départ

- Une story livrée en local (e4e02dfa), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-une-reponse-illisible-n-est-plus-prise-pour-une.md).
- Tests d'abord ; revue adverse GO ; un cas voisin (JSON `null`) ajouté après revue.
- Rebasage sur du code de la méthode intégré par l'autre session ; gates de l'écran et de cop1 rejouées.
- La fiche a d'abord été livrée avec `local (d40c6dd4)`, un commit de l'autre session, puis corrigée.

## 2 · Tour 1 — chaque lentille propose

- **Dev** et **qualité** : P1, l'identifiant imprimé par l'intégration.
- **Qualité** : P2, le cas voisin corrigé dans la story.
- **Architecture** et **produit** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux deux propositions.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Relire les deux décisions prises par délégation.
