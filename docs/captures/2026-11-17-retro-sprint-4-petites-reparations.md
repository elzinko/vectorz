---
type: retro
date: 2026-11-17
theme: "Sprint 4 du 17 novembre « petites réparations de la journée » : deux corrections livrées, un faux bug démasqué"
scope: "quatrième sprint de la journée (lot de trois fiches : accents du nom de compte rendu, double force pour le dossier d'agent verrouillé, ancienne carte vide), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé) ; une règle proposée reste en attente du PO, donc pas de juge consulté"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "L'ancienne carte « vide » n'était pas un bug : le navigateur intégré de l'app bloque le cadre, Chrome l'affiche. La fiche a été ouverte au sprint 2 sur la seule foi de ce navigateur. Proposer une règle de projet : un bug d'écran vu dans le navigateur intégré se revoit dans Chrome avant d'être fiché. Mesure : sur les 5 prochains bugs d'écran fichés, aucun clos en superseded pour un artefact du navigateur."
    kind: regle
    target: projet
    by: [qualite, produit]
    status: ⏳
  - proposition: "Garder le second dossier de travail pour faire tourner deux gates en même temps : au sprint 4, la story des accents a été finie et testée pendant que la gate de l'autre story tournait, sans conflit."
    kind: action
    by: [dev, architecture]
    status: ✅
    decision: "Retenue par délégation du PO : constat, le geste reste à la main de l'orchestrateur ; le dossier est retiré dès l'intégration."
    date: 2026-11-17
  - proposition: "La revue du sprint 1 avait laissé deux faiblesses du chargement des cartes, partagé depuis le sprint 2 : la re-tentative sur « en cours de lecture » n'a pas de borne, et une erreur réseau n'est jamais re-tentée. Avant que le PO teste, les rendre sûres."
    kind: feature
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117135600942 (le chargement des cartes re-tente avec mesure), candidate du sprint 5."
    date: 2026-11-17
---

**En clair :** le sprint a livré deux corrections. Le nom des comptes rendus garde ses lettres
accentuées, et son propre compte rendu le prouve. Le skill ezk-sprint dit comment retirer un dossier
d'agent verrouillé. La troisième fiche était un faux bug : seul le navigateur intégré à l'app bloquait
l'ancienne carte. La rétro propose une règle pour ne plus ficher ce genre de faux bug, en attente de ta
décision, et une fiche pour fiabiliser le chargement des cartes.

## 1 · Les faits de départ

- Deux stories livrées en local (47fddb99, 0060a88d) et une fiche close en superseded après diagnostic,
  d'après le [compte rendu](../sprints/2026-11-17-sprint-petites-reparations-de-la-journee-accents-dossie.md).
- Le nom de ce compte rendu est le premier de la journée à garder ses accents translittérés.
- Une revue groupée pour les deux stories : deux GO ; un avertissement ajouté quand perl manque.
- La session parallèle a encore intégré dans main : rebasages et gates rejouées, vertes.
- Deux gates ont tourné en même temps, dans deux dossiers de travail.
- L'ancienne carte : le serveur la sert (200, 92 Ko) ; le navigateur intégré refuse le cadre
  (`ERR_BLOCKED_BY_CLIENT`) ; Chrome l'affiche.

## 2 · Tour 1 — chaque lentille propose

- **Qualité** : P1, revoir dans Chrome avant de ficher ; P3, le chargement des cartes.
- **Produit** : P1 ; le PO testera bientôt les deux cartes, P3 compte.
- **Dev** : P2, le second dossier de travail.
- **Architecture** : P2 ; rien d'autre.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux trois propositions. La règle reste en attente : une règle se range
sous le contrôle du PO, même en son absence, et rien ne presse.

## 4 · Juge de cohérence

Pas consulté : la seule règle proposée attend d'abord la décision du PO.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

- Trancher la règle : un bug d'écran vu dans le navigateur intégré se revoit dans Chrome avant d'être
  fiché (cible projet : ce projet seulement).
- Relire les deux décisions prises par délégation.
