---
id: "20261103161632129"
title: "Les messages affichés par le code de cop1 et de la méthode disent « mission control »"
type: chore
priority: P2
product: cop1
milestone: board
version:
labels: [board, vocabulaire]
status: idea
pr:
evidence: none # messages de terminal et de journal ; aucun écran ne change
created: 2026-11-03
split_from: "20261102234112839"
---

# 20261103161632129 — Les messages affichés par le code disent « mission control »

## En clair

Le code de cop1 et quelques commandes de la méthode affichent encore « Moniteur », « cockpit » ou
« dashboard », des noms retirés de l'écran de supervision. Cette fiche corrige les messages qu'un
humain lit. Les identifiants internes restent : les renommer casserait des contrats sans rien montrer
de plus.

**Si tu arrives frais.** Mission control est l'écran de cop1. Le glossaire
(`docs/glossaire-jargon-ezk.md`) liste les mots retirés et ceux qui les remplacent.

## Contexte / Problème

Née du découpage de
[Réécrire les guides de l'ancien écran de supervision](done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md),
le 2026-11-03 : la fiche mère tenait trop pour un sprint. Les anciens mots apparaissent dans
`products/cop1/packages/*/src` et `products/mega-city/bin` (environ 15 occurrences, hors tests). Les
scripts qui accompagnent les guides vont avec les guides, dans la fiche sœur.

## Valeur

Un message de commande ou de journal nomme l'écran que l'utilisateur voit.

## Proposition

À préciser au grooming : trier chaque occurrence entre message affiché (à corriger) et identifiant
interne (à garder), puis corriger les messages.

## Critères d'acceptation

- [ ] Aucun message affiché par `products/cop1/packages/*/src` ni `products/mega-city/bin` ne dit
      « Moniteur », « cockpit » ou « dashboard » ; les identifiants internes restants sont listés dans
      la fiche avec leur raison.
- [ ] Les tests et la gate restent verts.

## Comment vérifier

```bash
grep -rniwE "moniteur|cockpit|dashboard" products/cop1/packages/*/src products/mega-city/bin
```

## Notes

- Fiche mère : [Réécrire les guides de l'ancien écran](done/20261102234112839_reecrire-guides-ancien-ecran-supervision.md).
