---
type: retro
date: 2026-11-17
theme: "Sprint 12 du 17 novembre « la carte de la méthode se déplace sur la brique cherchée » : le geste de la rétro 11 rejoué, et il tient"
scope: "douzième et dernier sprint de la journée (une story d'écran sur la carte de la méthode), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Le geste retenu à la rétro 11 a marché : branche de story coupée depuis main, livraison de la fiche avant la clôture. La branche de session et main sont restées alignées, sans merge de rattrapage. Deuxième cas : il reste un geste du sprint, à écrire dans le skill ezk-sprint si un troisième sprint le confirme."
    kind: action
    by: [dev]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le dernier sprint fait venir la carte sur la brique choisie par la recherche. Vue de
loin, on tape `reviewer`, Entrée, et la carte vient sur `ezk-reviewer`. Le faux pas d'outillage du
sprint 11 ne s'est pas reproduit : le geste corrigé a tenu.

## 1 · Les faits de départ

- Une story livrée en local (e87a7da4), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-la-carte-de-la-methode-se-deplace-sur-la-brique.md).
- Tests d'abord : 3 tests rouges sur la règle des deux temps, puis verts. Au total, 269 tests web
  passent.
- Le déplacement de la carte ne se mesure pas dans les tests. Il est prouvé par des captures prises dans
  le navigateur, sur les vraies données.
- Revue adverse GO. Ses deux réserves P3 sont corrigées.
- Rebasage sur un correctif de la session parallèle, sans fichier commun.
- La session parallèle a signalé une valeur de champ refusée dans la fiche. Elle était déjà corrigée sur
  la branche.

## 2 · Tour 1 — chaque lentille propose

- **Dev** : P1.
- **Qualité** : une preuve d'écran remplace un test impossible dans jsdom, et la fiche le dit. Rien à
  ranger.
- **Architecture** et **produit** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient au constat.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf.
