---
id: 0062
title: Onglet « Projets » dans le Moniteur — portefeuille par projet (méthode+version, localisation, statut) cliquable vers son activité
type: feature
priority: P2
product: vectorz
epic:
status: in-progress
ready: 2026-08-03
pr:
created: 2026-07-26
---

## Contexte / Problème

Le Moniteur (fiche 0059, shippé #50) montre un **flux de runs**. Il manque le niveau
au-dessus : le **portefeuille de projets**. On ne peut pas répondre à « quels projets
utilisent vectorz, où sont-ils, quelle version de méthode tourne sur chacun, et lequel est
actif ? » — alors que c'est la première question quand on gère plus d'un projet.

Demande PO (2026-07-26) : une **liste des projets** qui utilisent vectorz, avec pour chacun
sa **version de méthode/plugin installée**, sa **localisation** (chemin), son **statut** ;
chaque projet **cliquable** pour entrer dedans et suivre son activité.

## Valeur

- Passe d'un « flux de runs » anonyme à un **portefeuille lisible** : un coup d'œil dit
  combien de projets, lesquels tournent, sur quelle version.
- **Répond à « chaque projet, sa version »** (le nord de l'axe 1, fiche 0087) côté lecture :
  on *voit* la version par projet — condition pour la piloter ensuite.
- Point d'entrée naturel : projet → son activité (ses runs), au lieu de fouiller un flux plat.

## Proposition

Un onglet/vue **« Projets »**, à côté du flux de runs actuel, en **lecture seule** (verrou
DP2 préservé — aucune écriture). Une ligne par projet :

- **méthode + version** (version depuis le dernier run observé ; méthode depuis le
  registre 0082, sinon depuis le run) ;
- **localisation** (chemin du projet) ;
- **statut** dérivé : en attente / actif / récent / inactif ;
- **clic → activité du projet** : filtre le Moniteur sur les runs de ce projet.

**Source de données** : `GET /api/supervision/projects` (registre 0082) + runs déjà
lus ; sans registre, liste dérivée des `projectRoot` observés (dégradation gracieuse).

## Critères d'acceptation

- [x] Onglets **Projets** / **Activité** dans le shell Moniteur (pas de contrôles pilote).
- [x] Vue Projets : pour chaque entrée, méthode (± version), localisation, statut dérivé.
- [x] Clic sur un projet → onglet Activité filtré sur les runs de ce `projectRoot`.
- [x] Sans registre : projets dérivés des runs ; avec registre : projets déclarés visibles
      même sans run.
- [x] Aucune écriture émise depuis la vue Projets (lecture seule, DP2).

## Notes

- **Front de la fiche 0082** (registre) ; **B = fiche 0063** (ancrer un projet) en est le
  pendant *écriture*. 0082 = la donnée, 0062 = la voir, 0063 = en ajouter.
- Complémentaire de 0022 (afficher le déjà-collecté) : même surface, autre granularité
  (projet, pas run).
- Groomé 2026-08-03 (sprint simplifié post-0181) — DoR problème / valeur / AC OK.
