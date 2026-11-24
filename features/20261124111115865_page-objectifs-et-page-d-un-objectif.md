---
id: "20261124111115865"
title: "Mission control a une page Objectifs et une page par objectif, comme la maquette"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: idea
blocked:
depends: []
pr:
evidence: before-after
created: 2026-11-24
---

# 20261124111115865 — Mission control a une page Objectifs et une page par objectif, comme la maquette

**En clair.** La maquette a une page « Objectifs » : un tableau de tous les objectifs du projet,
avec leur nom, leur avancement et leurs versions. Un clic ouvre la page d'un objectif : ce qui
reste à faire et ce qui est livré. Aujourd'hui, seule la page Pilotage montre l'avancement, sans le
nom ni les versions, et rien ne s'ouvre. On relaie les champs que la méthode publie déjà et on
construit les deux pages.

**Si tu arrives frais.** Mission control est l'écran de cop1 et lit `ezk board show --json`. Un
objectif, appelé « milestone » dans le code et dans le front-matter des fiches, regroupe des fiches
qui servent un même but. Son nom en clair vit dans `features/milestones/<slug>.md`, selon la
décision de l'ADR-0088.

## Contexte / Problème

La maquette dessine deux pages :

- [Objectifs](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Milestones.dc.html` ;
- [Un objectif](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Milestone.dc.html`.

La méthode publie déjà, pour chaque objectif : son nom, son état, son avancement, ses fiches, ses
fiches livrées et ses versions. La fiche livrée
[Les objectifs publiés comme objets](done/20261114131612572_objectifs-publies-comme-objets.md)
les a ajoutés au contrat.

Le relais de cop1 ne lit que le slug, l'état, le total et le nombre de livrées. Le traducteur du
plan, `products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts`, laisse tomber le nom,
les fiches livrées et les versions. La page Pilotage affiche donc des slugs, sans pouvoir rien
ouvrir. C'est l'écart A6 de la
[carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

## Proposition

1. **Relayer.** Le traducteur du plan transmet, pour chaque objectif, son nom, ses fiches, ses
   fiches livrées, ses versions et le décompte par état. Un champ absent reçoit une valeur neutre,
   un champ mal formé est refusé.
2. **Page Objectifs.** Une entrée « Objectifs » du menu Projet ouvre un tableau, dans l'ordre
   publié par la méthode. Une ligne par objectif :
   - son slug et son nom, ou « nom non publié » s'il n'a pas de fichier d'identité ;
   - livrées sur total ;
   - les fiches actives en mots : idées, prêtes, bloquées avec la raison du blocage ;
   - les versions qui le portent, ou « aucune version posée ».
   Un filtre par état et un filtre par version réduisent la liste.
3. **Page d'un objectif.** Un clic ouvre sa page :
   - l'en-tête : avancement, versions portées, fiches livrées sans numéro de version ;
   - ses fiches à faire, chacune avec sa priorité, son état et sa raison de blocage ;
   - ses fiches livrées, chacune avec sa version ou « à étiqueter ».
   Chaque fiche s'ouvre dans la fenêtre de fiche existante.
4. **Les gestes restent des commandes.** « Groomer ses fiches » n'écrit rien : il montre la
   commande `ezk-backlog groom` à lancer.
5. **« parked » n'est pas un objectif.** Tant que la fiche
   [« parked » n'est plus un pseudo-objectif](20261114131614612_parked-n-est-plus-un-pseudo-objectif.md)
   n'est pas livrée, la page range « parked » à part, sous le tableau, avec une phrase qui le dit.

## Critères d'acceptation

- [ ] Le traducteur du plan relaie le nom, les fiches, les livrées, les versions et le décompte de
      chaque objectif. Un test fait passer l'exemple rangé du contrat et retrouve ces champs.
- [ ] Le menu Projet a une entrée « Objectifs » qui ouvre le tableau.
- [ ] Chaque ligne montre slug, nom ou « nom non publié », livrées sur total, actives en mots et
      versions ou « aucune version posée ».
- [ ] Les filtres par état et par version réduisent la liste, et la page dit combien de lignes
      restent.
- [ ] Un clic sur un objectif ouvre sa page, avec son en-tête, ses fiches à faire et ses fiches
      livrées ; chaque fiche s'ouvre dans la fenêtre de fiche.
- [ ] « parked » n'apparaît pas comme un objectif du tableau.
- [ ] Aucun geste n'écrit : chacun montre sa commande.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/app exec vitest run src/features/board/ezkPlanTranslator.test.ts
pnpm --dir products/cop1/packages/web exec vitest run src/board
pnpm cop1:dev
```

Dans mission control, ouvre « Objectifs », filtre sur « en cours », puis ouvre l'objectif `board`.
Compare avec les pages Objectifs et Un objectif de la maquette.

## Glossaire

- **Objectif** : le mot de l'écran pour une milestone.
- **Fichier d'identité** : `features/milestones/<slug>.md`, qui donne son nom en clair à un objectif.
- **Relais, ou traducteur** : le code de cop1 qui lit la réponse d'ezk et la passe à l'écran.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette.
- La page Pilotage perd sa partie « avancement par objectif » quand celle-ci existe. Son retrait est
  porté par la fiche
  [Le menu de mission control suit la maquette](20261124111116126_menu-suit-la-maquette-anciennes-pages-retirees.md).
