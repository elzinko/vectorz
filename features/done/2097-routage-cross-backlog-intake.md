---
id: 2097
product: mega-city
title: Connecter l'ordre du plan à la vue cross-backlog — « la suite, toutes listes confondues » suit PLAN.md
type: feature
priority: P0
epic:
depends: []
labels: [enabler]
status: shipped
ready: 2026-07-26
pr: "#53"
created: 2026-07-26
---

# 0097 — Relier deux briques déjà là

## Contexte / Problème (en clair)

Le dépôt avait **deux listes** (produit `features/` et méthode `products/mega-city/features/`,
fusionnées par la fiche 0064 — ids méthode +2000, préfixe `mc-` retiré). Deux briques existent déjà :

- **`portfolio.sh`** lit **déjà les deux listes** et sait quelle carte est sur quelle liste
  (`PORTFOLIO.md`, section « Tirables, tous backlogs confondus »). Mais il trie par **priorité**.
- **`plan:order`** (livré par 2089, #52) sait ordonner par ton **plan** `PLAN.md`. Mais il
  travaille **à l'intérieur d'une seule liste**.

Ce qui manque = **les brancher**. Résultat aujourd'hui : lancé à la racine, le builder ne pointe
pas la vraie tête du plan `2094` (elle est sur l'autre liste).

## Valeur

Le builder lancé « nu » annonce enfin la **vraie prochaine carte selon TON plan**, quelle que
soit la liste — `2094` en tête. La boucle « mon plan = ce que fait l'outil » est refermée.

## Proposition (petit périmètre — on RÉUTILISE, on ne reconstruit pas)

- Une section **« 🧭 Prochaine selon le PLAN (tous backlogs) »** alimentée en réutilisant
  `plan:order` (l'ordre) **et** l'agrégation deux-listes déjà faite par `portfolio.sh`
  (product + statut + `ready` par carte). Partie déterministe = testée (patron 2089 :
  cœur pur + coquille), pas « à l'œil ».
- La règle de résolution est **déjà implicite** : `mc-XXXX` → liste méthode, nombre seul →
  liste produit. On l'explicite dans le petit helper, on ne l'invente pas.

## Critères d'acceptation (comment on saura)

- [ ] À partir de `PLAN.md` + des deux listes, on obtient la **tête réelle** = 1re carte
      non-livrée du plan, **avec sa liste** et son état `ready`.
- [ ] Une carte du plan introuvable dans les deux listes est **signalée** (pas ignorée).
- [ ] La sortie distingue « tirable » vs « tête bloquée (pas encore ready) » — comme 2089,
      mais cross-backlog.
- [ ] Couvert par des tests ; aucune régression sur `plan:order` ni `portfolio.sh`.

## Hors scope

- Fusionner les deux listes (on garde deux listes + une vue par-dessus — ADR-0017 A13).
- Le contenu/la priorisation du plan (au PO, via `plan set`).

## Notes

- Suite de **2089** (#52, ordre intra-liste) et de **`portfolio.sh`** (lecture cross-backlog
  déjà livrée). Ici : **le trait d'union** entre les deux.
- Anti-doublon vérifié : `done/0048` (champ `product`) fermée « sans objet » — la distinction
  vient de l'**emplacement**, pas d'un champ ; cette fiche s'appuie dessus, ne la rouvre pas.
