---
id: "20261128111349528"
title: "`ezk recipes add` refuse d'écrire hors d'un projet"
type: feature
priority: P3
product: mega-city
milestone: qualite
version:
labels: [recettes]
status: idea
blocked:
depends: []
pr:
evidence: none # une commande, aucun écran
created: 2026-11-28
---

# 20261128111349528 — `ezk recipes add` refuse d'écrire hors d'un projet

**En clair.** Lancée d'un dossier quelconque, la commande d'ajout de recette écrit quand même son fichier
sur place. Les autres commandes qui écrivent refusent un dossier qui n'est pas un projet. On aligne
celle-ci : refus net, sans rien écrire.

## Contexte / Problème

Relevé par la revue adverse du 28 novembre sur la fiche « Une commande de la méthode ajoute une recette du
catalogue au projet ». `ezk recipes add <id>`, sans `--root`, écrit `.vectorz/recipes/<nom>/RECIPE.md` dans
le dossier courant, même si ce n'est pas un projet. Le dégât est faible : rien n'est détruit et le chemin
écrit est annoncé. Mais c'est incohérent avec le reste de la méthode.

## Proposition

La commande vérifie que le dossier visé est un projet, comme les autres commandes qui écrivent. Sinon elle
refuse, avec une phrase et un code de sortie non nul, sans rien écrire.

## Critères d'acceptation

- [ ] Dans un dossier qui n'est pas un projet, la commande refuse avec une phrase claire et n'écrit rien.
- [ ] Dans un projet, elle écrit comme aujourd'hui.
- [ ] Un test de script couvre les deux cas.

## Comment vérifier

- `bash products/mega-city/bin/test-ezk-recipes-add.sh`

## Notes / décisions

- 2026-11-28 — Fiche de suite demandée par ezk-pm au checkpoint du sprint 29.
