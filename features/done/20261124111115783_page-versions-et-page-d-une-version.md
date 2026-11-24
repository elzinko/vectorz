---
id: "20261124111115783"
title: "Mission control a une page Versions et une page par version, comme la maquette"
type: feature
priority: P1
product: cop1
milestone: board
version:
labels: [theme:mission-control]
status: shipped
blocked:
depends: []
pr: "local (squash-merge 4a9a9a0a)"
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
[Les versions publiées comme coupes](20261114131612759_versions-publiees-comme-coupes.md) et
[`ezk backlog version tag`, un seul verbe pour la coupe](20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md).

Le relais de cop1 ne transmet pas tout. Le traducteur du plan,
`products/cop1/packages/app/src/features/board/ezkPlanTranslator.ts`, ne lit ni le nom d'une
version, ni ses objectifs, ni la date de son étiquette, ni la prochaine coupe. C'est le même piège
que l'écran Process du 19 novembre : un champ publié mais non relayé n'arrive jamais à l'écran.
C'est l'écart A7 de la
[carte des écarts](../../docs/maquettes/2026-11-14-carte-des-ecarts-maquette-code-backlog.md).

## Proposition

1. **Nommer les versions.** Le plan nomme 23 versions, de v0.1.0 à v0.23.0, dans ses titres de
   séquence : « v0.1.0 — le socle dit vrai ». On écrit un fichier d'identité par version,
   `features/versions/<v>.md`, avec ce nom recopié du plan, sans la parenthèse qui suit. On
   n'invente aucun nom : une version que le plan ne nomme pas reste « nom non publié ».
2. **Relayer.** Le traducteur du plan transmet, pour chaque version, son nom, ses objectifs et la
   date de son étiquette, ainsi que la prochaine coupe entière : dernière étiquette, fiches livrées
   depuis, nombre, verdict de la gate et ses passes, numéro proposé. Un champ absent reçoit une
   valeur neutre, un champ mal formé est refusé, comme pour le relais du process.
3. **Page Versions.** Une entrée « Versions » du menu Projet ouvre la page. Elle a trois blocs :
   - **À versionner** : la dernière étiquette et son âge, le nombre de fiches livrées depuis, le
     verdict de la gate avec ses passes, et le numéro proposé ou « non publié ». Le bouton
     « Versionner » n'écrit rien : il montre la commande `ezk backlog version tag <v>`, car la coupe
     est un geste du PO.
   - **En construction** : les versions sans étiquette, dans l'ordre du train, avec leur état en
     mots et leur contenu : livrées, à faire, prêtes, bloquées.
   - **Versions étiquetées** : une ligne par version, avec son numéro, son nom, ses fiches livrées,
     ses objectifs et l'âge de l'étiquette, de la plus récente à la plus ancienne.
4. **Page d'une version.** Un clic sur une ligne ouvre la page de la version :
   - l'en-tête : état, cycle de vie en mots, contenu, nom, date de l'étiquette ;
   - ses objectifs : pour chacun, le nombre de fiches de cette version et l'avancement total de
     l'objectif ;
   - ses fiches livrées, puis ses fiches à faire, chacune cliquable vers la fenêtre de fiche.
   Le titre d'une fiche vient de `ezk backlog show --json`, que le relais lit déjà.
5. **Ce qui n'est pas publié se dit.** Le bloc « Qui l'a livrée » de la maquette demande les
   lancements par version : la méthode ne les publie pas. La page l'écrit en une ligne, sans bloc
   vide.

### Les mots de l'état

| Publié par la méthode | Affiché |
|---|---|
| `en-cours` | en construction |
| `a-clore` | à clore : tout est livré, l'étiquette manque |
| `livree` | étiquetée |
| `rouverte` | rouverte |
| `vide` | vide |

## Critères d'acceptation

- [ ] Un fichier `features/versions/<v>.md` existe pour chaque version que le plan nomme, avec le
      nom du plan ; `ezk board show --json` publie ces noms.
- [ ] Le traducteur du plan relaie le nom, les objectifs et la date d'étiquette de chaque version,
      et la prochaine coupe. Un test fait passer l'exemple rangé du contrat et retrouve ces champs.
- [ ] Le menu Projet a une entrée « Versions », placée après « Fiches », qui ouvre la page.
- [ ] Le bloc « À versionner » montre la dernière étiquette, son âge, le nombre de fiches livrées
      depuis, le verdict de la gate et le numéro proposé ou « non publié ».
- [ ] Le bloc « En construction » liste les versions sans étiquette avec leur état en mots.
- [ ] La liste des versions étiquetées va de la plus récente à la plus ancienne, avec numéro, nom,
      fiches livrées, objectifs et âge.
- [ ] Un clic sur une version ouvre sa page ; le fil d'Ariane « Versions › v… » ramène à la liste.
- [ ] Chaque fiche de la page d'une version s'ouvre dans la fenêtre de fiche, avec son titre.
- [ ] Le bouton « Versionner » n'écrit rien ; il montre la commande de coupe.
- [ ] Une donnée non publiée s'écrit « non publié », jamais « 0 » ni une liste vide.

## Comment vérifier

```bash
ezk board show --json | jq '[.versions.lots[] | select(.nom != "")] | length'
pnpm --dir products/cop1/packages/app exec vitest run src/features/board/ezkPlanTranslator.test.ts
pnpm --dir products/cop1/packages/web exec vitest run src/board
pnpm cop1:dev
```

La première commande doit rendre 23. Dans mission control, ouvre « Versions », puis clique sur
v0.23.0. Compare avec les pages Versions et Version de la maquette.

## Glossaire

- **Coupe** : poser l'étiquette git d'une version sur ce qui est livré. C'est un geste du PO.
- **Prochaine coupe** : ce que la méthode propose de versionner ensuite, et le verdict de la gate.
- **Relais, ou traducteur** : le code de cop1 qui lit la réponse d'ezk et la passe à l'écran.

## Notes / décisions

- 2026-11-24 : fiche écrite à la demande du PO, qui veut construire la maquette. Les données sont
  publiées ; le travail est le relais et l'écran.
- Le rangement complet du menu est porté par la fiche
  [Le menu de mission control suit la maquette](../20261124111116126_menu-suit-la-maquette-anciennes-pages-retirees.md).

### Grooming du 2026-11-24

Fait par l'orchestrateur, sur délégation du PO (« Oui, groome-les »). Décisions :

- **Les noms viennent du plan.** Aucune version n'a de fichier d'identité : sans eux, toute la page
  dirait « nom non publié ». Le plan nomme 23 versions ; on recopie ces noms. La maquette nommait
  v0.19.0 à v0.22.0 « Lot aminci » ; le plan dit autre chose, et le plan fait foi.
- **Un bloc « En construction » en plus de la maquette.** Le projet a deux versions sans étiquette,
  v0.23.0 et v0.24.0. Sans ce bloc, on ne pourrait pas les ouvrir.
- **Pas d'adresse web pour la page.** La page s'ouvre comme le détail d'un lancement : par l'état
  de l'écran, avec un fil d'Ariane. Une adresse par vue est une proposition de la
  [rétro du 24 novembre](../../docs/captures/2026-11-24-retro-run-interface-mission-control-process.md),
  en attente du PO.
- **Le menu bouge un peu.** « Versions » s'ajoute après « Fiches ». Les anciennes pages restent
  jusqu'à la fiche du menu.
- **Données réelles au 24 novembre** : 24 versions, dernière étiquette v0.22.0, 126 fiches livrées
  depuis, gate GO, numéro proposé non publié.
- **Preuve avant/après** : un script de capture, faute d'adresse pour la commande de capture.
- **Taille : la fiche reste entière, sur décision du PO du 2026-11-24** (« Oui, telles quelles »).
  Le contrôle signale plus de six critères et trois surfaces : fichiers d'identité, relais, écran.
  Raison : chaque critère est petit, et l'ensemble a la taille de l'écran Process, livré en un
  sprint de 33 minutes. Passée « prête » le même jour.
