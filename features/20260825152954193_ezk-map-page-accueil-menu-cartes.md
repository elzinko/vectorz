---
id: "20260825152954193"
title: Page d'accueil ezk:map — un menu des cartes (naviguer sans relancer le serveur)
type: feature
priority: P3
product: mega-city
version:
epic:
depends: []
labels: [ezk-map, ux]
status: idea
ready:
pr:
created: 2026-08-25
---

# Page d'accueil `ezk:map` : un menu des cartes

## En clair

`pnpm ezk:map <slug>` ouvre **une** carte (domaine, méthode, avancement, qualité…). Pour passer
à une autre, il faut **relancer la commande**. Il manque une **page d'accueil web** : quand on
lance `ezk:map` sans argument (ou qu'on va sur `/`), une page qui **liste les cartes en liens
cliquables**, pour naviguer de l'une à l'autre **sans relancer** le serveur.

Petit confort, gros gain d'usage : un seul serveur, toutes les cartes à portée de clic.

## Contexte / Problème

`bin/ezk-map.ts` sert déjà **toutes** les cartes de `diagrams/` (un serveur, une URL par carte)
et sait les lister (`--list` en CLI). Mais côté navigateur, **pas de page d'index** : `ezk:map
avancement` ouvre le board, et pour voir la carte du domaine il faut refaire `ezk:map
domaine-mega-city`. Retour PO (2026-08-25) : « ça évite de démarrer trop de choses séparément ».

## Proposition (à groomer)

- Une **route `/`** (page d'accueil) dans `bin/ezk-map.ts` qui rend `listDiagrams()` en HTML :
  chaque carte = un lien vers son entrée, avec son titre lisible (depuis `meta.yaml`/`description.md`).
- `pnpm ezk:map` **sans argument** ouvre cette page d'accueil (au lieu de la carte par défaut) — ou
  garde le défaut + ajoute un lien « ← toutes les cartes » sur chaque carte (à trancher).
- Zéro dépendance (même patron que le serveur actuel).

## Critères d'acceptation (brouillon)

- [ ] `pnpm ezk:map` (sans slug) ouvre une page listant toutes les cartes en liens cliquables.
- [ ] Depuis une carte, on revient au menu sans relancer la commande.
- [ ] Les titres viennent des fichiers (meta/description), pas écrits à la main.
- [ ] Gate locale verte.

## Comment vérifier

`pnpm ezk:map` → la page d'accueil liste domaine / méthode / avancement / qualité… ; cliquer une
carte l'ouvre ; un lien ramène au menu.

## Notes

⚠️ Réunir l'**accès** (un menu), **pas** fusionner les vues : la carte du domaine (structure) et le
board d'avancement (flux) restent **deux vues séparées** (décision PO 2026-08-23). Origine : retour
PO du 2026-08-25.
