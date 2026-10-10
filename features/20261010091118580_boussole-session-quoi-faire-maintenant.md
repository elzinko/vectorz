---
id: "20261010091118580"
title: Boussole de session — une commande qui dit quoi faire maintenant
type: feature
priority: P2
product: mega-city
milestone:
version: v0.10.0
labels: [ergonomie-cli]
status: idea
pr:
evidence: none # commande CLI, pas d'écran
created: 2026-10-10
---

# 20261010091118580 — Boussole de session : quoi faire maintenant

**En clair.** On veut une commande qu'on tape quand on ne sait plus quoi faire, et qui répond
« voici 1 à 3 suites, vu où tu en es ». C'est le pendant **tiré** du bloc « Et maintenant ? »
que les skills **poussent** en fin de commande. Aujourd'hui, personne ne répond à la demande
« que faire maintenant, dans cet état ? ».

**Si tu arrives frais.** Le bloc « Et maintenant ? » est une règle de la méthode
([`next-step-affordance`](../products/mega-city/rules/documentation-guidelines/next-step-affordance.md)) :
une commande qui se termine propose la suite. `ezk-help` liste **toutes** les commandes qui
existent, pas « laquelle lancer ici ». `ezk-backlog next` donne la prochaine **fiche** à tirer,
pas la prochaine **action** de session.

## Contexte / Problème

- Le bloc « Et maintenant ? » n'est **poussé** que par 2 skills, et seulement si le modèle pense
  à le produire. Rien ne le **tire** sur demande.
- `ezk-help` = catalogue (« quelles commandes existent »). Il ne dit pas « quoi faire maintenant ».
- `ezk-backlog next` = prochaine fiche tirable, pas une boussole de session.
- Donc, en milieu de session ou en reprise, aucune commande ne répond « vu l'état, que faire ensuite ? ».
- Prior art BMAD : `/bmad-help` lit un catalogue d'ordre, regarde ce qui vient d'être produit, et
  recommande l'étape suivante. On garde l'idée (dire ce qui vient après), pas un moteur de menu
  (garde-fou ADR-0013).

## Proposition

Une commande **top-level `ezk-now`** (pas `ezk-next` : collision avec `ezk-backlog next` ; pas une
sous-commande de `ezk-backlog`, sinon on la ré-enferme dans le backlog) qui :

- lit **toujours** les traces du dépôt — dernier commit, `BACKLOG`, `PLAN.md`, `SPRINT.md`, journal —
  comme **socle déterministe** : la boussole répond même en session neuve ;
- **affine** avec le contexte de session quand il existe (« tu viens de groomer → `ready` »), sans
  jamais en dépendre ;
- tire « ce qui vient après » des **tables « Et maintenant ? »** des skills (colonne `quand` =
  l'état), **pas** du graphe compilé (cf. Décisions tranchées) ;
- rend **1 à 3 suites motivées**, au format `next-step-affordance` — le modèle rédige, aucun moteur
  de menu (ADR-0013).

## Décisions tranchées (groom 2026-10-10, avis `engineering:architecture`)

- **Nom → `ezk-now`.** Court, transversal, évoque « maintenant », aucune collision. Top-level, pas
  sous `ezk-backlog`. Écartés : `ezk-status` (évoque un état figé), `ezk-what-next` (verbeux).
- **Portée → le dépôt suffit toujours, la session est un bonus.** Les traces du dépôt sont le socle
  obligatoire (déterministes, présentes en session neuve) ; le contexte de chat affine mais n'est
  jamais requis. Plus robuste que « session d'abord ».
- **Source d'ordre → les tables « Et maintenant ? », pas le graphe.** Le graphe compilé (ADR-0040) a
  un jeu de verbes **fermé** et **structurel** (`compose`, `applique`…) ; il n'a aucun verbe de
  succession, et ne doit pas en avoir : l'ordre est **conditionnel à l'état** (« après `ready` →
  `next` »), ce qu'une arête statique ne capte pas, mais que la colonne `quand` des tables capte.
  `ezk-now` lit les tables + l'état ; le graphe reste structurel.
- **Couverture.** `ezk-now` n'est bon que là où les tables existent (2 skills aujourd'hui). Le socle
  [Un consommateur peut citer un bundle](20261008154803440_consommateur-cite-un-bundle.md)
  généralisera les tables à un groupe de skills ; la boussole en est la façade.
- **ADR.** Pas d'ADR maintenant (idea). Au **build**, ouvrir un ADR court sur la frontière « l'ordre
  vit dans les tables, pas dans le graphe fermé » — décision durable, susceptible d'être contestée
  (quelqu'un voudra ajouter un verbe `succède`).

## Critères d'acceptation (ébauche)

- [ ] Tapée sans contexte explicite, la commande rend 1 à 3 suites motivées adaptées à l'état.
- [ ] En session neuve (sans historique de chat), elle se fonde sur les traces du dépôt.
- [ ] Aucun conflit de nom avec `ezk-backlog next`.
- [ ] Elle ne réimplémente pas un moteur de menu : elle lit l'état et laisse le modèle rédiger.

## Comment vérifier

```bash
# Scénario : après un ship, tape la boussole → elle doit proposer la suite (reconcile / next / sprint)
# et non dérouler tout le backlog.
```

## Glossaire

- **boussole de session** — commande « que faire maintenant », pendant tiré du bloc poussé.
- **bloc « Et maintenant ? »** — la suite proposée en clôture d'une commande (règle
  `next-step-affordance`).

## Notes / décisions

- Née `idea` le 2026-10-10 (brainstorm PO). Priorité `P2` par alignement sur les autres idées de
  méthode — à confirmer par le PO.
- Dépend conceptuellement du socle [Un consommateur peut citer un bundle](20261008154803440_consommateur-cite-un-bundle.md)
  (v0.8.0) : à poser **après** lui.
- Voisine ergonomie CLI : [`next` nu montre la suite](20261009104436287_next-nu-montre-la-suite.md)
  (retouche `ezk-backlog next`, périmètre différent).
- Groom 2026-10-10 : technique « avis-architecte » jouée (nom / portée / source d'ordre tranchés,
  cf. « Décisions tranchées »). Statut inchangé (`idea`) — le gate `ready` reste à passer.
