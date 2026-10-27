---
id: "20261023120000001"
title: "Déclarer et rendre découvrables les outils, recettes et méthodes d'un projet"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, cli]
depends:
status: idea
pr:
evidence: none # capacité de méthode (manifeste de projet) ; preuve = tests + démo de découverte
created: 2026-10-23
---

# 20261023120000001 — Déclarer les outils, recettes et méthodes d'un projet

## En clair

Les outils et recettes de la méthode (`ezk-secret`, les skills `ezk-*`) sont installés globalement
depuis vectorz. Un projet qui les utilise ne les **déclare nulle part**. Une nouvelle session, ou un
humain, doit les **deviner** au lieu de les lire dans un manifeste du projet. On veut un mécanisme
pour qu'un projet déclare ce dont il dispose, pour qu'agents et humains le trouvent du premier coup.
Sujet d'architecture : à groomer avec un panel.

## Si tu arrives frais

Un **outil** = du code déjà fait, à **intégrer** (ex. `ezk-secret`). Une **recette** = une procédure à
**lancer** (un skill, un runbook). Les deux manquent d'un point de déclaration au niveau du projet, et
pourraient se déclarer différemment.

## Contexte / Problème

- **Symptôme vécu (2026-10-18, projet muti)** : pour notariser un build beta, une session a dû deviner
  l'existence de `ezk-secret` (via les commentaires de `secrets.yaml` et `ezk help`), faute de
  déclaration dans le projet. Elle a même commencé par inventer un `.env.beta.local` hors convention
  avant d'être recadrée.
- **Ce qui existe** : `ezk` est une CLI de méthode liée **globalement**. Les skills `ezk-*` sont
  globaux. Un projet hôte porte déjà des déclarations partielles et éparses : `CLAUDE.md`, la mémoire
  de l'agent, `secrets.yaml`, `.rules/`, l'index `ezk-help`.
- **Le manque** : aucun **manifeste** au niveau du projet ne recense « les outils, recettes et méthodes
  disponibles ici, leur source, et comment les lancer ». La découverte repose sur la convention et la
  mémoire, pas sur un fichier lisible.

## Proposition

> Trois voies, à départager en panel (sujet d'architecture). La recommandation ci-dessous **prépare**
> la décision ; elle ne la tranche pas. La fiche reste `idea` tant que le panel n'a pas statué — ne
> pas forcer `ready`.

**Principe posé dès maintenant.** *Déclarer* (bon marché, rend la découverte possible) vient avant
*extraire* (sortir le code en librairie, ADR-0015, au 2e consommateur). On déclare tout de suite ; on
extrait plus tard.

**Où vit la déclaration ?**

| Voie | Idée | Pour | Contre |
|---|---|---|---|
| **(a) Manifeste dédié** | un fichier propre, ex. `.vectorz/recipes.yml` (nom, source, comment lancer), lu par une commande `ezk` de découverte | explicite ; un seul endroit ; versionné avec le repo ; extensible | un fichier de plus ; risque de dériver du réel (déclaré ≠ installé) |
| **(b) Étendre `config.yml`** | une section `recipes:` dans `.vectorz/config.yml` que `ezk config` lit déjà | pas de nouveau fichier ; `ezk config show` l'affiche ; une seule porte de config (ADR-0062) | mêle config (comportement) et catalogue (découverte) ; `config.yml` grossit |
| **(c) Dérivation auto** | aucune déclaration : `ezk` scanne le réel (skills installés, `secrets.yaml`, `.rules/`) et génère le catalogue à la volée | jamais périmé ; rien à maintenir ; « déclaré = réel » par construction | rate l'intention projet (« ici on utilise X pour Y ») et le « comment lancer » propre au projet ; ne distingue pas outil/recette sans heuristique |

**Choix recommandé : (a) + un garde-fou (c).** Un manifeste dédié porte l'**intention** du projet (ce
qu'il utilise, comment le lancer) ; la commande de découverte le lit **et signale la dérive** contre le
réel installé (« déclaré X, absent » / « installé Y, non déclaré »). On gagne l'intention de (a) et la
fraîcheur de (c). La voie (b) est écartée : un catalogue de découverte n'est pas de la config de
comportement ; les mêler alourdit `config.yml` et brouille deux rôles.

**À relier à la sœur.** Le manifeste doit partager son schéma avec le
[contrat de recette auto-déclarée](20261023120000002_contrat-recette-autodeclaree.md) : une recette se
déclare une fois, le manifeste la liste. L'ADR s'ouvre quand le panel tranche la voie et le schéma.

## Critères d'acceptation

Niveau *idée* — la cible, à préciser au grooming/panel.

- [ ] Un projet porte un **manifeste** déclarant ses outils et recettes disponibles (nom, source,
      comment lancer).
- [ ] Une nouvelle session **découvre** ces outils/recettes en lisant le manifeste, sans deviner.
- [ ] La distinction **outil** (à intégrer) vs **recette** (à lancer) est portée par la déclaration.
- [ ] Gate locale verte.

## Comment vérifier

- Depuis un projet neuf, une session lit le manifeste et nomme les outils/recettes disponibles sans
  les deviner.

## Notes / décisions

- **Origine** : rédigée dans le projet **muti** le 2026-10-18 (fiche `muti:features/20261018084803445_declarer-outils-recettes-methodes-projet.md`),
  mais c'est de la **méthode (vectorz)**. Rapatriée ici le 2026-10-23 pour la milestone `recettes`. La
  fiche muti reste le constat d'origine côté hôte ; **ne pas** la déplacer ni la modifier (des sessions
  muti y travaillent).
- Milestone `recettes` (découvrabilité), sœur de [Contrat de recette auto-déclarée](20261023120000002_contrat-recette-autodeclaree.md).
- **Statut idea assumé** : sujet d'architecture, à groomer en panel (ne pas forcer `ready`).
- **2026-10-27 : groomée (avis-architecte).** Trois voies posées dans la Proposition — manifeste dédié
  (a) / étendre `config.yml` (b) / dérivation auto (c) —, compromis et choix recommandé : (a) + garde-fou
  de dérive (c). Reste `idea` : le panel tranche la voie et le schéma du manifeste.
