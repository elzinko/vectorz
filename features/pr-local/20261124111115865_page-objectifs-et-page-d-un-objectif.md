> 🗎 Rendu de la fiche [features/20261124111115865_page-objectifs-et-page-d-un-objectif.md](../done/20261124111115865_page-objectifs-et-page-d-un-objectif.md)

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
[Les objectifs publiés comme objets](../done/20261114131612572_objectifs-publies-comme-objets.md)
les a ajoutés au contrat.

Le relais de cop1 ne lit que le slug, l'état, le total et le nombre de livrées. Le traducteur du
plan, `products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts`, laisse tomber le nom,
les fiches livrées et les versions. La page Pilotage affiche donc des slugs, sans pouvoir rien
ouvrir. C'est l'écart A6 de la
[carte des écarts](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

## Proposition

1. **Nommer ce que le plan nomme.** Aucun objectif n'a de fichier d'identité. Le plan n'en nomme
   qu'un : `board`, « Mission control lisible ». On écrit `features/milestones/board.md` avec ce
   nom. Les autres restent « nom non publié » : nommer un objectif est un choix du PO, pas du code.
2. **Relayer.** Le traducteur du plan transmet, pour chaque objectif, son nom, ses fiches actives,
   ses fiches livrées, ses versions et le décompte par état. Un champ absent reçoit une valeur
   neutre, un champ mal formé est refusé.
3. **Page Objectifs.** Une entrée « Objectifs » du menu Projet, juste après « Vue d'ensemble »,
   ouvre un tableau, dans l'ordre publié par la méthode. Une ligne par objectif :
   - son rang, son slug et son nom, ou « nom non publié » ;
   - livrées sur total ;
   - les fiches actives en mots : idées, prêtes, bloquées ;
   - les versions qui le portent, ou « aucune version posée ».
   Deux filtres réduisent la liste : l'état et la version. La page dit combien de lignes restent.
4. **Page d'un objectif.** Un clic ouvre sa page :
   - l'en-tête : avancement, versions portées, nombre de fiches livrées sans version ;
   - ses fiches à faire, avec priorité, état et raison de blocage telle que la méthode la publie ;
   - ses fiches livrées, chacune avec sa version ou « à étiqueter ».
   Les fiches actives viennent de `actives[]` de `ezk board show`. Les titres des livrées viennent
   de `ezk backlog show`, que le relais lit déjà. Chaque fiche s'ouvre dans la fenêtre de fiche.
5. **Les gestes restent des commandes.** « Groomer ses fiches » n'écrit rien : il montre la
   commande `/ezk-backlog groom <id>` de la première fiche à faire.
6. **« parked » n'est pas un objectif.** Il regroupe 84 fiches mises de côté. Tant que la fiche
   [« parked » n'est plus un pseudo-objectif](../20261114131614612_parked-n-est-plus-un-pseudo-objectif.md)
   n'est pas livrée, la page le range sous le tableau, sur une ligne à part, avec une phrase qui le
   dit.

## Critères d'acceptation

- [ ] `features/milestones/board.md` existe avec le nom « Mission control lisible », et
      `ezk board show --json` le publie.
- [ ] Le traducteur du plan relaie le nom, les fiches, les livrées, les versions et le décompte de
      chaque objectif. Un test fait passer l'exemple rangé du contrat et retrouve ces champs.
- [ ] Le menu Projet a une entrée « Objectifs », juste après « Vue d'ensemble ».
- [ ] Chaque ligne montre rang, slug, nom ou « nom non publié », livrées sur total, actives en mots
      et versions ou « aucune version posée ».
- [ ] Les filtres par état et par version réduisent la liste, et la page dit combien de lignes
      restent.
- [ ] Un clic sur un objectif ouvre sa page ; le fil d'Ariane « Objectifs › slug » ramène au
      tableau.
- [ ] La page d'un objectif montre ses fiches à faire et ses fiches livrées, chacune avec son titre,
      et chacune s'ouvre dans la fenêtre de fiche.
- [ ] « parked » n'apparaît pas comme une ligne du tableau ; il est rangé à part, avec sa phrase.
- [ ] Aucun geste n'écrit : chacun montre sa commande.

## Comment vérifier

```bash
ezk board show --json | jq '.milestones[] | select(.milestone == "board") | .nom'
pnpm --dir products/cop1/packages/app exec vitest run src/features/board/ezkPlanTranslator.test.ts
pnpm --dir products/cop1/packages/web exec vitest run src/board
pnpm cop1:dev
```

La première commande doit rendre « Mission control lisible ». Dans mission control, ouvre
« Objectifs », filtre sur « en cours », puis ouvre l'objectif `board`. Compare avec les pages
Objectifs et Un objectif de la maquette.

## Glossaire

- **Objectif** : le mot de l'écran pour une milestone.
- **Fichier d'identité** : `features/milestones/<slug>.md`, qui donne son nom en clair à un objectif.
- **Relais, ou traducteur** : le code de cop1 qui lit la réponse d'ezk et la passe à l'écran.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette.
- La page Pilotage perd sa partie « avancement par objectif » quand celle-ci existe. Son retrait est
  porté par la fiche
  [Le menu de mission control suit la maquette](../20261124111116126_menu-suit-la-maquette-anciennes-pages-retirees.md).

### Grooming du 2026-11-24

Fait par l'orchestrateur, sur délégation du PO (« Oui, groome-les »). Décisions :

- **Un seul nom écrit.** Le plan ne nomme que `board`. Les 13 autres objectifs n'ont de nom nulle
  part : la page dira « nom non publié ». La maquette les nommait, mais ces noms n'avaient pas de
  source. Nommer les autres est un geste du PO : un fichier de quatre lignes par objectif.
- **L'ordre est celui de la méthode.** Elle range les objectifs par son ordre de marche, puis par
  slug. La colonne « Plan » de la maquette devient le rang dans cet ordre.
- **La raison d'un blocage s'affiche telle que publiée.** La méthode publie un mot, par exemple
  `panel` ou `deferred`. Son libellé en français est porté par la fiche de la cloche ; l'écran ne
  traduit rien lui-même.
- **Pas d'adresse web pour la page**, comme pour la page Versions : état de l'écran et fil
  d'Ariane.
- **La page Pilotage reste** jusqu'à la fiche du menu, qui la retire.
- **Données réelles au 24 novembre** : 14 objectifs, dont `parked` (84 fiches) ; `board` a 72
  fiches livrées sur 100.
- **Preuve avant/après** : un script de capture, faute d'adresse pour la commande de capture.
- **Taille : la fiche reste entière, sur décision du PO du 2026-11-24** (« Oui, telles quelles »).
  Le contrôle signale plus de six critères et trois surfaces : fichiers d'identité, relais, écran.
  Raison : chaque critère est petit, et l'ensemble a la taille de l'écran Process, livré en un
  sprint de 33 minutes. Passée « prête » le même jour.


## Validation

| Modalité | Statut |
|---|---|
| Gate locale | ✅ 417 tests app, 291 web, tsc et biome propres |
| Revue adverse | ✅ GO (ezk-reviewer, 0 bloquant, 4 mineurs dont 2 corrigés) |
| Before / after (UI) | docs/pr-evidence/20261124111115865/objectifs-before.jpg → docs/pr-evidence/20261124111115865/objectifs-after.jpg et objectif-after.jpg |
