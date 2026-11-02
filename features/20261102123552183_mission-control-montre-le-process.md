---
id: "20261102123552183"
title: "Mission control montre le process : chaque fiche active posée sur son étape"
type: feature
priority: P2
product: cop1
milestone: board
version:
depends: ["20261031160441412"]
labels: [board, mission-control, un-seul-ecran]
status: idea
pr:
evidence: before-after
created: 2026-11-02
---

## En clair

La page web de la méthode a une vue « process » : chaque fiche active est posée sur son étape, de
l'idée à la livraison, avec sa session. Dans mission control, l'entrée « Process » existe mais affiche
« tranche à venir ». Cette fiche la remplit : la méthode publie l'étape de chaque fiche, mission
control l'affiche.

## Contexte / Problème

- L'[amendement du 2026-11-02 de l'ADR-086](../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md)
  fait de mission control le seul écran. La page « process » de la méthode doit y trouver son
  remplaçant avant le retrait de la page web.
- La méthode calcule déjà l'étape de chaque fiche (`src/core/process-data.ts`) : idée, prête, en
  sprint, en revue, livrée. Elle la déduit du statut, d'une branche `feat/<id>-…`, d'une PR ouverte ou
  d'une session. Ce calcul ne sert qu'à sa page web : aucune commande `ezk … --json` ne le publie.
- Dans mission control, l'entrée « Process » de la partie « Méthode » affiche « tranche à venir » et
  renvoie vers une autre fiche, sur le schéma des étapes d'un skill.

## Valeur

- Le PO voit où en est chaque fiche active, dans l'écran où il suit déjà ses runs.
- L'entrée « Process » de mission control cesse d'être une coquille vide.

## Proposition

1. **La méthode publie le process.** Une commande `ezk … --json` rend, pour chaque fiche active, son
   étape et le signal qui l'y place (statut, branche, PR, session). Elle réutilise `process-data.ts` ;
   un contrat versionné la décrit.
2. **Mission control affiche le process.** La vue « Process » montre une colonne par étape, et les
   fiches dedans. Un clic ouvre la fenêtre de la fiche, comme ailleurs.

## Critères d'acceptation

- [ ] **L'étape de la méthode.** Chaque fiche active apparaît dans la colonne que publie la commande ;
      aucune fiche n'est placée par mission control lui-même.
- [ ] **Le pourquoi de l'étape.** Une fiche en sprint ou en revue dit le signal qui l'y place : sa
      branche, sa PR ou sa session.
- [ ] **Plus de coquille vide.** L'entrée « Process » de mission control n'affiche plus « tranche à
      venir ».
- [ ] **Jamais de faux chiffre.** Sans `ezk`, ou avec un format inconnu, la vue dit « process
      indisponible : <raison> ».
- [ ] **Avant / après.** Capture de la page « process » de la méthode et de l'entrée « Process » de
      mission control (avant), puis de la nouvelle vue (après).

## Comment vérifier

```bash
pnpm cop1:dev
```

Ouvrir http://localhost:5273, « Méthode » puis « Process ». Signal observable : chaque fiche active est
dans la même colonne que sur la page « process » de la méthode, tant que celle-ci existe.

## Notes

- Une des fiches du chantier « un seul écran », liées par `milestone: board` et le label
  `un-seul-ecran`, sans fiche chapeau. Le retrait vient en dernier :
  [retirer la page web de la méthode](20261102123552185_retirer-la-page-web-de-la-methode.md).
- L'entrée « Process » renvoie aujourd'hui vers
  [le schéma des étapes d'un skill](20260830110131228_schema-etapes-skill-configurables.md). Ce schéma
  reste un autre sujet ; le build retire ce renvoi.
- Priorité P2, fixée par le PO le 2026-11-02 pour tout le chantier.
