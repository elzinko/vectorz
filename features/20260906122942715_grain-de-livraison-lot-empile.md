---
id: "20260906122942715"
title: Grain de livraison « lot empilé » — 1 PR, N commits propres pour fiches dépendantes
type: feature
priority: P2
product: mega-city
version:
epic:
depends: []
labels: [methode, retro-2026-09-05, ezk-pr]
status: idea
ready:
pr:
created: 2026-09-06
---

# 20260906122942715 — Grain de livraison « lot empilé »

## En clair

Quand plusieurs fiches dépendent l'une de l'autre, on hésite entre une PR géante (illisible) et une
PR par fiche (qui casse les dépendances). Cette fiche pose un troisième grain : **une PR, plusieurs
commits propres**, un par fiche, chacun vert isolément. Distinct de la « PR obèse ».

## Contexte / Problème

Symptôme 4 de la rétro du 2026-09-05 : le grain de livraison pour des fiches dépendantes n'est pas
cadré. On empile tout dans une PR fourre-tout, ou on découpe au risque de merger un maillon qui ne
tient pas seul.

## Proposition

Définir un grain « lot empilé » pour des fiches **déclarées dépendantes** :

- **1 PR, N commits** : un commit propre par fiche, ordre enabler → feature, chaque commit vert
  isolément, chaque étape testable en `checkout`.
- **Distinct de la PR obèse** : le lot empilé est ordonné et relu commit par commit ; la PR obèse
  mélange tout.
- **Frontière des responsabilités** : le skill décide le **grain** ; `ezk-pr` exécute le **git**.
- **Garde de cohérence (`ezk-steward`)** : le mode empilé n'est autorisé que pour une dépendance
  **déclarée** entre les fiches.

### Décision de nommage (PO)

Rendre les valeurs de `--delivery` **neutres et fonctionnelles**, découplées du mot « epic » (les
épics sont censés disparaître). Proposition : `separate` | `coordinated` | `stacked`. On **garde
`per-epic` pour l'instant** et on renomme quand les épics sortent.

## Critères d'acceptation

- [ ] Un mode de livraison « lot empilé » existe (1 PR, N commits, enabler → feature).
- [ ] Chaque commit du lot est vert isolément et testable en checkout.
- [ ] `ezk-pr` exécute le git ; le skill décide le grain (frontière nette).
- [ ] Garde `ezk-steward` : empilé uniquement sur dépendance déclarée.
- [ ] Valeurs `--delivery` proposées neutres (`separate` | `coordinated` | `stacked`), `per-epic`
      conservé en alias jusqu'à la sortie des épics.
- [ ] Gate locale verte.

## Comment vérifier

Groomer avec deux fiches dépendantes déclarées, lancer la livraison en mode empilé : une seule PR,
deux commits ordonnés, chacun vert en checkout.

## Notes

Origine : rétrospective du 2026-09-05 (symptôme 4). Candidate à passer au juge `ezk-steward` face au
refus « PR obèse ». Nommage `--delivery` tranché par le PO (neutre/fonctionnel, `per-epic` gardé le
temps de la transition).
