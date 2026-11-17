---
type: retro
date: 2026-11-17
theme: "Sprint 5 du 17 novembre « des cartes qui chargent sans s'obstiner ni abandonner trop tôt » : une story, sans friction"
scope: "cinquième sprint de la journée (une story : les re-tentatives mesurées du chargement des cartes), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Quand un comportement passe de « immédiat » à « après re-tentatives », les tests de composant qui vérifiaient le message immédiat doivent passer à l'horloge simulée. Au sprint 5, deux tests l'ont rappelé à la gate de l'écran. Constat, pas de règle : la gate l'a vu."
    kind: action
    by: [qualite, dev]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
  - proposition: "Une réponse HTTP illisible est encore dite « injoignable » alors que le serveur a répondu (relevé non bloquant de la revue). Le garder dans la fiche livrée comme reste ouvert ; pas de fiche tant que personne n'a vu le cas."
    kind: action
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO : noté dans la fiche 20261117135600942, pas de fiche neuve."
    date: 2026-11-17
---

**En clair :** le sprint a livré une seule story : les deux cartes de mission control re-tentent leur
chargement avec mesure, puis disent pourquoi elles s'arrêtent. Le sprint s'est déroulé sans accroc,
construit par l'orchestrateur seul, sans développeur délégué. La rétro ne retient que deux constats.

## 1 · Les faits de départ

- Une story livrée en local (cf5fe442), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-des-cartes-qui-chargent-sans-s-obstiner-ni-aband.md).
- Tests d'abord, sur une horloge simulée : trois rouges, puis verts.
- Deux tests existants des cartes vérifiaient le message « injoignable » immédiat : mis à jour.
- Revue adverse GO, trois critères prouvés ; un reste ouvert hérité.
- Main n'a pas bougé pendant le sprint : intégration directe.

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : P1 et P2.
- **Dev** : P1.
- **Architecture et produit** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux deux constats.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf : relire les deux constats si tu le souhaites.
