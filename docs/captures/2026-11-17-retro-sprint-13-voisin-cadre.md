---
type: retro
date: 2026-11-17
theme: "Sprint 13 du 17 novembre « un clic sur un voisin du panneau déplace aussi la carte » : un seul chemin pour choisir, et une caméra enfin testée"
scope: "treizième et dernier sprint de la journée (une story d'écran sur la carte de la méthode), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Le geste de la rétro 11 a tenu une troisième fois : fiche sur main d'abord, branche de story coupée depuis main, livraison avant clôture. Trois cas sur trois. Proposer au PO de l'écrire dans le skill ezk-sprint, à l'étape de préparation d'une story."
    kind: action
    by: [dev, architecture]
    status: ✅
    decision: "Retenue par délégation du PO, qui avait demandé de répondre aux questions de la méthode : écrite dans le skill ezk-sprint au sprint 14 (fiche 20261117155420514)."
    date: 2026-11-17
  - proposition: "Un espion sur la fonction de cadrage de React Flow rend la caméra testable dans jsdom. Le sprint 12 avait conclu que c'était impossible et s'était reposé sur la seule capture d'écran. Constat : un test qui observe la demande vaut mieux que l'absence de test."
    kind: action
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO : constat, rien à ranger."
    date: 2026-11-17
---

**En clair :** le dernier sprint fait aussi bouger la carte quand on clique un voisin dans le panneau. On
parcourt donc la méthode de proche en proche, sans perdre la brique de vue. La rétro propose au PO
d'écrire dans la méthode le geste qui a évité trois fois le faux pas du sprint 11.

## 1 · Les faits de départ

- Une story livrée en local (320518f1), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-un-clic-sur-un-voisin-du-panneau-deplace-aussi-l.md).
- Le test du cadrage était rouge avant le correctif, puis vert. Au total, 272 tests web passent.
- Revue adverse GO, 2 critères sur 2. Sa réserve P3 est corrigée.
- main a bougé deux fois pendant le sprint, à cause de la session parallèle. Deux rebasages ont suffi,
  sans fichier commun et sans merge de rattrapage.

## 2 · Tour 1 — chaque lentille propose

- **Dev** et **architecture** : P1, à décider par le PO.
- **Qualité** : P2.
- **Produit** : rien à ajouter.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux deux constats. P1 reste en attente : écrire un geste dans un skill
de la méthode est une décision du PO.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est rangée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Rien de neuf. P1 a été tranchée par délégation et faite au sprint 14 : le skill ezk-sprint écrit
maintenant le geste. Le PO peut la défaire, comme toute décision prise à sa place.
