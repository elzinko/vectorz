---
id: "20261103191932074"
title: "La fenêtre d'une fiche de mission control affiche le Markdown brut"
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

# La fenêtre d'une fiche de mission control affiche le Markdown brut

**En clair.** Le texte d'une fiche garde ses signes de mise en forme dans la fenêtre qui l'ouvre. On lit les
astérisques du gras et de l'italique, et les accents graves du code, tels quels.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre mission control, projet vectorz, onglet « Fiches ».
2. Clique la carte « article — émettre des events en restant fidèle au fonctionnement de Claude
   Desktop/Code ».
3. Lis la section « Contexte » : les astérisques et les accents graves sont affichés.

## Proposition

À groomer.

## Critères d'acceptation

- [ ] *(à groomer)* La reproduction ci-dessus ne montre plus le défaut.

## Comment vérifier

Rejouer la reproduction ci-dessus.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B5), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Indice relevé avant le groom : `FicheModal.tsx` affiche le texte sans le mettre en forme.
