---
id: "20261103191932064"
title: "La vue Fiches de mission control ne montre jamais les fiches livrées"
type: bug
priority: P2
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: idea
pr:
evidence: before-after
created: 2026-11-03
---

# La vue Fiches de mission control ne montre jamais les fiches livrées

**En clair.** Dans mission control, cocher « réalisées » dans la vue Fiches ne fait rien : la colonne « Livrées »
reste à 0, alors que la vue d'ensemble compte 360 fiches livrées. Choisir le lot d'une version
taguée, v0.22.0 par exemple, affiche « 0 fiche(s) ». La fiche livrée en v0.17.0 promettait ce filtre.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **majeure**.

Reproduction :

1. Lance mission control, projet vectorz, onglet « Fiches ».
2. Clique « réalisées » : l'en-tête dit « 103 fiche(s) », la colonne « Livrées » reste à 0.
3. Choisis « v0.22.0 » dans « Lot » : « 0 fiche(s) », toutes les colonnes vides.
4. `curl -s http://127.0.0.1:<port>/api/board` : `vectorz.fiches` ne contient que les 103 fiches
   actives, aucune de `features/done/`.

## Proposition

À groomer.

## Critères d'acceptation

- [ ] *(à groomer)* La reproduction ci-dessus ne montre plus le défaut.

## Comment vérifier

Rejouer la reproduction ci-dessus.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-soir/report.md` (brouillon B1), le 2026-11-03 au soir.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Voisine livrée : [la vue Fiches du board](done/20261012231419224_board-vue-fiches-filtre-categorie.md), dont un
  critère disait « cocher réalisées les fait apparaître ». Régression probable depuis le branchement
  du board sur les données de la méthode.
- Indice relevé avant le groom : `ezk backlog show --json` ne publie que les fiches actives
  (`backlog-show.ts`, filtre `!f.done`), et le traducteur de mission control saute aussi les fiches
  livrées (`ezkPlanTranslator.ts`, `if (f.done) continue`).
