---
id: 2068
product: mega-city
title: Règle enforced — la carte de la méthode (method-map) à jour à chaque modif de méthode
type: feature
priority: P2
status: idea
pr:
created: 2026-07-16
---

# 0068 — Règle : method-map à jour à chaque modif de méthode

## Contexte / Problème

Le PO veut un **diagramme vivant** de la méthode, **mis à jour à chaque fois qu'elle change**
(skill, agent, règle, flux), incluant la **couche des événements émis** (méthode / contrat).
La carte est créée : `products/mega-city/docs/method-map.md` (2 couches Mermaid). Mais **un
diagramme vivant périme silencieusement** s'il n'est pas tenu — il faut une **règle enforced**,
pas une bonne intention.

## Proposition

À groomer. Formaliser la **règle d'équipe** :

> Toute PR qui modifie la méthode — un `SKILL.md`, un agent, une règle de `rules/`, ou le flux
> de sprint — **met à jour `docs/method-map.md` dans la même PR**.

- **Rangement** : une règle `rules/documentation-guidelines/method-map-a-jour.md` (format
  maison : `id / kind / level / enforcements[]`), **wirée à un bundle** (sinon elle n'est pas
  résolue — cf. le bug ezk-retro : ajouter au catalogue **et** au bundle, sous peine de casser
  les tests de complétude).
- **Critère mesurable / enforcement** : un check (CI ou hook) qui **échoue** si un diff touche
  `skills/**`, `agents/**`, `rules/**` **sans** toucher `docs/method-map.md`. `level: SHOULD`
  au départ (avertissement), `MUST` quand éprouvé.
- **Symptôme** : les diagrammes de méthode se désynchronisent du réel (douleur classique).

## Critères d'acceptation

- [ ] À définir au grooming (promotion `idea → todo`).

## Notes / décisions

- **Wiring obligatoire** (leçon de la session) : une règle/skill ajouté **doit** être
  catalogué **et** wiré à un bundle, sinon la CI casse (`catalog-readme.test`, `expand.test`).
- Candidate naturelle à passer par `ezk-retro` (c'est exactement une règle née d'un symptôme,
  mesurable). Compose : `rules/`, `bundles/`, la carte `docs/method-map.md`, ezk-retro (0063).
- Origine : session 2026-07-16 (demande PO de diagramme vivant de la méthode).
