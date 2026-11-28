---
id: "20261128120000201"
title: "La vérification des fiches refuse une fiche livrée sans sa section « Critères d'acceptation »"
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

# 20261128120000201 — La vérification des fiches refuse une fiche livrée sans sa section « Critères d'acceptation »

**En clair.** Le 26 novembre, un script de finalisation a effacé le titre « Critères d'acceptation » dans sept fiches livrées. Aucune vérification ne l'a vu. Cette fiche fait échouer `ezk backlog check` quand une fiche livrée a perdu cette section.

## Contexte / Problème

`ezk backlog check` contrôle le schéma des fiches, pas leurs sections. Une fiche livrée sans critères n'a plus la trace de ce qui a été prouvé. Les sept fiches ont été réparées à la main sur `main` (commit 00979e9c).

## Proposition

`ezk backlog check` signale en erreur toute fiche `shipped` dont le corps n'a pas de titre « ## Critères d'acceptation » suivi d'au moins une case. Même contrôle sur les corps de PR locaux (`features/pr-local/`).

## Critères d'acceptation

- [ ] Une fiche livrée sans la section fait échouer `ezk backlog check`, avec le nom du fichier.
- [ ] Une fiche livrée qui a la section passe.
- [ ] Une fiche `idea` sans la section ne déclenche pas d'erreur.
- [ ] Les fiches livrées actuelles passent toutes, ou la liste des fautives est traitée dans la même story.

## Comment vérifier

- `ezk backlog check` sur le dépôt : code de sortie 0.
- Retirer le titre d'une fiche livrée dans une copie de test : code de sortie non nul et fichier cité.

## Hors périmètre

- Vérifier que chaque case cochée est réellement prouvée.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
