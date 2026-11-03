---
id: "20261103203943909"
title: "La fenêtre d'une fiche bloquée déborde à droite dans mission control"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: before-after
created: 2026-11-03
---

# La fenêtre d'une fiche bloquée déborde à droite dans mission control

**En clair.** Quand une fiche est bloquée, la fenêtre qui l'ouvre montre sa raison dans une pastille qui ne revient
jamais à la ligne. Une raison longue est coupée à droite, et la fenêtre gagne une barre de défilement
horizontale.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre mission control, projet muti, onglet « Process ».
2. Clique la carte « Sortir la 1.8.0 (suivre le runbook de release) ».
3. La pastille « bloquée : … » est coupée ; `.sheet2` a un `scrollWidth` de 797 px pour un
   `clientWidth` de 543 px.

## Proposition

À groomer.

## Critères d'acceptation

- [ ] *(à groomer)* La reproduction ci-dessus ne montre plus le défaut.

## Comment vérifier

Rejouer la reproduction ci-dessus.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-nuit/report.md` (brouillon B1), le 2026-11-03 dans la nuit.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `FicheModal.tsx`, la pastille `bloquée : …` est en
  `white-space: nowrap`.
