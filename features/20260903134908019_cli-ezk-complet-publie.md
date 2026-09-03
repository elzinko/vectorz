---
id: "20260903134908019"
title: CLI `ezk` complet et publié — framework de commandes et paquet distribuable (option C de l'ADR-0046, plus tard)
type: feature
priority: P2 # décidé par le PO le 2026-09-03 : plus tard, si le besoin se fait sentir
product: mega-city
version:
epic:
status: idea
ready:
pr:
evidence: none # outil de terminal, aucun écran
created: 2026-09-03
---

# 20260903134908019 — CLI `ezk` complet et publié (plus tard)

**En clair.** Quand le CLI mince `ezk` aura tourné assez longtemps, on saura si un vrai outil
de ligne de commande est nécessaire : un paquet installable hors du dépôt, avec complétion,
aide riche et versions. Cette fiche garde l'idée au chaud. Le PO a décidé de ne pas la faire
maintenant.

## Contexte / Problème

L'ADR-0046 a comparé trois options. L'option B, un routeur mince sur manifeste
([[20260903134906920]]), couvre l'essentiel pour un sprint. L'option C, un framework de commandes complet
(commander ou oclif) publié comme paquet, apporte en plus la complétion shell, une aide
générée avec sous-commandes typées, la gestion des versions et l'installation hors du dépôt
sans `pnpm link`. Elle coûte plusieurs sprints et contredit aujourd'hui la décision « ne pas
publier » de la fiche [[0087]].

## Proposition

(à groomer, seulement si le besoin apparaît)

- Reprendre le manifeste de B comme source : les commandes C sont générées, pas réécrites.
- Publier le paquet en même temps que la distribution en plugin ([[0087]]), jamais avant.
- Signaux de besoin à guetter : une commande B lancée depuis un autre dépôt plus d'une fois
  par semaine, ou une demande de complétion.

## Critères d'acceptation

- [ ] (à définir au grooming — DoR)
- [ ] Le besoin est constaté sur pièce avant de tirer la fiche : au moins un des deux
      signaux ci-dessus, daté.

## Notes / décisions

- Décision PO du 2026-09-03 : « une autre pour le C plus tard en P2, on verra si le besoin
  s'en fait sentir entre temps ».
- Dépend de [[20260903134906920]] (B d'abord).
