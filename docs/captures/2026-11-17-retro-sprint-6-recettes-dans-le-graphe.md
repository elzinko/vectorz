---
type: retro
date: 2026-11-17
theme: "Sprint 6 du 17 novembre « les recettes entrent dans le graphe et sur la carte » : la huitième famille, et un main qui bouge trois fois"
scope: "sixième sprint de la journée (une story sur deux surfaces : la sortie du graphe et la carte de la méthode), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Le daemon exige maintenant chaque sorte dans nodeCount : il refuserait le graphe d'une méthode plus ancienne, sans la sorte `recipe` (ou `command`). Aujourd'hui, producteur et lecteur vivent dans le même dépôt, donc rien ne casse ; chez un projet hôte qui met à jour mission control avant ezk, la carte serait vide. En faire une fiche : le daemon accepte une sorte absente comme un compte nul."
    kind: feature
    by: [architecture, qualite]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117145515980 (le daemon accepte un graphe sans les sortes récentes), P3."
    date: 2026-11-17
  - proposition: "Main a bougé trois fois pendant le sprint, toujours par la session parallèle. Le geste « rebaser puis rejouer la gate » a suffi ; quand seuls des fichiers de fiche ont bougé, intégrer sans second rejeu, en le journalisant. Garder ce partage des rôles entre deux sessions sur un même objectif : il a tenu toute la journée sans conflit."
    kind: action
    by: [produit, dev]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le sprint a livré la dernière pièce demandée pour la carte de la méthode : les recettes y
entrent, comme huitième famille, avec ce qu'elles composent. Un clic sur une recette montre ses voisins.
La revue a relevé un risque de compatibilité pour les projets hôtes, que la rétro transforme en fiche.

## 1 · Les faits de départ

- Une story livrée en local (2200fa27), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-les-recettes-entrent-dans-le-graphe-et-sur-la-ca.md).
- Graphe réel : 361 briques, dont 16 recettes ; 445 liens ; 0 cassé ; 9 recettes sans aucun lien.
- Revue adverse GO, quatre critères prouvés sur la vraie sortie. Deux réserves non bloquantes.
- Gates vertes : méthode 2519 tests et 49 suites, écran 255, cop1 826.
- Main a bougé trois fois pendant le sprint : un rebasage avec rejeu, puis une intégration directe
  après des changements de fiches seulement.
- Dans le navigateur : 8 familles, dont « Recettes · 16 » ; un clic sur `brancher-domaine-vercel`
  montre deux recettes composées et deux qui la composent.

## 2 · Tour 1 — chaque lentille propose

- **Architecture** : P1, la compatibilité du daemon avec une méthode plus ancienne.
- **Qualité** : P1.
- **Produit** : P2, le partage des rôles entre les deux sessions a tenu.
- **Dev** : P2.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux deux propositions.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Relire les deux décisions prises par délégation.
