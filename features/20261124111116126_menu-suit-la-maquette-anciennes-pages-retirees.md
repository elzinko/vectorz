---
id: "20261124111116126"
title: "Le menu de mission control suit la maquette : les anciennes pages sont retirées"
type: feature
priority: P2
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
blocked:
depends: ["20261124111115783", "20261124111115865", "20261124111115955", "20261124111116042"]
pr:
evidence: before-after
created: 2026-11-24
---

# 20261124111116126 — Le menu de mission control suit la maquette : les anciennes pages sont retirées

**En clair.** Le menu Projet garde cinq pages que la maquette a retirées : Pilotage, Cadrage,
Développement, Chronologie et Cartes. Leur contenu vit désormais dans les nouvelles pages Objectifs,
Sprints et Sessions. On retire ces cinq entrées et on range le menu dans l'ordre de la maquette.
Tu n'as plus deux endroits qui montrent la même chose.

**Si tu arrives frais.** Le menu de mission control a deux groupes depuis le 19 novembre :
« Global », puis « Projet · nom du projet ». Cette fiche ne touche que le groupe Projet. La
maquette est la référence d'écran choisie par le PO.

## Contexte / Problème

Le menu Projet compte aujourd'hui onze entrées, dans `products/cop1/packages/web/src/board/Board.tsx` :
Vue d'ensemble, Pilotage, Cadrage, Développement, Fiches, Chronologie, Process, Loi, Recettes,
Cartes, Configuration.

La [maquette](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP) range le groupe Projet ainsi :
Vue d'ensemble, Objectifs, Fiches, Sprints, Sessions, Rétros, Versions, Process, Loi,
Configuration, Recettes.

Chaque page retirée a sa remplaçante :

| Page retirée | Ce qu'elle montre | Où ça vit désormais |
|---|---|---|
| Pilotage | l'avancement par objectif, les sessions closes | Objectifs, Sessions |
| Cadrage | les lancements de cadrage récents | Sessions, fil d'une session |
| Développement | les lancements de développement | Sessions, fil d'une session |
| Chronologie | le journal, ligne par ligne | Sessions, fil d'une session |
| Cartes | les cartes et documents de la méthode | Carte de la méthode, dans Global ; la doc, dans Loi |

## Proposition

1. **Ranger le menu Projet** dans l'ordre de la maquette : Vue d'ensemble, Objectifs, Fiches,
   Sprints, Sessions, Rétros, Versions, Process, Loi, Configuration, Recettes.
2. **Retirer** Pilotage, Cadrage, Développement, Chronologie et Cartes, avec leur code et leurs
   tests. Git garde l'historique.
3. **Garder les liens vivants.** Un lien interne qui ouvrait une page retirée ouvre sa remplaçante.
   La fenêtre de détail d'un lancement reste joignable depuis le fil d'une session.
4. **Rétros.** L'entrée « Rétros » n'apparaît que lorsque sa page existe. Elle est portée par la
   fiche [Une page qui liste les rétros passées et leurs décisions](20260826072532537_vue-retros-actions-ezk-map.md).
5. **Le groupe Global ne change pas.** Le lien « v1 / archives » reste, comme décidé le 19 novembre.

## Critères d'acceptation

- [ ] Le menu Projet suit l'ordre de la maquette, sans entrée pour une page qui n'existe pas.
- [ ] Pilotage, Cadrage, Développement, Chronologie et Cartes ne sont plus dans le menu, et leur
      code est supprimé avec leurs tests.
- [ ] Aucun lien interne ne mène à une page retirée.
- [ ] Le détail d'un lancement s'ouvre depuis le fil d'une session.
- [ ] Les tests du menu décrivent le nouvel ordre.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/web exec vitest run src/board
grep -rn "'pilotage'\|'cadrage'\|'timeline'\|'maps'" products/cop1/packages/web/src/board --include=*.tsx
pnpm cop1:dev
```

La deuxième commande ne doit rien trouver hors des tests de non-régression. Dans mission control,
compare le menu Projet avec celui de la maquette.

## Glossaire

- **Remplaçante** : la nouvelle page qui montre ce que l'ancienne montrait.
- **Lancement** : le mot de l'écran pour un run.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette.
- Elle se construit en dernier : elle dépend des pages Versions, Objectifs, Sprints et Sessions.
- **À trancher au grooming** : l'ancienne carte de la page Cartes disparaît-elle, ou sa doc
  passe-t-elle dans Loi ? Le PO avait laissé la question ouverte. La maquette range la doc dans Loi.
