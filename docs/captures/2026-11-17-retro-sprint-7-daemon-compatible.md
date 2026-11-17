---
type: retro
date: 2026-11-17
theme: "Sprint 7 du 17 novembre « le daemon accepte un graphe d'une méthode plus ancienne » : une correction de quelques lignes, née de la rétro précédente"
scope: "septième sprint de la journée (une story : la compatibilité du daemon avec un graphe sans les sortes récentes), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Une réserve de revue (sprint 6) devenue fiche à la rétro, puis livrée au sprint suivant en trente minutes : garder ce circuit court pour les petites réserves qui touchent les projets hôtes, plutôt que de les laisser dormir dans les notes des fiches."
    kind: action
    by: [produit, qualite]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le sprint a livré une petite correction : mission control affiche la carte de la méthode
même quand le graphe vient d'une version plus ancienne d'ezk, sans les commandes ni les recettes. Elle
vient tout droit de la rétro du sprint 6. La rétro ne retient qu'un constat.

## 1 · Les faits de départ

- Une story livrée en local (ca19fb36), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-le-daemon-accepte-un-graphe-d-une-methode-plus-a.md).
- Tests d'abord : deux rouges, puis verts ; cop1 828 tests verts.
- Revue adverse GO ; un commentaire du code a été aligné sur son comportement réel.
- Main n'a pas bougé pendant le sprint.

## 2 · Tour 1 — chaque lentille propose

- **Produit** et **qualité** : P1.
- **Architecture** et **dev** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient au constat.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf.
