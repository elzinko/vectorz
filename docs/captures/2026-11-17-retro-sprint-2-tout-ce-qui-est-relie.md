---
type: retro
date: 2026-11-17
theme: "Sprint 2 du 17 novembre « voir tout ce qui est relié dans la méthode, sur une carte zoomable » : deux stories livrées, deux pièges d'outillage révélés"
scope: "sprint 2 de la journée (lot de deux stories : le graphe de la méthode publié en contrat, puis la carte de la méthode zoomable), mode auto, PO absent jusqu'à 17 h 31 avec délégation des réponses ; mode léger : tours 1 et 2 portés par l'orchestrateur (round-robin dégradé, agents de rôle non liés dans l'app desktop), sans juge car aucune règle neuve n'est proposée"
participants: [architecture, qualite, dev, produit]
actions:
  - proposition: "Les dossiers isolés des développeurs partent d'une version de main vieille de deux jours (174ab4a2), pas du main courant. Enrichir la fiche « ezk-sprint prévoit le développeur isolé » avec ce second cas et la parade appliquée : se placer sur le commit de la story, installer les dépendances, rapatrier par diff de ce commit. Monter sa priorité."
    kind: action
    by: [dev, architecture]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117114426425 enrichie, priorité P3 → P2."
    date: 2026-11-17
  - proposition: "Après l'intégration d'une story qui ajoute une bibliothèque, le dossier principal n'a pas les dépendances : l'écran Process plantait sur main. L'intégration locale doit réinstaller les dépendances quand le lockfile change."
    kind: feature
    by: [qualite, produit]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117122122418 (l'intégration locale réinstalle les dépendances), P2."
    date: 2026-11-17
  - proposition: "Sur la carte de la méthode, la sélection disparaît dès qu'on recule au niveau d'ensemble, et les libellés des liens se chevauchent quand une brique en a beaucoup. C'est la suite directe de la demande du PO (voir ce qui est intriqué) : montrer les voisins par famille de loin, et un panneau de voisins."
    kind: feature
    by: [produit, qualite]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261117122122557, P1, candidate du sprint suivant."
    date: 2026-11-17
  - proposition: "L'ancienne carte interactive de la page Cartes s'ouvre vide. La consigner comme bug ; réparer ou retirer reste au PO."
    kind: feature
    by: [qualite]
    status: ✅
    decision: "Retenue par délégation du PO : fiche bug 20261117122122699, P3 ; le choix réparer ou retirer est laissé au PO."
    date: 2026-11-17
  - proposition: "Le nom du compte rendu de sprint perd encore ses accents (« reli-dans-la-m-thode ») : quatrième cas. Monter la priorité de la fiche existante."
    kind: action
    by: [dev]
    status: ✅
    decision: "Retenue par délégation du PO : fiche 20261115180226950, P3 → P2."
    date: 2026-11-17
---

**En clair :** le sprint a livré ce que le PO demandait : la méthode publie son graphe, commandes
comprises, et mission control le montre sur une carte zoomable où un clic allume les voisins d'une
brique. La revue adverse a attrapé un vrai défaut : un seul lien cassé aurait rendu la carte
indisponible. Deux pièges d'outillage sont apparus, une base périmée pour les développeurs et des
dépendances absentes après intégration. La rétro en fait une fiche et une précision de fiche.

## 1 · Les faits de départ

- Deux stories livrées en local : le graphe en contrat (8d615de3) et la carte de la méthode (de85f03a),
  d'après le [compte rendu](../sprints/2026-11-17-sprint-voir-tout-ce-qui-est-reli-dans-la-m-thode-sur-un.md).
- Le graphe compte maintenant 337 briques et 437 liens, dont 75 commandes `ezk` ; aucun lien cassé.
- Revues adverses GO : 5 critères sur 5, puis 6 sur 6. Gates vertes : méthode 2424 tests et 48 suites,
  cop1 826, écran 237.
- La revue de la carte a trouvé qu'un code de sortie 1 (liens cassés signalés) jetait le graphe complet :
  corrigé avant intégration.
- Les deux développeurs ont été isolés dans des dossiers partis de 174ab4a2, vieux de deux jours.
- Le dossier principal n'avait pas `@xyflow/react` après l'intégration du sprint 1 : écran Process en
  erreur sur main, réparé par `pnpm install`.
- Une seconde session menait le même objectif en parallèle ; partage des fiches convenu par message,
  sans collision.
- Dans le navigateur : sélection invisible de loin, libellés de liens qui se chevauchent ; l'ancienne
  carte de la page Cartes s'ouvre vide.

## 2 · Tour 1 — chaque lentille propose

- **Dev** : P1, la base périmée des dossiers isolés ; P5, les accents du nom de compte rendu.
- **Qualité** : P2, les dépendances après intégration ; P4, l'ancienne carte vide.
- **Produit** : P3, la sélection visible de loin, suite directe de la demande du PO.
- **Architecture** : P1 ; le partage du mécanisme de zoom entre les deux cartes a tenu.

## 3 · Tour 2 — convergence

Les quatre lentilles se rallient aux cinq propositions. Constat sans proposition : le partage des fiches
avec la session parallèle a marché par simple message, aucune règle à ajouter.

## 4 · Juge de cohérence

Sans objet : aucune règle neuve n'est proposée.

## 5 · Carnet de rétro

Aucune note du carnet ne porte sur ce sprint.

## 6 · Ce qui reste au PO

Relire les cinq décisions prises par délégation, toutes réversibles. Trancher pour l'ancienne carte :
réparer ou retirer.
