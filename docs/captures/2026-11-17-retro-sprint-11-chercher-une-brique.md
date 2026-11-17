---
type: retro
date: 2026-11-17
theme: "Sprint 11 du 17 novembre « on cherche une brique par son nom sur la carte de la méthode » : une recherche pour le test du PO, et une livraison qui a raté main"
scope: "onzième et dernier sprint de la journée (une story d'écran sur la carte de la méthode), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Couper la branche de story depuis main, pas depuis la branche de session qui porte encore la fiche « add and ready ». Sinon le squash dans main reprend la fiche, la branche de session diverge, et la livraison de la fiche, committée ensuite sur la session, ne part pas dans main avec le compte rendu. Constat de geste : à rejouer au prochain sprint, pas de règle tant qu'un seul cas existe."
    kind: action
    by: [dev, architecture]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le dernier sprint a ajouté un champ de recherche à la carte de la méthode. On tape
`reviewer`, et la carte propose `ezk-reviewer`. Entrée le choisit et ses voisins s'affichent. La rétro
retient un faux pas d'outillage : la livraison de la fiche n'était pas partie dans main, elle a dû être
intégrée à part.

## 1 · Les faits de départ

- Une story livrée en local (8e9bf550), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-on-cherche-une-brique-par-son-nom-sur-la-carte-d.md).
- Tests d'abord : 7 tests rouges, puis verts. La revue adverse a donné GO, 4 critères sur 4. Sa réserve
  P2 a été corrigée par un test d'écran de plus. Au total, 266 tests web passent.
- Captures avant / après prises sur les vraies données de vectorz.
- La branche de story partait de la branche de session, qui portait la fiche. Après le squash, la
  session a divergé de main. Le `reset --hard` a été refusé, et un merge de main l'a remplacé. La
  livraison de la fiche a ensuite demandé une seconde intégration (12d3ed41).

## 2 · Tour 1 — chaque lentille propose

- **Dev** et **architecture** : P1.
- **Qualité** : la revue a trouvé un critère prouvé en unité mais pas à l'écran. C'est corrigé, et
  rien de plus n'est à ranger.
- **Produit** : rien à ajouter. La recherche sert le test annoncé au PO.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient au constat.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf.
