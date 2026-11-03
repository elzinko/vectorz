---
id: "20261103203943912"
title: "Les listes à puces d'une fiche s'affichent en un seul paragraphe dans mission control"
type: bug
priority: P3
product: cop1
milestone:
version:
labels: [scout, mission-control]
status: shipped
pr: "local (8c017d8f)"
evidence: before-after
created: 2026-11-03
---

# Les listes à puces d'une fiche s'affichent en un seul paragraphe dans mission control

**En clair.** La fenêtre d'une fiche rend le gras, l'italique et le code depuis le 2026-11-03. Ses listes à puces
restent brutes : les lignes « - … » sont collées bout à bout dans un seul paragraphe, tirets compris.

**Si tu arrives frais.** Mission control est l'écran de la méthode (cop1). Il lit ce que la méthode
publie par `ezk … --json` et l'affiche, sans le recalculer (ADR-086).

## Contexte / Problème

Gravité : **mineure**.

Reproduction :

1. Ouvre mission control, projet muti, onglet « Process ».
2. Clique la carte « Sortir la 1.8.0 (suivre le runbook de release) ».
3. La section « Contexte » tient en un bloc : « - Le guide … - Les package.json … - Six fonctions … ».

## Proposition

Le contexte d'une fiche est rendu par blocs, en complément du rendu en ligne livré le 2026-11-03 :

- une ligne vide sépare deux paragraphes ;
- des lignes qui commencent par « - » ou « * » suivis d'une espace forment une liste à puces, un
  point par ligne ;
- dans chaque paragraphe et chaque point, le gras, l'italique et le code restent rendus.

Rien n'est injecté en HTML : chaque bloc devient un élément React. « En clair » et les critères
restent rendus en ligne ; « Comment vérifier » reste brut.

## Critères d'acceptation

- [ ] Dans la fenêtre d'une fiche, une liste à puces du contexte s'affiche en liste, un point par ligne,
      sans les tirets.
- [ ] Deux paragraphes séparés par une ligne vide restent deux paragraphes.
- [ ] Le gras, l'italique et le code restent rendus dans les points et les paragraphes.
- [ ] Une ligne qui commence par « - » collé à un mot (« -- », « -x ») n'est pas un point de liste.

## Comment vérifier

1. Les tests de la page web passent : `pnpm --dir products/cop1/packages/web exec vitest run src/board`.
2. Mission control lancé, la carte « Sortir la 1.8.0 » de muti montre une liste à puces dans son
   contexte. Captures avant et après dans `docs/pr-evidence/<id>/`.

## Notes / décisions

- Trouvé par ezk-scout, rapport `/private/tmp/claude-501/-Users-elzinko-git-bacasable-vectorz/fa181bfb-37a3-4d65-93d6-545f3a00e4d1/scratchpad/scout-2026-11-03-nuit/report.md` (brouillon B2), le 2026-11-03 dans la nuit.
- **Entrée au backlog le 2026-11-03** sur décision d'`ezk-pm`, en mode auto du run délégué par le PO
  (« continuer sans mon intervention »). Ce n'est aucune des quatre décisions humaines : c'est un bug,
  pas une idée produit. Le PO peut la retirer.
- Suite de la fiche livrée [la fenêtre d'une fiche affiche le Markdown brut](20261103191932074_fenetre-fiche-markdown-brut.md),
  qui couvrait le Markdown en ligne seulement.
- Indice relevé avant le groom : `FicheModal.tsx`, le contexte est rendu dans un seul `<p>`.
- **Groomée `ready` le 2026-11-03** (run autonome) : le contexte est la section où les listes
  apparaissent ; « En clair » reste un paragraphe en ligne.
