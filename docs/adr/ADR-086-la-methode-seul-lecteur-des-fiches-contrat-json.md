# ADR-086 — La méthode est le seul lecteur des fiches ; ses données sortent par `ezk … --json`

Statut : Proposed
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
- **Mission control** montre ce qui se passe en direct : les runs, les sessions, la chronologie. Il
  affiche aussi le board de la méthode, en le lisant par le contrat. Il garde son propre lanceur.

### 3. Un seul vocabulaire

« Board de la méthode », « mission control », « vue des sessions », « sélecteur de projet ». Les mots
*Moniteur*, *cockpit*, *dashboard* et *kanban* sont retirés ; le glossaire renvoie au bon mot.

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
