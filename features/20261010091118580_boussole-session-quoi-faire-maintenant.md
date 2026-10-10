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

## Proposition (esquisse — à groomer)

Une commande (nom à trancher, **pas `ezk-next`** : collision avec `ezk-backlog next`) qui :

- lit le **contexte de session** quand il existe (ce qu'on vient de faire dans le fil) ;
- se rabat sur les **traces du dépôt** comme filet quand la session est neuve ou son contexte a
  été résumé : dernier commit, état du backlog, `SPRINT.md`, journal ;
- s'appuie sur une **source d'ordre** pour savoir ce qui suit : les tables « Et maintenant ? »
  déjà portées par les skills, ou un graphe de la méthode ;
- rend **1 à 3 suites motivées**, au format `next-step-affordance`.

## Décisions ouvertes (à trancher au groom)

- **Nom** de la commande (hors `ezk-next`).
- **Portée de lecture** : session + dépôt sont complémentaires, pas exclusifs — à confirmer.
- **Source d'ordre** : réutiliser les tables « Et maintenant ? » des skills, ou compiler un graphe.
- **Lien avec le socle** : la base commune de règles héritée par un groupe de skills
  ([Un consommateur peut citer un bundle](20261008154803440_consommateur-cite-un-bundle.md))
  rendrait le bloc « Et maintenant ? » fiable partout ; la boussole en serait la façade.

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
