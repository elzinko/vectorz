---
id: "20261126170000115"
title: "Le bouton « + Ajouter » de la page Recettes montre la commande d'ajout"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control, recettes]
status: ready
blocked:
depends: ["20261126170000114"]
pr:
evidence: before-after
created: 2026-11-26
---

# 20261126170000115 — Le bouton « + Ajouter » de la page Recettes montre la commande d'ajout

**En clair.** La maquette montre un bouton « + Ajouter » sur chaque recette prête et pas encore ajoutée.
La page Recettes livrée le 26 novembre l'a écarté, faute de geste côté méthode. Une fois la commande d'ajout
livrée, le bouton apparaît et montre cette commande, comme « Lancer » sur la Vue d'ensemble. Mission control
ne lance rien lui-même.

**Si tu arrives frais.** Mission control lit ce que la méthode publie et n'exécute pas ses commandes (ADR-086).
`CommandHint` est le composant qui montre une commande à lancer, en infobulle et en statut, sans l'exécuter.
Demande du PO du 2026-11-26, relayée par la session pilote.

## Contexte / Problème

La page Recettes (fiche 20261126170000111) liste le catalogue et les recettes du projet, avec « Ajoutée » ou
« Incomplète ». Le bouton « + Ajouter » de la maquette (capture `12-recettes-maquette.png`) manque : la méthode
n'avait pas de geste d'ajout. La fiche « Une commande de la méthode ajoute une recette du catalogue au projet »
le crée.

## Proposition

1. Sur chaque recette **prête** et **pas encore ajoutée**, un bouton « + Ajouter ».
2. Le clic montre la commande `ezk recipes add <id>` avec `CommandHint` (infobulle + statut), comme « Lancer »
   sur la Vue d'ensemble. Le web n'exécute rien.
3. Une recette en brouillon ou déjà ajoutée n'a pas de bouton.

## Critères d'acceptation

- [ ] Le bouton « + Ajouter » apparaît sur une recette prête non ajoutée, et sur elle seule.
- [ ] Le clic montre `ezk recipes add <id>` sans rien exécuter ; un test le vérifie.
- [ ] Une fois la commande lancée et la page relue, la recette affiche « Ajoutée » et le bouton disparaît.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Recettes : http://localhost:5274 → menu Recettes

## Hors périmètre

- Lancer la commande depuis l'écran (un geste d'écriture côté daemon serait une autre décision).

## Notes / décisions

- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Le port de l'app est 5274.
