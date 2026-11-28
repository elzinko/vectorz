---
id: "20261128120000204"
title: "Les leçons de revue sont gardées dans le projet et données d'office au développeur"
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [theme:outillage-methode, origine:retro-2026-11-28]
status: idea
blocked:
depends: []
pr:
evidence: none
created: 2026-11-28
---

# 20261128120000204 — Les leçons de revue sont gardées dans le projet et données d'office au développeur

**En clair.** Pendant le run du 26 novembre, la revue adverse a refusé les mêmes défauts story après story : faux zéros, code mort, lien non branché. Une liste de neuf leçons, donnée aux développeurs à partir du sprint 25, a réduit ces refus. Mais elle vivait dans un dossier temporaire de la session. Cette fiche la garde dans le projet et la fait lire d'office.

## Contexte / Problème

Les règles existent déjà (pas de code mort, pas de faux zéro). Les développeurs les ratent au premier jet, car elles sont générales. La liste du pilote les rendait concrètes pour ce projet : structure des cartes, fil d'Ariane unique, « — » au lieu de 0, comparer sa page à la maquette.

## Proposition

1. Un fichier `.vectorz/lessons.md` dans le projet : une leçon par ligne, concrète, avec son origine.
2. `ezk-sprint` l'inclut d'office dans le brief de chaque `ezk-dev`, avec la consigne de comparer sa page à la maquette dès le premier jet quand la fiche touche un écran.
3. `ezk-reviewer` y ajoute une leçon quand il refuse un défaut déjà vu.

## Critères d'acceptation

- [ ] Le fichier existe dans vectorz, repris de la liste du 26 novembre.
- [ ] Le brief d'un `ezk-dev` lancé par `ezk-sprint` contient les leçons du projet.
- [ ] Les consignes de `ezk-reviewer` disent quand et comment ajouter une leçon.
- [ ] Un projet sans fichier de leçons fonctionne comme avant.

## Comment vérifier

- Lire le brief assemblé par `ezk-sprint` pour une story de test : il cite le fichier.
- Mesure de suivi : sur deux runs, les refus pour un défaut déjà listé baissent d'au moins moitié.

## Hors périmètre

- Un contrôle automatique des leçons dans le code.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
