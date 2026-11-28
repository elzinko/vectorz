---
id: "20261128120000202"
title: "Une commande de la méthode finalise une fiche : critères cochés, preuve posée, référence de livraison au bon format"
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

# 20261128120000202 — Une commande de la méthode finalise une fiche : critères cochés, preuve posée, référence de livraison au bon format

**En clair.** La méthode n'a pas de commande pour cocher les critères prouvés et poser la preuve avant/après. Le pilote du run du 26 novembre a donc écrit ses propres scripts. L'un a abîmé sept fiches, un autre a été appelé avec un mauvais nom de fiche. Cette fiche ajoute une commande qui fait ce geste proprement.

## Contexte / Problème

À la fin d'une story, il faut cocher les critères prouvés, ajouter la preuve avant/après et écrire la référence de livraison. Le bilan de run exige le format `local (<sha>)` : 4 fiches sur 14 n'avaient pas de sha. `ezk backlog ship` n'enregistre ses écritures que lancé depuis le dossier cible (note du carnet du 14 octobre).

## Proposition

Une commande mince, par exemple `ezk backlog finish <id> --proved <n,…> --evidence <liens> --ref "local (<sha>)"`. Elle compose les gestes existants et n'invente pas de moteur. Elle refuse un id inconnu et une référence hors format. Elle écrit dans le dépôt désigné par `--root`, quel que soit le dossier courant.

## Critères d'acceptation

- [ ] La commande coche seulement les critères nommés et laisse les autres intacts.
- [ ] Le titre « Critères d'acceptation » et le reste de la fiche ne bougent pas.
- [ ] La preuve avant/après et la référence de livraison sont écrites dans la fiche et dans son corps de PR local.
- [ ] Un id inconnu ou une référence hors format est refusé avec un message clair.
- [ ] Lancée depuis un autre dossier avec `--root`, la commande écrit bien dans le dépôt visé.

## Comment vérifier

- Sur une fiche de test : lancer la commande, puis `ezk backlog check` et `ezk run report` sur cette fiche.

## Hors périmètre

- Juger si un critère est prouvé : la revue adverse reste juge.

## Notes / décisions

- 2026-11-28 — Née de [la rétro du 28 novembre](../docs/captures/2026-11-28-retro-run-migration-maquette.md), proposition retenue par le PO.
