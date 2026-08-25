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
status: shipped
ready: 2026-08-25
pr: "#170"
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

## Proposition (groomée 2026-08-25)

**Décision : la page d'accueil devient le point d'entrée. Le retour au menu passe par le bouton
« Précédent » du navigateur — zéro code en plus.**

- **Route `/`** dans `products/mega-city/bin/ezk-map.ts` : rend `listDiagrams()` en HTML. Une carte
  = un lien cliquable vers son entrée (`/diagrams/<slug>/<entry>`), libellé par son **titre lisible**.
- **`pnpm ezk:map` sans argument ouvre `/`** (le menu), au lieu de la carte méthode. La carte méthode
  (`methode-mega-city`) reste **listée en tête** (mise en avant) — un clic pour l'ouvrir.
- **Revenir au menu = « Précédent » du navigateur.** On part du menu (`/`), on clique une carte, on
  revient d'un Précédent, sans relancer la commande. Un lien « ← cartes » injecté dans les pages HTML
  servies serait un plus, mais **hors MVP** (touche le rendu des cartes).
- **`pnpm ezk:map <slug>`** garde l'ouverture directe d'une carte (**inchangé**).
- **Zéro dépendance** : le titre est lu par un **balayage de ligne** du `meta.yaml`, pas de lib YAML.

**⚠️ Titre lisible — deux clés coexistent.** Les `meta.yaml` ne sont pas homogènes :

    diagrams/domaine-mega-city/meta.yaml  →  titre: …   (français)
    diagrams/avancement/meta.yaml         →  title: …   (anglais)

Le menu **tolère les deux** (`title:` ou `titre:`) et **retombe sur le slug** si aucun n'est présent.
Pas de migration de données requise ; normaliser les `meta.yaml` reste un chantier séparé et optionnel.

## Critères d'acceptation

- [ ] `pnpm ezk:map` (sans slug) ouvre `/` : la liste de **toutes** les cartes en liens cliquables.
- [ ] Chaque lien est libellé par le **titre** du `meta.yaml` (clé `title:` **ou** `titre:`), slug en secours.
- [ ] La carte méthode (`methode-mega-city`) apparaît **en tête** du menu.
- [ ] Depuis une carte ouverte via le menu, « Précédent » ramène au menu **sans relancer** la commande.
- [ ] `pnpm ezk:map <slug>` ouvre toujours la carte directement (comportement **inchangé**).
- [ ] **Zéro nouvelle dépendance** (titre lu par balayage de ligne).
- [ ] Gate locale verte (typecheck/lint/tests) et liens markdown OK (`test-links-repo.sh`).

## Comment vérifier

`pnpm ezk:map` → la page d'accueil liste domaine / méthode / avancement / qualité… ; cliquer une
carte l'ouvre ; un lien ramène au menu.

## Notes

⚠️ Réunir l'**accès** (un menu), **pas** fusionner les vues : la carte du domaine (structure) et le
board d'avancement (flux) restent **deux vues séparées** (décision PO 2026-08-23). Origine : retour
PO du 2026-08-25.
