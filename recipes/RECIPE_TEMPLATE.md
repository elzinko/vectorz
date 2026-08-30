<!--
Gabarit de recette (fiche 20260824185422122, D2 + apport PO 2026-08-26 « analogie cuisine »).
Copie ce fichier vers `recipes/<slug>.md` (ou `home: project` → près du code source, indexé
depuis ici par pointeur) et remplis chaque section. Les rubriques nommées par l'analogie
cuisine RESTENT ce format normalisé — elles ne le remplacent pas, elles nomment ses cases.
Gardien : `ezk-chef` (products/mega-city/agents/ezk-chef.md), bundle `rules/recipe/*`.
-->
---
id: "AAAAMMDDHHMMSSmmm" # id horodaté minté — skills/ezk-backlog/scripts/mint-id.sh
title: Titre lisible de la recette
makes: Une ligne — ce que la recette fabrique
source: ~/git/... # racine de l'implémentation PROUVÉE (jamais de code copié — ADR-0013)
composes: [] # rules composées (idiome ADR-0012/0025), ex. [dns-ionos]
profile: # optionnel — profil référencé
status: draft # draft | ready | ... — source de vérité
home: central # central (par défaut, D4) | project (fortement couplé au code d'un dépôt vivant)
created: AAAA-MM-JJ
updated: AAAA-MM-JJ
---

## En clair

1 à 3 phrases : le problème résolu, l'idée en langage simple, ce que le lecteur en retire.
Pas de jargon interne non défini ici.

## Ingrédients (prérequis)

Ce qu'il faut **avoir** avant de commencer — comptes, **secrets**, variables d'environnement
(ex. compte R2, `R2_PUBLIC_URL`, token Vercel, nom de domaine). Pas les outils qui exécutent
(ça, c'est la section Ustensiles) : ici, ce qu'on possède.

## Ustensiles (outils — CLI d'abord)

Les **CLI** qui font le travail (`wrangler`, `vercel`, `gh`, `cloudflared`…). Principe : on
pilote les fournisseurs **par leur CLI**, jamais par des clics. Les secrets se récupèrent et
se câblent **par la CLI** (`gh auth token`, `wrangler secret put`, `vercel env`), pas par
copier-coller manuel.

## Préliminaires (gestes manuels ⚙️)

Ce qui **ne s'automatise pas** : créer un compte, valider un paiement, s'inscrire à une API.
Marqués ⚙️ dans la checklist des étapes ci-dessous. Un geste sans CLI = un préliminaire.

## Le concept (mécanisme + schéma)

L'architecture en un **schéma texte** (pas de prose seule pour un mécanisme — petit diagramme
ASCII, flux, ou séquence).

## Exemples pour goûter (référence)

L'implémentation **prouvée** (le `source:` du front-matter) + un run d'exemple si possible.
Pointeur, jamais copie.

## Les étapes (playbook)

Suite **tâche-après-tâche**, numérotée. Marquer ⚙️ les gestes manuels (Préliminaires) au
milieu du flux quand ils s'intercalent avec les étapes automatiques.

1. …
2. …

## Checklist « rien d'oublié »

- [ ] …

## Fichiers de référence (entonnoir — pointer, jamais copier)

Racine : **`<source:>`**

- `fichier:ligne` — ce que ça montre
- `fichier:ligne` — ce que ça montre

## Statut de cette recette

Capturée le AAAA-MM-JJ (déclenchée par …). Emplacement (`home:`) et statut à jour dans le
front-matter — cette section porte le contexte narratif (pourquoi, par qui, limites connues).
