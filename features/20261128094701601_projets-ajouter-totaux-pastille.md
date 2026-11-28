---
id: "20261128094701601"
title: "La page Projets porte « Ajouter un projet », les totaux depuis le début et la pastille d'alertes"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control, projets]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701601 — La page Projets porte « Ajouter un projet », les totaux depuis le début et la pastille d'alertes

**En clair.** La page Projets de la maquette a trois choses que l'app n'a pas : un lien « Ajouter un
projet » dans l'en-tête, les totaux de tous les projets, et une pastille d'alertes sur chaque projet. On
les ajoute, avec les données déjà publiées.

**Si tu arrives frais.** Mission control est l'écran de cop1. Il lit ce que la méthode publie et n'invente
rien (ADR-086). La cloche de l'en-tête liste les alertes d'un projet (`ezk now --json`). La maquette est
la référence d'écran du PO : page « Accueil — tous les projets ».

## Contexte / Problème

Pour ajouter un projet, il faut aujourd'hui ouvrir le sélecteur de projet. La page Projets ne dit pas non
plus combien d'alertes attend chaque projet : il faut entrer dans chacun et ouvrir la cloche.

## Proposition

1. **En-tête** : un lien « Ajouter un projet » ouvre l'assistant d'ajout existant.
2. **Totaux** : à droite du titre, « Depuis le début : N livrées · N sprints · N rétros », somme des projets
   affichés. Le survol dit le détail par projet. Un projet qui ne publie pas un compte ne compte pas pour
   zéro : le total porte un « + » et le survol dit lequel manque.
3. **Pastille d'alertes** : à côté du nom de chaque projet, le nombre d'alertes publiées pour lui. Sans
   alerte, pas de pastille. Un clic ouvre la vue d'ensemble du projet.
4. **Liens des tuiles** : « fiches prêtes » et « bloquées » ouvrent la page Process du projet ; « livrées
   depuis … » ouvre Versions.

## Critères d'acceptation

- [ ] « Ajouter un projet » ouvre l'assistant d'ajout depuis la page Projets.
- [ ] Les totaux somment les comptes publiés ; un compte non publié donne un « + », jamais un zéro.
- [ ] La pastille d'un projet affiche son nombre d'alertes publiées, et rien quand il n'y en a pas.
- [ ] Les tuiles mènent aux pages de la maquette.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Projets : http://localhost:5274 → menu Projets
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. La pastille lit les alertes publiées de chaque projet par le daemon ; sans alerte publiée, pas de pastille, jamais un « 0 ».
