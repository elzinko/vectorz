---
id: "20261029093423195"
title: "Suggérer les recettes à implémenter par projet, et les visualiser dans le dashboard"
type: feature
priority: P1
product: mega-city
milestone:
version:
labels: [recettes]
status: idea
pr:
created: 2026-10-29
---

# 20261029093423195 — Suggérer les recettes à implémenter par projet, et les visualiser dans le dashboard

**En clair.** On a un stock de recettes (distribution R2, licence Pro Lemon Squeezy, CI type
muti, logs + remontée de bug, secrets au trousseau, badge de version…). Mais rien ne dit, pour
un projet donné, **lesquelles il gagnerait à implémenter**, ni **lesquelles il a déjà**. On veut
un mécanisme qui suggère les recettes pertinentes par projet, et un affichage dans le nouveau
dashboard : la liste de toutes les recettes, et la liste des recettes installées par projet. Une
maquette d'abord.

**Si tu arrives frais.** Une recette, c'est un pattern réutilisable documenté (`recipes/*.md`).
« Installée dans un projet », c'est que le projet applique ce pattern.

## Contexte / Problème

- **Le complément de `ezk-chef scan`.** La fiche [Scanner tes anciens dépôts pour proposer des
  skills](0147-ezk-recipy-mvp.md) (devenue `ezk-chef scan`) **découvre** de nouvelles recettes
  depuis du vieux code. Ici, c'est l'**inverse complémentaire** : rapprocher les recettes **qui
  existent déjà** d'un projet, et dire lesquelles implémenter. Décision PO du 2026-10-29 : une
  fiche distincte, pas un enrichissement de 0147.
- **Cas concret, fait à la main.** Pour samplerz, au moins six recettes s'appliquent :
  distribution R2, Lemon Squeezy Pro, CI type muti, logs + remontée de bug, secrets trousseau,
  badge de version. Ce rapprochement a été fait à la main le 2026-10-29 — c'est exactement ce
  qu'on veut outiller.
- **Le dashboard.** Le « nouveau dashboard » visé est la fiche [Unifier les tableaux de bord en
  un seul](20261007135620590_refondre-vue-supervision-moniteur-lisible.md). On y afficherait
  deux vues : le catalogue de toutes les recettes, et l'adoption par projet.

## Pistes (à cadrer au grooming — maquette d'abord)

- **Suggérer.** Un signal « recette X applicable au projet Y », par heuristique : stack du
  projet, présence de certains fichiers, labels du projet.
- **Détecter l'installé.** Une notion « recette installée » et comment la repérer : un marqueur
  dans le projet, un registre, ou une détection par empreinte.
- **Visualiser.** Deux listes dans le dashboard : le catalogue global, et l'adoption par projet.
- **Maquette au préalable.** Le PO la demande explicitement avant toute implémentation.
- **Commande ou mécanisme ?** À trancher : une sous-commande (`ezk-chef suggest <projet>` ?) ou
  un autre mécanisme. Ne pas résoudre en silence.

## Comment vérifier

À définir au grooming (après la maquette).

## Notes / décisions

- Capté le 2026-10-29 à la demande du PO. Né `idea`, P1.
- Distinct de `ezk-chef scan` (découverte de recettes neuves) : ici, adoption des recettes
  existantes. Décision PO : nouvelle fiche.
- Dépend du dashboard unifié ([20261007135620590](20261007135620590_refondre-vue-supervision-moniteur-lisible.md)) pour la partie visualisation.
