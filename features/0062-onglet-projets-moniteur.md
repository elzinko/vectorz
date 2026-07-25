---
id: 0062
title: Onglet « Projets » dans le Moniteur — portefeuille par projet (méthode+version, localisation, statut) cliquable vers son activité
type: feature
priority: P2
epic:
status: idea
ready:
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
DP2 préservé — aucune écriture). Une carte/ligne par projet :

- **méthode + version** installée (déjà projetée depuis `run.started`, fiche 0061 shippée) ;
- **localisation** (chemin du projet) ;
- **statut** dérivé de ce qui est déjà lu (a un run en attente / actif récemment / inactif) ;
- **clic → activité du projet** : filtre le Moniteur sur les runs de ce projet.

**Source de données** : le **registre 0082** (QUOI + méthode, versionné) pour la liste
« officielle » des projets ; à défaut de registre, dériver la liste des projets **observés**
depuis les `projectRoot` des runs déjà lus (dégradation gracieuse tant que 0082 n'existe pas).

## Critères d'acceptation (à groomer)

- [ ] Une vue liste les projets supervisés avec méthode+version, localisation, statut.
- [ ] Cliquer un projet filtre l'activité (ses runs) — navigation projet → runs.
- [ ] Fonctionne **sans** le registre 0082 (liste dérivée des runs observés), et **mieux**
      avec (liste déclarée, projets sans run encore visibles).
- [ ] Aucune écriture émise (lecture seule, DP2).

## Notes

- **Front de la fiche 0082** (registre) ; **B = fiche 0063** (ancrer un projet) en est le
  pendant *écriture*. 0082 = la donnée, 0062 = la voir, 0063 = en ajouter.
- Complémentaire de 0022 (afficher le déjà-collecté) : même surface, autre granularité
  (projet, pas run).
- **P2 par défaut** — à re-situer par le PO (fiche `idea`, priorité indicative).
