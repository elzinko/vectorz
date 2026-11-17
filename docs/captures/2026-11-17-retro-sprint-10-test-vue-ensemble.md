---
type: retro
date: 2026-11-17
theme: "Sprint 10 du 17 novembre « la vue d'ensemble de la carte a son test de rendu » : un test, et l'outillage du jour qui sert"
scope: "dixième et dernier sprint de la journée (une story de test sur la carte de la méthode), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Un test qui vérifie « le nombre » doit vérifier le chiffre, pas seulement le mot voisin : le premier jet ne cherchait que le verbe. Corrigé avant la revue, qui l'a aussi relevé. Constat, aucune règle : la revue adverse sert à ça."
    kind: action
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le dernier sprint a ajouté un test de rendu à la vue d'ensemble de la carte de la méthode.
Il est surtout le premier à avoir livré sa fiche avec l'identifiant imprimé par l'intégration, la
correction du sprint 9. La rétro ne retient qu'un constat.

## 1 · Les faits de départ

- Une story livrée en local (971c44f6), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-la-vue-d-ensemble-de-la-carte-a-son-test-de-rend.md).
- L'identifiant de livraison vient de la ligne `INTEGRATED: 971c44f6 …`, sans lecture de HEAD.
- Test d'abord ; revue adverse GO ; le test vérifie le texte exact « 1 voisin · applique ».

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : P1.
- **Architecture**, **dev** et **produit** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient au constat.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf.
