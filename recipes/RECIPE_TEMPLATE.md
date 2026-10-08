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

## Ustensiles (outils — capacité d'abord)

Nomme la **capacité** (le verbe : « poser un DNS », « déposer un binaire »), puis **avec quoi**
la faire. Ordre de préférence ([ADR-0067](../products/mega-city/docs/adr/0067-outils-d-une-recette-capacite-mcp-local-ou-script.md)) :

1. **Un MCP qui existe déjà**, de préférence **local et installable** (Claude Desktop/Code) —
   dis lequel et quels verbes ; pas de clics, pas d'OAuth à redemander.
2. **Sinon un CLI / une API REST / un script** (`wrangler`, `vercel`, `gh`, `aws`, `cloudflared`…),
   authentifié **une fois** au trousseau, câblé par la CLI (`gh auth token`, `wrangler secret put`,
   `vercel env`), jamais par copier-coller manuel. « Pour le moment » est assumé : un repli, pas un échec.
3. **Si l'outil manque**, note-le comme **outil à créer**.

**Signale** un outil qui est un **connecteur cloud à OAuth de session** (se re-autorise à chaque
session, meurt hors session) : c'est un confort, pas une base portable d'un projet à l'autre. Un
MCP par **token** (sans OAuth interactif) est, lui, un cas sain.

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
