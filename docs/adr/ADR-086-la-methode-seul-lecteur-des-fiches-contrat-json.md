# ADR-086 — La méthode est le seul lecteur des fiches ; ses données sortent par `ezk … --json`

Statut : accepté (PO, 2026-11-01) ; amendé le 2026-11-02, un seul écran, et le 2026-11-14, les mots de l'écran (voir les amendements en fin) ; amendé le 2026-11-14 par [ADR-0088](../../products/mega-city/docs/adr/0088-deux-plans-milestone-unite-du-lancement-version-coupe.md) pour ce que la méthode publie sur les versions
Date : 2026-10-31 (remplace la version du 2026-10-29, « `ezk board` reste portable »)
Décideurs : PO, après deux panels adverses et une enquête passée en revue adverse
Amende : [ADR-074](ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md) décision 1 ·
[ADR-021](ADR-021-megacity-integration-boundary.md) décision 2
Confirme : [ADR-0062](../../products/mega-city/docs/adr/0062-le-tableau-de-bord-devient-le-cockpit-multi-projets.md)
S'appuie sur : [ADR-0005](../../products/mega-city/docs/adr/0005-modes-de-consommation-export-mcp.md) ·
[ADR-0077](../../products/mega-city/docs/adr/0077-in-progress-statut-calcule-non-ecrivable.md) ·
[ADR-0057](../../products/mega-city/docs/adr/0057-le-tableau-de-bord-ecrit-un-seul-dossier.md)
Enquête : [les deux boards et le contrat de la méthode](../captures/2026-10-30-enquete-boards/README.md)

## En clair

Deux tableaux de bord affichent les fiches : le board de la méthode et mission control. Aujourd'hui,
chacun les lit et les interprète à sa façon, et mission control affiche des chiffres faux. On décide :
**la méthode est le seul programme qui interprète une fiche**. Elle publie le résultat en JSON, par la
commande `ezk`. Les deux boards affichent ce résultat ; mission control y ajoute les runs en direct.

```
fichiers .md du projet
   │
   ▼
la méthode : seul lecteur, seul interprète
   ezk … --json   (format versionné, documenté, testé)
   │
   ├──▶ board de la méthode   affiche
   ├──▶ un LLM, un script     lit le JSON, ou les fichiers à la main
   └──▶ mission control       appelle `ezk`, comme il appelle déjà `git`,
                              et ajoute les runs en direct
```

## Contexte

L'enquête du 2026-10-30 a établi trois faits. Le détail et les preuves rejouables sont dans le dossier.

1. **Mission control recopie la méthode.** Son daemon relit lui-même les fiches et applique sa propre
   copie des règles (`backlogReader.ts`, `ficheDetail.ts`). L'ADR-021 lui interdit d'importer le code
   de mega-city : l'équipe a donc réécrit la lecture.
2. **La copie a divergé.** Une fixture reproduit cinq écarts : « en cours » toujours à zéro, une fiche
   perdue si son titre contient « : », les fiches bloquées invisibles, des barres de version faussées
   par les fiches remplacées, les versions mal écrites qui disparaissent en silence.
3. **La méthode avait commencé le contrat.** `ezk board show --json` existe depuis le 2026-08-25,
   « pour la future vue web ». Mission control a été construit à côté, sans s'en servir.

Les décisions passées se contredisaient. L'ADR-0062 mettait le cockpit dans le board de la méthode.
L'ADR-074 déclarait « un seul board », dans cop1, sans citer l'ADR-0062. La première version de cet
ADR gardait deux boards qui lisaient chacun les fiches. Cette version les réconcilie.

## Décision

### 1. Un seul interprète

1. La méthode est le seul programme qui interprète une fiche : statut, en cours, version, blocage,
   parkage. Une seule implémentation, dans mega-city.
2. Elle expose ce qu'elle calcule par `ezk … --json`. Le format porte un numéro de version ; un
   changement incompatible change ce numéro. Les comptes sortent déjà interprétés.
3. Tout autre programme consomme ce JSON. Il ne relit pas le front-matter pour l'interpréter.
4. Seules les commandes `ezk` écrivent dans un projet, le pouce de revue compris (ADR-0057).
5. La dépendance va dans un seul sens : cop1 appelle `ezk`. La méthode ne connaît pas cop1 et ne le
   lance jamais.
6. Sans `ezk`, ou avec un format inconnu, mission control le dit et affiche ses runs. Pas de copie de
   secours, pas d'échantillon fictif.
7. L'accélération (cache, service plus rapide) se fait derrière le contrat, à sortie identique. Un
   test de parité le prouve.
8. Mission control n'attend jamais `ezk` en bloquant son daemon.
9. Les tests de cop1 lisent des exemples de JSON rangés dans le dépôt. Un test de contrat, côté
   méthode, vérifie qu'ils restent à jour.

### 2. Deux boards, deux rôles

- **Le board de la méthode** montre ce qui se calcule depuis les fichiers d'un projet : les fiches et
  leur détail, le plan et les versions, les cartes de `diagrams/`, la config en lecture, le pouce.
  Commandes : `ezk board open` (page web), `ezk board show` (texte, ou JSON avec `--json`),
  `ezk board check` (cohérence des vues).
- **Mission control** montre ce qui se passe en direct : les sprints, les sessions et leurs lancements, la
  chronologie. Il affiche aussi le board de la méthode, en le lisant par le contrat. Il garde son propre
  lanceur. *(Amendé le 2026-11-14 : « run » n'est plus un mot d'écran ; voir l'amendement en fin.)*

### 3. Un seul vocabulaire

« Board de la méthode », « mission control », « vue des sessions », « sélecteur de projet ». Les mots
*Moniteur*, *cockpit*, *dashboard* et *kanban* sont retirés ; le glossaire renvoie au bon mot.

*Amendé le 2026-11-14 :* les mots d'écran sont ceux de Scrum, et « module » nomme ce qui se branche par
projet ; la méthode n'en est pas un. La liste complète est dans l'amendement en fin.

### 4. Le découpage

Le chantier se découpe en quatre fiches sœurs, liées par `milestone: board`, sans fiche chapeau :

1. le contrat JSON de la méthode, complet et versionné ;
2. le détail d'une fiche calculé par la méthode ;
3. mission control qui consomme `ezk` au lieu de recopier ;
4. le nettoyage du vocabulaire et des commandes mortes.

## Amendements

- **ADR-074, décision 1.** « Un seul board remplace les trois surfaces » devient : deux boards de rôles
  différents, qui lisent la même source par le même contrat.
- **ADR-021, décision 2.** « cop1 n'a aucune connaissance de mega-city » devient : cop1 n'importe aucun
  code de mega-city ; il appelle la commande `ezk` et lit son JSON versionné. Il dépendait déjà du
  format des fiches, sans le dire.
- **ADR-0062** est confirmé : la méthode ne dépend pas d'un branchement.

## Options considérées

| Option | Pourquoi |
|---|---|
| A. Mission control remplace le board de la méthode (ADR-074 tel quel) | Écartée. La méthode dépendrait d'un produit, et chaque projet devrait faire tourner le daemon. |
| B. Deux boards, chacun lit les fiches (première version de cet ADR) | Écartée. Deux lecteurs divergent : la fixture le prouve. |
| C. Deux boards, un seul lecteur, contrat `ezk … --json` | **Retenue.** Proposition du PO du 2026-10-30. |
| D. cop1 importe le code de mega-city | Écartée. Couplage de code interdit par l'ADR-021 ; deux produits à livrer ensemble. |

## Conséquences

Deviennent plus faciles :
- une règle changée dans la méthode s'affiche partout, sans recopie ;
- un LLM, un script ou un autre produit peut lire les fiches interprétées sans réimplémenter la
  méthode.

Deviennent plus durs ou assumés :
- mission control dépend d'un `ezk` installé. Aujourd'hui, `ezk` est un lien vers le dépôt vectorz du
  poste ; hors du monorepo, il faudra un `ezk` livrable (fiche 0087, différée) ;
- un appel `ezk` coûte une demi-seconde à une seconde : le daemon l'appelle sans bloquer et garde la
  dernière réponse ;
- l'ADR-0005 est respecté dans l'esprit : les fichiers restent la source, `ezk` calcule à la demande
  comme un export. Mais l'affichage du plan dans mission control exige l'outil.

À revisiter :
- le seuil de temps acceptable, mesuré dans le daemon avec tous les projets ;
- le sort de la copie figée `products/cop1/packages/web/public/v1` ;
- un éventuel doublon entre la vue « runs » de la méthode et celle de mission control.

## Provenance

- Panel du 2026-10-29 (architecte + reviewer) : première version, « deux portes ».
- Panel du 2026-10-30 (architecte + reviewer) : l'idée de ports du PO est la philosophie d'origine
  (ADR-0005, ADR-0004), jamais appliquée au board.
- Proposition du PO du 2026-10-30 : la valeur est la lecture des fiches, pas le board ; un contrat en
  ligne de commande que mission control consomme.
- Enquête du 2026-10-30/31, revue par `ezk-reviewer` : NO-GO sur la première version du dossier,
  corrigé (fixture stable, photo datée, questions ouvertes nommées).

## Amendement du 2026-11-02 (décision PO du 2026-11-02) — un seul écran

### En clair

La méthode n'a plus d'écran à elle. Elle garde sa ligne de commande : du texte pour l'humain, du JSON
pour les programmes. Mission control devient le seul écran. La page web de la méthode
(`ezk board open`) est retirée quand mission control montre tout ce qu'elle montre, pas avant.

```
avant    fiches → ezk (seul lecteur) → page web de la méthode
                                     → JSON → mission control

après    fiches → ezk (seul lecteur) → texte dans le terminal
                                     → JSON → mission control (seul écran)
```

Motif du PO : « juste de quoi faire ce que la méthode doit faire avec un cli, et le mission control
affiche tout ».

### Ce qui change dans la décision 2

- **La méthode** : `ezk board show`, `ezk board check` et toutes les commandes `ezk … --json`. Elle
  reste utilisable seule, dans un terminal. Ses documents (`diagrams/`) restent des fichiers du dépôt.
- **Mission control** : le seul écran. Il lit la méthode par ses contrats. Il n'écrit dans un projet
  que par une commande `ezk`, le pouce de revue compris (décision 1, point 4).
- **`ezk board open`** et son serveur `bin/ezk-map.ts` sont retirés à la fin du portage.

Les décisions 1, 3 et 4 ne changent pas.

### Pourquoi l'option A devient acceptable

L'option A (« mission control remplace le board de la méthode ») était écartée pour deux raisons.

1. **« La méthode dépendrait d'un produit. »** Ce n'est plus vrai : la méthode reste complète par sa
   ligne de commande. Mission control reste optionnel.
2. **« Chaque projet devrait faire tourner le daemon. »** C'est assumé : pour voir en graphique, on
   lance mission control. Pour lire, le terminal suffit.

### Ce qui est porté avant le retrait

Rien ne se perd : chaque page de la méthode a son remplaçant avant le retrait.

| Page de la méthode (`ezk board open`) | Dans mission control | Fiche |
|---|---|---|
| Avancement : fiches, plan, versions | vue d'ensemble, Fiches | déjà là |
| Les coupes, la prochaine coupe, les objectifs nommés (`coupes[]`, `prochaineCoupe`, `milestones[]` v2 — [ADR-0088](../../products/mega-city/docs/adr/0088-deux-plans-milestone-unite-du-lancement-version-coupe.md), amendement du 2026-11-14) | Versions, Objectifs | [les versions publiées](../../features/20261114131612759_versions-publiees-comme-coupes.md), [les objectifs publiés](../../features/done/20261114131612572_objectifs-publies-comme-objets.md) |
| Choix du projet, config en lecture | sélecteur de projet, Configuration | déjà là |
| Le pouce de revue | la fenêtre d'une fiche | [la commande](../../features/done/20261102123552181_pouce-de-revue-par-une-commande-ezk.md), puis [le bouton](../../features/done/20261102151630248_mission-control-pose-le-pouce-de-revue.md) |
| Pilotage et historique des runs | une vue « Pilotage » | [pilotage](../../features/done/20261102123552182_mission-control-montre-le-pilotage.md) |
| Process | la vue « Process » | [process](../../features/done/20261102123552183_mission-control-montre-le-process.md) |
| La loi | une vue « Loi » | [la loi](../../features/done/20260826222044335_carte-la-loi-graphe-visuel.md) |
| Sept documents : carte de la méthode, domaine, qualité (4), benchmark | une vue « Cartes » | [cartes](../../features/done/20261102123552184_mission-control-montre-les-cartes-de-la-methode.md) |

Le retrait vient en dernier, quand toutes les fiches de portage sont livrées :
[retirer la page web de la méthode](../../features/done/20261102123552185_retirer-la-page-web-de-la-methode.md).

### Conséquences

- Un projet hôte sans mission control n'a plus de vue graphique : il lit dans le terminal.
- Les fiches qui prévoyaient une page dans le board de la méthode visent désormais mission control :
  [une page d'accueil par projet](../../features/20261002115451451_page-une-ligne-par-projet.md) et
  [la page des rétros passées](../../features/20260826072532537_vue-retros-actions-ezk-map.md).
- Le doublon de la vue « runs », noté plus haut à revisiter, disparaît : l'historique vit dans la vue
  « Pilotage » de mission control.
- « Board de la méthode » (décision 3) désigne désormais ce que publient `ezk board show` et les
  contrats, plus une page.

## Amendement du 2026-11-14 (décisions PO des 11, 12 et 14 novembre) — les mots de l'écran

### En clair

Mission control parle Scrum. Les mots d'écran sont fixés une fois : **sprint**, **but du sprint**, **lot**,
**incrément**, **rétro**, **version**, **objectif**, **jalon**, **session**, **lancement**, **module**.
« Run » n'est plus un objet d'écran : il se lit « lancement » dans le fil d'une session, et reste le mot
du journal de supervision et de la ligne de commande. La méthode n'est pas un module de mission control :
c'est ce que mission control lit.

### Les mots, et ce qu'ils désignent

| Mot d'écran | Ce qu'il désigne | Où c'est tranché |
|---|---|---|
| sprint, lot, incrément, rétro, version | les mots du Scrum Guide, tels que la méthode les joue | ADR-0054 § Nommage |
| but du sprint | le Sprint Goal ; ce que `ezk-sprint start --objective` saisit (drapeau interne) | ADR-0054 § Nommage, amendement du 2026-11-14 ; confirmé par le PO le 15 novembre |
| objectif | la milestone, unité de préparation (champ `milestone:` des fiches) | ADR-0083 ; décision PO du 11 novembre |
| jalon | le gate : un arrêt du lancement où la méthode pose une question | mot d'écran déjà en place (chronologie) |
| session | une branche et son dossier de travail, au sens de Claude Code | ADR-0054 § Nommage, ADR-079 |
| lancement | une exécution de la méthode, tracée dans le journal (`run.started`…) | cet amendement |
| module | ce qu'une configuration de projet allume ou éteint : GitHub, CI, Codex | glossaire du dépôt ; cet amendement remplace « plugin » et « intégration » dans la décision 3 |

### Ce qui change dans la décision 2

- Mission control montre des sprints, des sessions et leurs lancements, puis la chronologie ; plus « des runs ».
- Le menu range par **portée**, pas par produit : « Global » (les projets, l'annuaire de la méthode) et
  « Projet · <nom> » (ses vues). Le nom de la méthode ne sert plus que de titre à son annuaire.
  Décision du panel du 11 novembre, amendée le 12 :
  [capture](../captures/2026-11-11-panel-loi-projet-annuaire-maquette.md).

### Ce qui n'est PAS renommé

- l'évènement `run.started` et le contrat de supervisabilité gelé `cop1/supervisability@0.2`
  ([ADR-084](ADR-084-surface-emission-declaree-et-moments.md) : aucun renommage interne) ;
- l'alias `ezk-sprint run` et les verbes `ezk run …` (ADR-0054, périmètre du POC) ;
- le mot « run » dans les ADR passés : ils se lisent avec cette table.

### Décisions structurantes du PO du 14 novembre (matière d'ADR)

Trois décisions prises par le PO le 14 novembre (déléguées à la session pilote). Les décisions 1 et 3 sont
structurantes : le panel adverse de la coupe les a vérifiées le même jour, question 9 de sa
[capture](../captures/2026-11-14-panel-coupe-deux-plans-milestone-version.md) : cohérentes avec le modèle à deux plans, et renforcées par lui. La décision 5 est
prise par le PO, hors panel.

**Décision 1 — le numéro d'un sprint.** C'est le compte continu depuis le début du projet (…28, 29), calculé
depuis l'historique des sprints scellés et émis par `ezk board show --json`. Le compteur qui repart à 1 par
branche (journal de branche sous `<git-common-dir>/ezk/sprints/`) est un artefact local : il ne se publie
jamais comme le numéro. Un sprint se rattache à un objectif, jamais à une version. Build :
[Le sprint se publie avec son numéro continu, son but et sa branche](../../features/20261114131612204_sprint-publie-numero-but-branche.md).

**Décision 3 — le graphe de la méthode.** Les liens se déclarent dans le front-matter des objets de process ;
la méthode les compile en un seul bloc typé (adjacence, étage, orphelins, provenance) ; ce bloc compilé est
le contrat publié ; `ezk graph check` le lit, il n'est pas un deuxième canal. Les objets se déclarent, la
méthode extrait, mission control consomme (décision 1 de cet ADR). Build :
[Le graphe de la méthode en un contrat compilé](../../features/20261114131614982_graphe-de-la-methode-en-contrat-compile.md).

**Décision 5 — `ezk rules show`.** Il reste, comme vue documentée et mince de `ezk law show` : un seul
moteur, `rules show` = `law show` filtré ; ADR-0062 et la rétro s'en servent, donc ni retrait ni
implémentation parallèle. Build :
[Un seul lecteur de la loi du projet](../../features/20261114131615534_un-seul-lecteur-de-la-loi-du-projet.md).

La décision 2 (le nom en clair d'un objectif et d'une version vit dans le front-matter de l'objet lui-même,
pas dans `PLAN.md`) est portée par l'[ADR-0088](../../products/mega-city/docs/adr/0088-deux-plans-milestone-unite-du-lancement-version-coupe.md), la coupe, accepté par le PO le 15 novembre après ce panel.
