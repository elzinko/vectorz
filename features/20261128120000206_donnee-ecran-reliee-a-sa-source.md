---
id: "20261128120000206"
title: "Au grooming d'une fiche d'écran, chaque donnée dessinée est reliée au champ publié qui la fournit"
type: feature
priority: P2
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

# 20261128120000206 — Au grooming d'une fiche d'écran, chaque donnée dessinée est reliée au champ publié qui la fournit

**En clair.** La maquette dessine des données que la méthode ne publie pas. Au run du 26 novembre, six éléments ont été retirés en plein développement pour cette raison. Cette fiche fait vérifier la source de chaque donnée quand on prépare une fiche d'écran. Une donnée sans source est signalée, sans bloquer la fiche.

**Si tu arrives frais.** Mission control affiche seulement ce que la méthode publie en JSON (ADR-086). Il n'invente aucune donnée.

## Contexte / Problème

Éléments retirés : la puce « close » de Fiches, le bouton « Ouvrir » d'un compte rendu, la liste des numéros de version, le lien Annuaire, le compte « 5 règles » du DoD, la croix de la cloche. Une note du carnet du 14 octobre décrit la même famille : une fiche prête qui cite ce qui n'existe pas.

## Proposition

Le gabarit de fiche d'écran porte une table « donnée affichée → contrat et champ ». Au grooming, `ezk-pm` remplit ou signale chaque ligne sans source. Une ligne sans source devient soit une dépendance, soit un retrait écrit avant le développement.

## Critères d'acceptation

- [ ] Le gabarit de fiche d'écran porte la table des sources.
- [ ] Les consignes de grooming demandent de la remplir.
- [ ] Une donnée sans source est signalée dans la fiche, sans bloquer son passage à « prête ».

## Comment vérifier

- Mesure de suivi : au prochain run d'écrans, zéro élément retiré en cours de développement faute de donnée.

## Hors périmètre

- Un contrôle automatique des champs contre les contrats.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
