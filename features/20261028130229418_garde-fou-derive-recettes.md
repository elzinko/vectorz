---
id: "20261028130229418"
title: "Garde-fou de dérive des recettes déclarées (extension ezk-chef check / law doctor)"
type: feature
priority: P2
product: mega-city
milestone: recettes
version:
labels: [recettes, decouvrabilite, methode, derive]
depends: ["20261023120000001"]
status: idea
pr:
evidence: none # garde-fou de méthode ; preuve = un cas « déclaré absent » et un cas « installé non déclaré », testés
created: 2026-10-28
---

# 20261028130229418 — Garde-fou de dérive des recettes déclarées

## En clair

La commande `ezk recipes` (fiche 001) montre les recettes utilisables depuis un projet. Mais une
déclaration peut **mentir** avec le temps : une recette déclarée dont l'implémentation a disparu, ou
un outil bien présent que personne n'a déclaré. On veut un **garde-fou** qui signale ces deux dérives,
**en étendant** ce qui existe (`ezk-chef check`, `ezk law doctor`), pas un vérificateur neuf.

## Contexte / Problème

- La fiche sœur [001](done/20261023120000001_declarer-outils-recettes-methodes-projet.md) a livré la
  **découverte** (`ezk recipes`, lecture seule). Elle a laissé de côté (POC d'abord) le **contrôle de
  cohérence** : rien ne dit si une déclaration correspond encore au réel.
- Deux dérives à attraper : **« déclaré X, absent »** (une recette/outil déclaré dont le fichier source
  n'existe plus) et **« installé Y, non déclaré »** (un outil présent sous le projet, jamais déclaré).

## Proposition

À cadrer (groom + sans doute panel). Direction posée par le panel du 2026-10-27 et la fiche 001 :

- **Étendre** `ezk-chef check` (le gardien des recettes) et/ou `ezk law doctor` (ce qui est déclaré mais
  pas installé) — pas un 3ᵉ vérificateur.
- **« Installé »** se mesure par **présence de fichier sous une racine injectée**, jamais via le `PATH`
  (sinon test flaky, non reproductible).
- Réutiliser les primitives de 002 (`declaredRecipe`, `indexedRecipe`) et le scan de 001.

## Critères d'acceptation

- [ ] Un cas **« déclaré X, absent »** est détecté et nommé (`fichier:ligne`), testé.
- [ ] Un cas **« installé Y, non déclaré »** est détecté et nommé, testé.
- [ ] « Installé » = présence de fichier sous une racine **injectée** (aucune lecture du `PATH`).
- [ ] Le contrôle est une **extension** d'une commande existante (`ezk-chef check` / `ezk law doctor`),
      pas un vérificateur neuf.
- [ ] Gate locale verte.

## Comment vérifier

- Sur un projet-fixture : une recette déclarée dont le `source:` pointe un fichier absent → signalée.
- Un outil présent (fichier sous la racine) non déclaré → signalé. Rien d'autre n'est modifié.

## Notes / décisions

- **Origine** : critère 5 de la fiche [001](done/20261023120000001_declarer-outils-recettes-methodes-projet.md),
  différé à la livraison du POC `ezk recipes` (2026-10-28, revue `ezk-reviewer` GO). Séparé pour que 001
  ship proprement sur la découverte seule.
- **Statut idea assumé** : à groomer (le choix `ezk-chef check` vs `law doctor` est une décision de
  structure). Ne pas forcer `ready` sans cadrage.
