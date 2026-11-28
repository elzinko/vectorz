---
id: "20261128120000208"
title: "Le portier retient pour le run un passage outre déjà accordé sur le dossier d'une autre session"
type: feature
priority: P3
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

# 20261128120000208 — Le portier retient pour le run un passage outre déjà accordé sur le dossier d'une autre session

**En clair.** Au run du 26 novembre, le portier a signalé sept fois le même dossier de travail, celui d'une autre session qui ne touchait que les dépendances. Il a fallu ressaisir le même passage outre à chaque sprint. Le premier essai a été refusé par le contrôle de sécurité de l'outil. Cette fiche fait retenir l'accord du PO pour la durée du run.

**Si tu arrives frais.** Le portier est le contrôle lancé à l'ouverture d'un sprint. Il alerte sur les dossiers de travail et les fiches en cours. Le PO peut passer outre, avec une raison journalisée.

## Contexte / Problème

Le 17 novembre, quatorze passages outre du même type pour une session parallèle. Les 24 et 25 novembre, deux de plus pour la même branche que le 26.

## Proposition

Un passage outre accordé par le PO vise un dossier de travail précis. Le portier le retient jusqu'à la fin du run, tant que ce dossier ne touche aucun fichier du lot. Il ne réalerte que si ce dossier change de branche ou touche un fichier du lot. Chaque ouverture de sprint écrit une ligne « passage outre repris » dans le journal.

## Critères d'acceptation

- [ ] Un passage outre accordé une fois n'est pas redemandé au sprint suivant du même run.
- [ ] Le portier réalerte si le dossier signalé touche un fichier du lot.
- [ ] Chaque reprise est journalisée.
- [ ] Un nouveau run redemande l'accord.

## Comment vérifier

- Mesure de suivi : au prochain run à plusieurs sessions, un seul passage outre par session voisine.

## Hors périmètre

- Accorder un passage outre sans le PO.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
