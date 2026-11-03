---
id: "20261103191932077"
title: "Un « 0 » coupé dépasse au bout de la barre « Entonnoir » de mission control"
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

# Un « 0 » coupé dépasse au bout de la barre « Entonnoir » de mission control

**En clair.** Quand aucune fiche n'est prête, le segment « prêtes » de la barre « Entonnoir » a une largeur
nulle, mais son chiffre « 0 » est quand même écrit. Il apparaît à moitié coupé au bord droit de la
barre.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre la vue d'ensemble de vectorz avec 0 fiche prête.
2. Regarde le bout droit de la barre « Entonnoir » : un demi « 0 » dépasse.
3. Dans la console du navigateur : le segment `.funbar .fun-ready` mesure 0 px, son texte va au-delà
   du bord de la barre.

## Proposition

À groomer.

## Critères d'acceptation

- [ ] *(à groomer)* La reproduction ci-dessus ne montre plus le défaut.

## Comment vérifier

Rejouer la reproduction ci-dessus.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B6), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `OverviewView.tsx`, rendu de la barre « Entonnoir ». Le segment
  « en cours » n'affiche déjà rien quand il est vide.
