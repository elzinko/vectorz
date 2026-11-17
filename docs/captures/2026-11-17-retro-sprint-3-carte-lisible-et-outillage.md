---
type: retro
date: 2026-11-17
theme: "Sprint 3 du 17 novembre « rendre la carte lisible de loin et fiabiliser l'outillage du sprint » : trois stories en parallèle, une revue groupée, un main qui bouge"
scope: "troisième sprint de la journée (lot de trois stories : sélection visible de loin sur la carte de la méthode, réinstallation des dépendances après intégration, brief du développeur isolé), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé), sans juge car aucune règle neuve n'est proposée"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Garder le geste de la revue groupée : trois petites stories d'un même lot, une seule revue adverse qui rend un verdict par story. Au sprint 3, elle a coûté environ 160 000 jetons au lieu d'environ 480 000, sans perdre de constat utile. C'est la règle d'économie existante (au plus une revue, partagée par 2 ou 3 petits patchs) : aucune règle neuve."
    kind: action
    by: [qualite, produit]
    status: ✅
    decision: "Retenue par délégation du PO : constat, le geste existe déjà dans ezk-sprint (budget tokens)."
    date: 2026-11-17
  - proposition: "Deux comptes rendus du jour s'intitulent « sprint 1 » : le numéro suit le journal de la branche d'ouverture. Ajouter ce cas à la fiche existante qui demande un numéro de sprint continu publié par la méthode."
    kind: action
    by: [produit]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261114131612204 enrichie du cas du 17 novembre, priorité inchangée (P1)."
    date: 2026-11-17
  - proposition: "Le texte du skill livré au sprint 3 dit de retirer le dossier d'agent avec une seule force, mais ce dossier est verrouillé par la session elle-même : il faut la double force. Petite correction de texte et de test."
    kind: feature
    by: [dev]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117130231211, P3, candidate du sprint 4."
    date: 2026-11-17
---

**En clair :** le sprint a livré ses trois stories. La carte de la méthode montre maintenant les voisins
d'une brique même de loin, avec un panneau qui les liste. L'intégration locale réinstalle les dépendances
quand il le faut. Le skill ezk-sprint prévoit le développeur isolé. Pendant ce temps, la session
parallèle a intégré son propre travail dans main : rebaser puis rejouer la gate a suffi. La rétro retient
deux constats et une petite correction.

## 1 · Les faits de départ

- Trois stories livrées en local (7b162612, 6aba4519, 1813d1de), d'après le
  [compte rendu](../sprints/2026-11-17-sprint-rendre-la-carte-lisible-de-loin-et-fiabiliser-l.md).
- Deux développeurs ont travaillé en parallèle sur des fichiers distincts ; la troisième story, du texte,
  a été écrite par l'orchestrateur.
- Le brief livré au sprint 2 a été appliqué : chaque développeur s'est placé sur le bon commit avant de
  coder. Aucun aller-retour.
- Une seule revue adverse pour les trois stories : trois GO, aucun défaut bloquant.
- La session parallèle a intégré les « objectifs publiés » (655e0ac5) avant mes intégrations : deux
  stories rebasées, gates rejouées, vertes.
- Le retrait d'un dossier d'agent a échoué avec une seule force : le verrou est tenu par la session.
- Les comptes rendus du jour portent les numéros 1, 1 et 2.

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : P1, la revue groupée a tenu ; le rejeu de gate après rebasage aussi.
- **Produit** : P1 ; P2, la numérotation des sprints.
- **Dev** : P3, la double force pour le dossier verrouillé.
- **Architecture** : rien à ajouter, les trois stories touchaient des fichiers disjoints.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux trois propositions.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Relire les trois décisions prises par délégation, toutes réversibles.
