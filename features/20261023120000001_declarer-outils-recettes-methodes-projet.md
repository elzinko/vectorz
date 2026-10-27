---
id: "20261023120000001"
title: "Déclarer et rendre découvrables les outils, recettes et méthodes d'un projet"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, cli]
depends: ["20261023120000002"]
status: idea
pr:
evidence: none # capacité de méthode (manifeste de projet) ; preuve = tests + démo de découverte
created: 2026-10-23
---

# 20261023120000001 — Déclarer les outils, recettes et méthodes d'un projet

## En clair

Une **recette** de méthode est déjà un objet qui existe : un dossier `recipes/<nom>.md` avec son
front-matter, listé dans `recipes/RECIPES.md` (auto-généré), gouverné par le skill `ezk-chef`. Le trou
n'est donc **pas** « déclarer » — c'est **découvrir**, depuis l'intérieur d'un projet hôte, quelles
recettes et quels outils globaux (`ezk-secret`…) s'appliquent ici, sans deviner. Panel du 2026-10-27 :
**pas de nouveau manifeste** (ce serait un doublon de `recipes/`). Reste `idea` : à re-cadrer, et après
la sœur 002.

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

**Panel adverse du 2026-10-27, 3 voix : NO-GO sur la voie initiale (un manifeste `.vectorz/recipes.yml`).**
Le fait qui tranche : la primitive « recette » **existe déjà et est livrée**, et l'incident fondateur
portait sur une recette **qui existait**.

### Ce que le panel a trouvé dans le code

- `recipes/<nom>.md` porte un front-matter de déclaration (`src/core/recipe-frontmatter.ts` :
  id/title/makes/source/composes/status/home) ; `recipes/RECIPE_TEMPLATE.md` déclare déjà les
  **Ustensiles** (outils + comment les lancer) et les **Ingrédients** (secrets) ; `bin/regen-recipes.sh`
  génère le **catalogue** `recipes/RECIPES.md` ; le skill `ezk-chef` (list/check/regen) le gouverne.
- La voie (c) pour les **outils** est déjà construite : `src/loaders/tools.ts` (ADR-0058) dérive le
  catalogue d'outils du réel (`bin/*`, `skills/<s>/scripts/*`).
- **Clincher** : l'incident muti (2026-10-18, « deviner `ezk-secret` ») portait sur
  [`recipes/secrets-trousseau.md`](../recipes/secrets-trousseau.md), **status `ready` depuis le
  2026-10-03** (avant l'incident), dont le champ `makes:` nomme littéralement `ezk-secret` et
  `secrets.yaml`. Ce n'était pas une primitive manquante : c'était un échec de **découverte** d'une
  recette existante.

Créer un `.vectorz/recipes.yml` + un 2ᵉ catalogue serait le doublon `needs-design:` vs `blocked:` du
panel précédent : une 2ᵉ surface de listing, au nom qui percute l'existante, et un fichier statique qui
pourrit (la dérive annoncée). La voie (b) reste écartée (`config.yml` = porte de **comportement**, pas
un catalogue).

### La voie retenue (re-cadrage)

- **Pas de nouveau fichier.** On réutilise la primitive recette (`recipes/` + `ezk-chef` + `tools.ts`).
- Le vrai cœur = **la découverte depuis un projet hôte** : une commande terminal en lecture seule
  (`ezk recipes`, autonome — pas greffée sur `ezk now`) qui montre, depuis la racine d'un projet, ses
  recettes applicables **et** les outils globaux pertinents (`ezk-secret`…). Aujourd'hui `ezk-chef` est
  un skill chat sans domaine CLI ; la découverte terminal côté projet hôte manque.
- **Garde-fou de dérive** = **extension** de `ezk-chef check` / `law doctor`, pas un vérificateur neuf :
  « déclaré X, absent » / « installé Y, non déclaré ». « Installé » se mesure par **présence de fichier
  sous une racine injectée** (jamais via le `PATH` — sinon test flaky).

### Ordre corrigé — 002 AVANT 001

La déclaration ([002](20261023120000002_contrat-recette-autodeclaree.md) : un dossier se déclare recette,
`RECIPE.md` en place) est l'**atome** ; le catalogue / la découverte (001) en **dérive**. La dépendance
était inversée (`002 depends: 001`) : corrigée en **`001 depends: 002`**. On rend 002 tirable d'abord.

## Critères d'acceptation

> Re-cadrés par le panel. 001 ne devient `ready` qu'après 002 (`depends:`), et sur un arbitrage PO.

- [ ] La fiche réutilise la primitive recette existante (`recipes/`, `recipe-frontmatter.ts`,
      `regen-recipes.sh`, `RECIPES.md`, `ezk-chef`, `tools.ts`) — **aucun nouveau format de catalogue**.
- [ ] Depuis la racine d'un **projet hôte**, une surface terminal en lecture seule nomme ses recettes
      applicables + les outils globaux pertinents, **sans deviner**. Preuve : rejeu du cas muti
      (`ezk-secret` trouvé sans inventer de `.env*`).
- [ ] Le garde-fou de dérive est une **extension** de `ezk-chef check` / `law doctor` (« déclaré X,
      absent » / « installé Y, non déclaré »), « installé » mesuré par présence de fichier sous une
      racine injectée. Un cas de chaque, testé.
- [ ] La distinction **outil** (à intégrer) vs **recette** (à lancer) est portée par la primitive
      existante (Ustensiles vs dossier recette), pas par un schéma concurrent.
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
- **2026-10-27 : groomée (avis-architecte).** Trois voies posées — manifeste dédié (a) / étendre
  `config.yml` (b) / dérivation auto (c) —, choix alors recommandé (a) + garde-fou (c). **Renversé par
  le panel le même jour (voir ci-dessous).**
- **2026-10-27 : panel adverse (3 voix) → NO-GO sur un manifeste neuf.** Fait décisif : la primitive
  recette existe (`recipes/` + `ezk-chef` + `tools.ts`), et l'incident muti portait sur une recette
  déjà `ready` (`recipes/secrets-trousseau.md`, 2026-10-03). Le trou est la **découverte depuis un
  projet hôte**, pas une primitive manquante. Voie retenue : réutiliser la primitive + une surface de
  découverte terminal (`ezk recipes`) + étendre `ezk-chef check` / `law doctor` pour la dérive.
  Dépendance **inversée** : `001 depends: 002` (002, l'auto-déclaration, passe avant). Reste `idea` :
  re-cadrée, pas tirable tant que 002 n'est pas fait — arbitrage PO.
