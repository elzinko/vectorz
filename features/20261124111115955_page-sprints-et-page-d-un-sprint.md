---
id: "20261124111115955"
title: "Mission control a une page Sprints et une page par sprint, comme la maquette"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
blocked:
depends: ["20261114131612204"]
pr:
evidence: before-after
created: 2026-11-24
---

# 20261124111115955 — Mission control a une page Sprints et une page par sprint, comme la maquette

**En clair.** La maquette a une page « Sprints » : chaque sprint sur une ligne, avec son numéro,
son but, sa durée, ses fiches et sa rétro. Un clic ouvre la page du sprint et son compte rendu.
Aujourd'hui, mission control ne montre que le dernier sprint, dans la vue d'ensemble. On construit
les deux pages sur ce que la méthode publie. Elles s'enrichissent quand la méthode publie le
numéro, le but et la branche.

**Si tu arrives frais.** Un sprint est un lot de fiches livré d'un bloc. À sa clôture, la méthode
écrit un compte rendu dans `docs/sprints/`. Elle en publie les derniers dans `derniersSprints` de
`ezk board show --json`. Mission control lit ce contrat et ne calcule rien lui-même.

## Contexte / Problème

La maquette dessine deux pages :

- [Sprints](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Sessions.dc.html` ;
- [Un sprint](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Sprint.dc.html`.

Le fichier de la page Sprints s'appelle « Sessions » pour une raison historique. Son titre et son
fil d'Ariane disent bien « Sprints ».

La méthode publie aujourd'hui, pour les cinq derniers sprints seulement : le slug, le fichier du
compte rendu, le jour, la fin, la durée, les jetons, les fiches livrées et les blocages. Il manque :

- le numéro continu du sprint ;
- son but en clair ;
- la branche, donc la session, qui l'a joué ;
- la liste complète, au-delà des cinq derniers.

La fiche [Le sprint se publie avec son numéro continu, son but et sa branche](20261114131612204_sprint-publie-numero-but-branche.md)
porte ces données. Cette fiche-ci en dépend pour être complète. C'est l'écart A1 de la
[carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

## Proposition

1. **Page Sprints.** Une entrée « Sprints » du menu Projet ouvre la liste, du plus récent au plus
   ancien. Une ligne par sprint : numéro et but, jour et heure, durée, nombre de fiches, session,
   état de la rétro. Un filtre par période réduit la liste.
2. **Page d'un sprint.** Un clic ouvre sa page :
   - l'en-tête : dates, durée, taille du lot, incrément, session, blocages, jetons ;
   - ses fiches livrées, chacune cliquable vers la fenêtre de fiche ;
   - son compte rendu, avec le chemin du fichier ;
   - sa rétro : jouée ou pas encore.
3. **Ce qui manque se dit.** Tant que la dépendance n'est pas livrée, le numéro, le but et la
   session s'écrivent « non publié ». La page dit aussi qu'elle ne montre que les cinq derniers
   sprints. Des jetons non mesurés s'écrivent « non mesuré », jamais « 0 ».
4. **Lancer une rétro reste une commande.** Le bouton « Lancer une rétro » de la maquette n'écrit
   rien ; il montre la commande. Le geste depuis l'écran est porté par la fiche
   [Demander une rétro depuis mission control](20261114131617010_demander-une-retro-depuis-mission-control.md).

## Critères d'acceptation

- [ ] Le menu Projet a une entrée « Sprints » qui ouvre la liste.
- [ ] La liste montre les sprints publiés, du plus récent au plus ancien, avec jour, durée, fiches
      et état de la rétro.
- [ ] Un clic sur un sprint ouvre sa page, avec son en-tête, ses fiches livrées et son compte rendu.
- [ ] Sans numéro, but ou session publiés, la page écrit « non publié » à leur place.
- [ ] La page dit combien de sprints elle montre sur combien, tant que la liste est tronquée.
- [ ] Des jetons non mesurés s'écrivent « non mesuré ».
- [ ] Quand la dépendance est livrée, le numéro, le but et la session s'affichent sans autre
      changement d'écran.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/app exec vitest run src/features/board/ezkPlanTranslator.test.ts
pnpm --dir products/cop1/packages/web exec vitest run src/board
pnpm cop1:dev
```

Dans mission control, ouvre « Sprints », puis le sprint le plus récent. Compare avec les pages
Sprints et Un sprint de la maquette.

## Glossaire

- **Compte rendu de sprint** : le fichier que la méthode écrit à la clôture, dans `docs/sprints/`.
- **Numéro continu** : le rang du sprint depuis le début du projet, décision du PO du 14 novembre.
- **Session** : une séance de travail dans Claude Code, sur une branche ; elle peut jouer plusieurs
  sprints.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette. Elle peut se
  construire avant sa dépendance : l'écran dit alors ce qui n'est pas publié.
