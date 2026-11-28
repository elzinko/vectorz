---
id: "20261128094701670"
title: "Objectifs : une recherche, et des gestes en mots sur chaque objectif et chaque fiche à faire"
type: feature
priority: P3
product: cop1
milestone: board
version:
labels: [theme:mission-control, objectifs]
status: ready
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-28
---

# 20261128094701670 — Objectifs : une recherche, et des gestes en mots sur chaque objectif et chaque fiche à faire

**En clair.** Dans la liste des objectifs, les actions se cachent derrière un bouton « ⋯ » et il n'y a pas
de recherche. La maquette écrit les gestes en mots : « Groomer ses fiches », « Voir ses fiches », « Ouvrir
l'objectif ». On les affiche ainsi, et on ajoute la recherche.

**Si tu arrives frais.** Un objectif regroupe des fiches (le champ `milestone` de chaque fiche). Groomer,
c'est faire mûrir une idée jusqu'à ce qu'elle soit prête. Mission control ne lance aucune commande : il la
montre (`CommandHint`). La maquette est la référence d'écran du PO : pages « Objectifs » et « Un
objectif ».

## Contexte / Problème

Décision du PO en relecture de maquette (5 novembre) : jamais de commande affichée comme action, des
boutons en mots. La liste des objectifs de l'app n'a qu'un menu « ⋯ » par ligne. Sur la page d'un
objectif, les fiches à faire n'ont pas de geste, alors que la maquette propose « Groomer » ou « Parker ».

## Proposition

1. **Recherche** « Rechercher un objectif… » au-dessus du tableau, et le compte « N résultats ».
2. **Colonne Actions** : « Groomer ses fiches » (montre la commande), « Voir ses fiches » (ouvre Fiches
   filtrée sur l'objectif), « Ouvrir l'objectif ». Le menu « ⋯ » disparaît.
3. **Page d'un objectif** : sur chaque fiche à faire, « Groomer » pour une idée, « Parker » pour une fiche
   bloquée. Le clic montre la commande, sans rien exécuter.
4. Les commandes montrées existent dans la liste publiée par la méthode ; un test le vérifie.

## Critères d'acceptation

- [ ] La recherche réduit la liste des objectifs sur l'identifiant et le nom.
- [ ] Chaque ligne porte les trois gestes en mots ; « Voir ses fiches » ouvre Fiches filtrée sur cet
  objectif.
- [ ] Sur la page d'un objectif, une idée propose « Groomer » et une fiche bloquée « Parker » ; le clic
  montre la commande.
- [ ] Un test vérifie que chaque commande montrée existe côté méthode.
- [ ] Capture avant / après jointe.

## Comment vérifier

- vue Objectifs : http://localhost:5274 → Objectifs
- `pnpm --dir products/cop1/packages/web exec vitest run`

## Notes / décisions

- 2026-11-28 — Fiche née de la comparaison maquette ↔ app demandée par le PO.
- 2026-11-28 — Contrôle « prête » (ezk-pm) : GO. Un geste sans commande publiée par la méthode est masqué.
