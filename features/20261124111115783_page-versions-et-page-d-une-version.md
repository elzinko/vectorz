---
id: "20261124111115783"
title: "Mission control a une page Versions et une page par version, comme la maquette"
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

# 20261124111115783 — Mission control a une page Versions et une page par version, comme la maquette

**En clair.** La maquette a une page « Versions » : ce qui attend d'être versionné, puis la liste des
versions étiquetées. Un clic sur une version ouvre sa page : son état, ses objectifs et ses fiches
livrées. La méthode publie déjà presque tout, mais mission control n'en relaie qu'une partie, et
aucune page ne l'affiche. On relaie les champs manquants et on construit les deux pages.

**Si tu arrives frais.** Mission control est l'écran de cop1. Il lit ce que la méthode publie par
`ezk board show --json` et ne calcule rien lui-même. Une version est une coupe : une étiquette git
posée sur ce qui est livré. Un objectif, appelé « milestone » dans le code, regroupe des fiches qui
servent un même but.

## Contexte / Problème

La maquette dessine deux pages :

- [Versions](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Versions.dc.html` ;
- [Une version](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), dans le fichier `project/Version.dc.html`.

Aujourd'hui, les versions n'apparaissent que dans la vue d'ensemble, en un bandeau. Aucune page ne
les liste et aucune ne s'ouvre.

La méthode publie déjà ces données dans `versions` :

- pour chaque version : son nom, ses objectifs, la date de son étiquette, ses fiches livrées ;
- la prochaine coupe : la dernière étiquette, les fiches livrées depuis, le dernier verdict de la
  gate de release.

Deux fiches livrées les ont publiées :
[Les versions publiées comme coupes](done/20261114131612759_versions-publiees-comme-coupes.md) et
[`ezk backlog version tag`, un seul verbe pour la coupe](done/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md).

Le relais de cop1 ne transmet pas tout. Le traducteur du plan,
`products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts`, ne lit ni le nom d'une
version, ni ses objectifs, ni la date de son étiquette, ni la prochaine coupe. C'est le même piège
que l'écran Process du 19 novembre : un champ publié mais non relayé n'arrive jamais à l'écran.
C'est l'écart A7 de la
[carte des écarts](../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

## Proposition

1. **Relayer.** Le traducteur du plan transmet, pour chaque version, son nom, ses objectifs et la
   date de son étiquette, ainsi que la prochaine coupe entière. Un champ absent reçoit une valeur
   neutre, un champ mal formé est refusé, comme pour le relais du process.
2. **Page Versions.** Une entrée « Versions » du menu Projet ouvre la page. Elle montre deux blocs :
   - **À versionner** : la dernière étiquette et son âge, le nombre de fiches livrées depuis, et
     le dernier verdict de la gate. Le bouton « Versionner » n'écrit rien : il montre la commande
     `ezk backlog version tag <v>` à lancer, car la coupe est un geste du PO.
   - **Versions étiquetées** : une ligne par version, avec son numéro, son nom, ses fiches livrées,
     ses objectifs et la date de l'étiquette, de la plus récente à la plus ancienne.
3. **Page d'une version.** Un clic sur une ligne ouvre la page de la version :
   - l'en-tête : état, cycle de vie en mots, contenu, nom, date de l'étiquette ;
   - ses objectifs, avec le nombre de fiches de la version et l'avancement total de l'objectif ;
   - ses fiches livrées, chacune cliquable vers la fenêtre de la fiche.
4. **Ce qui n'est pas publié se dit.** Le bloc « Qui l'a livrée » de la maquette demande le journal
   des lancements par version : la méthode ne le publie pas. La page écrit « non publié », jamais
   une liste vide présentée comme réelle.

## Critères d'acceptation

- [ ] Le traducteur du plan relaie le nom, les objectifs et la date d'étiquette de chaque version,
      et la prochaine coupe. Un test fait passer l'exemple rangé du contrat et retrouve ces champs.
- [ ] Le menu Projet a une entrée « Versions » qui ouvre la page.
- [ ] La page montre le bloc « À versionner » avec la dernière étiquette, le nombre de fiches
      livrées depuis et le verdict de la gate ; sans prochaine coupe publiée, elle le dit en mots.
- [ ] La page liste les versions étiquetées, de la plus récente à la plus ancienne, avec numéro,
      nom, fiches livrées, objectifs et date.
- [ ] Un clic sur une version ouvre sa page, avec son en-tête, ses objectifs et ses fiches livrées.
- [ ] Le bouton « Versionner » n'écrit rien ; il montre la commande de coupe.
- [ ] Une donnée non publiée s'écrit « non publié », jamais « 0 » ni une liste vide.

## Comment vérifier

```bash
pnpm --dir products/cop1/packages/app exec vitest run src/features/board/ezkPlanTranslator.test.ts
pnpm --dir products/cop1/packages/web exec vitest run src/board
pnpm cop1:dev
```

Dans mission control, ouvre « Versions », puis clique sur la version la plus récente. Compare avec
les pages Versions et Version de la maquette.

## Glossaire

- **Coupe** : poser l'étiquette git d'une version sur ce qui est livré. C'est un geste du PO.
- **Prochaine coupe** : ce que la méthode propose de versionner ensuite, et le verdict de la gate.
- **Relais, ou traducteur** : le code de cop1 qui lit la réponse d'ezk et la passe à l'écran.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette. Les données sont
  publiées ; le travail est le relais et l'écran.
- Le menu de la maquette range « Versions » après « Rétros ». Le rangement complet du menu est
  porté par la fiche
  [Le menu de mission control suit la maquette](20261124111116126_menu-suit-la-maquette-anciennes-pages-retirees.md).
