# Enquête — les deux boards et le contrat de la méthode (2026-10-30)

## En clair

Mission control ne demande pas ses fiches à la méthode : il **recopie** la façon de les lire et de les
compter. Mesurée sur les trois projets du registre, cette copie affiche des chiffres faux : le compteur
« en cours » reste à zéro, des fiches perdent leur statut, 34 fiches bloquées n'apparaissent nulle part.
La méthode sait déjà sortir ses fiches en JSON depuis août (`ezk board show --json`), « pour la future
vue web ». On propose d'en faire **le seul contrat** : la méthode lit et interprète, tout le reste
affiche.

**Si tu arrives frais.** La *méthode* (mega-city) gère les fiches du backlog : des fichiers markdown.
*Mission control* est le tableau de bord du produit cop1 : une page web plus un service qui tourne en
fond (le daemon). Le *board de la méthode* est un petit serveur sans dépendance, lancé par
`ezk board open`.

## La question posée

Le PO propose, le 2026-10-30 : la valeur de la méthode n'est pas son board, c'est la récupération des
fiches triées, organisées, traitées. Ce travail doit se faire en ligne de commande, derrière des
interfaces claires, avec des implémentations qui peuvent l'accélérer. Le board de la méthode affiche ce
résultat. Mission control l'obtient par la même ligne de commande. La méthode reste indépendante, mais
d'autres projets peuvent s'en servir.

Cette enquête vérifie, avant toute décision, ce que fait le code aujourd'hui.

## Constat 1 — Mission control recopie la méthode

Le daemon cop1 compose chaque projet à partir de quatre sources. Trois sont des copies.

| Ce que fait mission control | Où, chez cop1 | L'original, dans la méthode |
|---|---|---|
| Lire le front-matter des fiches | `products/cop1/packages/app/src/features/board/backlogReader.ts:133` (parseur YAML strict) | `products/mega-city/src/loaders/fiches.ts:88` (lecture ligne à ligne, tolérante) |
| Classer les statuts (terminaux, en cours, parkées) | `backlogReader.ts:61`, `:62`, `:64` | `products/mega-city/src/core/fiche-schema.ts:68`, `:76` |
| Compter « en cours » | `backlogReader.ts:93` (lit `status: in-progress`) | `products/mega-city/src/io/sessions-collect.ts:70` (déduit des branches, ADR-0077) |
| Grouper par version, trouver la version en cours | `backlogReader.ts:88` | `products/mega-city/src/backlog/versions.ts:203` et `version-scope.ts:33` |
| Extraire le détail d'une fiche (modale) | `products/cop1/packages/app/src/features/board/ficheDetail.ts` | **aucun** : le board de la méthode sert la fiche brute (`bin/ezk-map.ts:310`) |
| Lire les étiquettes git | `boardProvider.ts:89` : **appelle `git`**, ne le recopie pas | — |
| Lire les journaux des runs | `boardProvider.ts:119` : sa vraie spécialité | — |

La copie est volontaire. L'ADR-021 interdit à cop1 d'importer le code de mega-city
(commentaire en tête de `backlogReader.ts`). L'équipe a donc réécrit la lecture chez cop1.

Mais cop1 dépend déjà de la méthode : il connaît le format de ses fiches et une partie de ses règles.
Simplement, il ne le dit pas, et il en garde une copie qui vieillit.

## Constat 2 — La copie a divergé : les mesures

Le script voisin [`mesure-ecarts.ts`](mesure-ecarts.ts) appelle le vrai code des deux côtés. Il
donne deux preuves.

**La preuve stable : une fixture.** Le script fabrique un faux projet, avec une fiche par cause et le
résultat attendu pour chacune. Ce résultat ne bouge pas d'un jour à l'autre :

```
✓ 1. en cours : la méthode voit 1 fiche, mission control 0
✓ 2. titre avec « : » : la méthode lit le statut, mission control le perd
✓ 3. bloquée : la méthode la voit, mission control n'a pas le champ
✓ 4. v1.0.0 : la méthode compte 3 fiches, mission control 4 (avec la remplacée)
✓ 5. V1.1 : la méthode la signale illisible, mission control la fait disparaître
```

**La photo des vrais projets**, prise le 2026-10-31 à 17 h. « ≠ » marque un écart. Ces chiffres
changent d'un jour à l'autre : une branche se fusionne, une fiche s'ajoute. La veille, muti avait une
fiche en cours ; mission control affichait 0.

```
                 vectorz            muti               samplerz
                 méthode  m.c.      méthode  m.c.      méthode  m.c.
idées            11       11      ≠ 66       65        34       34
prêtes           1        1         15       15        5        5
en cours         0        0         0        0         0        0
sans version     10       10      ≠ 63       66        27       27
parkées          88       88      ≠ 21       19        0        0
livrées          399      399       141      141       15       15
version en cours v0.23.0  v0.23.0   v1.8.0   v1.8.0    —        —
```

Les compteurs du haut se ressemblent. Les écarts viennent de cinq causes. Chacune a son cas dans la
fixture, et a été retrouvée fiche par fiche dans les vrais projets.

1. **« En cours » est toujours à zéro dans mission control.** La méthode déduit « en cours » des
   branches git depuis le 2026-10-14 (ADR-0077). Le lecteur de cop1, écrit le 2026-10-24, lit encore le
   champ `status: in-progress` (`backlogReader.ts:93`). Aucune fiche ne le porte : le validateur de la
   méthode le refuse. Le compteur de mission control ne peut donc jamais dépasser zéro.
2. **Un titre qui contient « : » fait perdre la fiche.** Le parseur YAML strict de cop1 échoue sur un
   titre comme « tour interactif Driver.js : tracking ». La fiche garde son id mais perd statut,
   version et milestone. 10 fiches touchées (5 vectorz, 5 muti, dont 3 actives sur muti). La méthode
   les lit sans erreur.
3. **Les fiches bloquées sont invisibles.** Mission control ignore le champ `blocked:` (ADR-085).
   Le 2026-10-31, 34 fiches actives bloquées disparaissaient : 25 vectorz, 2 muti, 7 samplerz.
4. **Les barres de progression des versions sont fausses.** Mission control compte dans le total d'une
   version les fiches closes sans livraison (remplacées, fusionnées, découpées). La méthode les sort du
   lot. 21 fiches touchées (16 vectorz, 5 muti). Exemple : la v0.1.0 de vectorz apparaît livrée à
   8 sur 14, alors qu'elle est complète.
5. **Une version mal écrite disparaît en silence.** samplerz écrit `V1.1`. La méthode signale ces 19
   fiches comme « version illisible ». Mission control les ignore sans rien dire.

À cela s'ajoute un comportement de repli : sans daemon, mission control affiche un **échantillon
fictif** de fiches et de jetons (la consommation des LLM) (`products/cop1/packages/web/src/board/Board.tsx:140` et
`src/board/data.ts`). L'écran le signale, mais les chiffres ressemblent à des vrais.

## Constat 3 — La méthode a déjà commencé le contrat

`ezk board show --json` existe depuis le 2026-08-25 (`products/mega-city/bin/avancement.ts:6`). Son
commentaire dit : « données pour la future vue web ». La méthode avait donc prévu qu'une page web
consomme sa sortie. Mission control a été construit à côté, sans s'en servir.

Ce qu'il sort déjà, testé sur muti en une seconde environ : les comptes par statut, le nombre de fiches
tirables (« en cours » déduit des branches), les fiches actives avec leur drapeau `blocked:`, le cumul
par milestone, les filtres.

Ce qui lui manque pour remplacer la copie de cop1 :

- la **version** de chaque fiche, et les lots de version avec leur cycle de vie (brouillon, figée,
  livrée) — `ezk backlog version` ne sort que du texte ;
- la liste explicite des fiches **en cours** ;
- le **détail** d'une fiche (en clair, contexte, critères, comment vérifier) ;
- les **pouces** de revue posés ;
- un **numéro de version du format**, pour que le consommateur sache ce qu'il lit ;
- les **comptes déjà interprétés**. Aujourd'hui `counts.idea` mélange les idées et les fiches
  parkées. Pour afficher l'entonnoir, un consommateur devrait encore trier lui-même : c'est
  exactement le travail qu'on veut lui retirer.

Le calcul existe déjà pour tout cela, sauf le détail d'une fiche. Il manque surtout l'exposition en
JSON. Le découpage d'une fiche en sections, lui, n'existe que chez cop1 : c'est la seule pièce à
**déplacer** dans la méthode plutôt qu'à exposer.

## Constat 4 — Les ambiguïtés dans les documents

Recensement complet du dépôt et des mémoires, le 2026-10-31 : environ 1 440 occurrences examinées
(ADR 279, docs 182, fiches actives 341, mémoires 311, code 277, skills et manifeste 52). Les points
clés ont été revérifiés à la main. Cinq familles de problèmes.

### Les décisions se contredisent

- L'ADR-074 (accepté) dit « un seul board remplace les trois surfaces ». L'ADR-086 (proposé) garde
  deux boards. L'ADR-074 n'est ni amendé ni remplacé.
  `docs/adr/ADR-074-board-unifie-run-moments-fiches-deux-portees-config.md:19`
- L'ADR-074 refait la fusion que l'ADR-0062 avait écartée, sans le citer.
  `products/mega-city/docs/adr/0062-le-tableau-de-bord-devient-le-cockpit-multi-projets.md:78`
- La fiche maître dit encore « le neuf remplace le vieux », et ses critères demandent de supprimer
  ezk-map. Elle est `ready`. L'ADR-086 dit l'inverse.
  `features/20261029112813308_retirer-vieux-board-repointer-ezk-board.md:118` (avant son regroom du
  2026-10-31)
- Le plan annonce deux fois « un seul tableau de bord », pour deux boards différents.
  `features/PLAN.md:73` (v0.6, le board de la méthode) et `features/PLAN.md:84` (v0.17, cop1)

### Des faits sont faux

- L'ADR-074 écrit que la webapp cop1 « avait trois tableaux de bord », dont le cockpit et ezk:map.
  C'est faux : ces deux-là vivent dans mega-city (`bin/ezk-map.ts`).
- L'ADR-086 et la fiche maître écrivent que mission control « renvoie par un lien » vers les pages
  `diagrams/`. En réalité, cop1 garde une **copie figée** de 10 fichiers, dont 4 pages HTML, committée
  le 2026-10-18
  (`products/cop1/packages/web/public/v1/`). Cette copie contient même un fichier de données généré,
  que l'ADR-0055 interdit de committer (`carte-interactive.data.js`).
- Il existe **deux pages de config** : celle du board de la méthode (`bin/ezk-map.ts:52`) et celle de
  mission control (`web/src/board/ToolConfigView.tsx`). Aucun document ne dit laquelle fait foi.

### Des commandes n'existent plus

- `ezk map` et `ezk dashboard` répondent « commande inconnue ». Pourtant `pnpm ezk:map` et
  `pnpm ezk dashboard` restent écrits dans le `README.md`, `docs/GETTING_STARTED.md`,
  `docs/faq-comment-faire.md`, le skill `ezk-backlog`, les ADR-0055, 0057 et 0062, et des pages de
  `diagrams/`.
- Le script `pnpm ezk:map` lui-même est cassé : il lance `ezk map` (`package.json:23`,
  `products/mega-city/package.json:19`). Le `bin/README.md:22` affirme pourtant qu'il « marche
  toujours ».
- L'aide du board de la méthode renvoie vers cette commande morte (`bin/ezk-map.ts:184`, `:197`).

### Un même mot désigne plusieurs choses

- **« board »** a trois sens : le kanban texte (`ezk board show`, `ezk board check`), le board web de
  la méthode (`ezk board open`), et mission control. Plusieurs skills disent « côté board » sans
  préciser.
- **« cockpit »** a trois sens : la vue des sessions (`ezk sessions open`), le sélecteur de projets du
  board de la méthode (ADR-0062), et une ancienne surface de cop1 (ADR-074).
- **« Moniteur »** désigne une application supprimée. Le mot reste dans 7 guides utilisateur, la CLI
  de cop1 et 6 skills (« le Silence prolongé du Moniteur »).
- **« mission-control »** est un nom de l'époque 1, devenu le nom d'une config de lancement.
- **« le nouveau dashboard »**, sans préciser lequel, dans la fiche
  `features/20261029093423195_*.md:3`.

### Les mémoires de l'assistant se contredisent

- Aucune mémoire ne mentionne l'ADR-086 ni la fiche maître.
- Une mémoire dit « ezk-map devient le cockpit » (ADR-0062), une autre « un seul board, cop1 »
  (ADR-074).
- Plusieurs mémoires citent des commandes mortes (`pnpm ezk:map`, `ezk board regen`) ou un état
  périmé (« ezk-map reste en lecture seule », faux depuis le pouce de l'ADR-0057).

### Ce que ça demande

Un **vocabulaire unique**, décidé une fois, puis appliqué partout. Proposition à valider :

| Mot | Désigne | Commandes |
|---|---|---|
| board de la méthode | les fiches d'un projet, lues et interprétées par la méthode, sous toutes leurs formes | `ezk board open` (page web), `ezk board show` (texte, ou JSON avec `--json`), `ezk board check` (cohérence des vues) |
| mission control | la page web cop1 et son daemon : les runs en direct, plus le board de la méthode qu'il affiche | lanceur propre à cop1 |
| vue des sessions | l'ex-« cockpit » de sessions | `ezk sessions open` |
| sélecteur de projet | la barre « Projet » du board de la méthode | — |
| *Moniteur*, *cockpit*, *dashboard*, *kanban* | retirés ; le glossaire renvoie au bon mot | — |

Avec ce découpage, le mot « board » ne garde qu'un sens dans les commandes : `ezk board …` désigne
toujours le board de la méthode. La vue texte n'est pas un objet à part : c'est le même board, écrit
en texte au lieu d'une page web. Aucune commande n'est renommée.

Puis un nettoyage en un passage : commandes mortes corrigées, ADR-074 et ADR-021 amendés, copie
figée `public/v1` tranchée (la garder comme archive assumée, ou la retirer), fiche maître réécrite,
mémoires corrigées.

## L'architecture proposée

```
fichiers .md du projet
   │
   ▼
LA MÉTHODE : le seul lecteur, le seul interprète
   ezk … --json        (format versionné, documenté, testé)
   │
   ├──▶ board de la méthode   affiche ; ne relit jamais les fiches lui-même
   ├──▶ un LLM, un script     lit le JSON, ou les fichiers à la main
   └──▶ mission control       appelle `ezk`, comme il appelle déjà `git`
                              + ajoute ce qu'il est seul à savoir : les runs en direct
```

Les règles, sans exception :

1. **La méthode est le seul programme qui interprète une fiche.** Statut, en cours, version, blocage,
   parkage : une seule implémentation, dans mega-city.
2. **Elle expose ce qu'elle calcule par `ezk … --json`.** Le format porte un numéro de version. Un
   changement incompatible change ce numéro.
3. **Tout autre programme consomme ce JSON.** Il ne relit pas le front-matter pour l'interpréter.
   Mission control supprime `backlogReader.ts` et `ficheDetail.ts`.
4. **Seules les commandes `ezk` écrivent dans un projet.** Le pouce de revue compris (ADR-0057). Si
   mission control veut un jour poser un pouce, il appelle `ezk`.
5. **La dépendance va dans un seul sens.** cop1 appelle `ezk`. La méthode ne connaît pas cop1 et ne le
   lance jamais.
6. **Sans `ezk`, ou avec un format qu'il ne connaît pas, mission control le dit.** Il affiche les
   runs et un message clair : « plan indisponible : installe ezk », ou « format ezk v3, attendu v2 ».
   Pas de copie de secours, pas d'échantillon fictif qui ressemble à des vrais chiffres.
7. **L'accélération se fait derrière le contrat.** Un cache, un service plus rapide : permis, tant que
   la sortie JSON reste identique. Un test de parité le prouve.
8. **Mission control n'attend jamais `ezk` en bloquant.** Il l'appelle sans figer son daemon, et sert
   la dernière réponse connue pendant le calcul. Aujourd'hui, le daemon appelle `git` en bloquant
   (`boardProvider.ts:89`) : un appel `ezk` d'une seconde, multiplié par le nombre de projets, le
   figerait.
9. **Les tests de cop1 ne lancent pas `ezk`.** Ils lisent des exemples de JSON produits par `ezk` et
   rangés dans le dépôt. Un test de contrat, côté méthode, vérifie que ces exemples restent à jour.
   Mission control garde ainsi un cœur d'affichage pur, testable sans disque.

## Ce que ça change dans les décisions

- **ADR-021** (frontière cop1 ↔ mega-city) : à **amender**. cop1 n'importe toujours aucun code de
  mega-city, mais il dépend désormais, officiellement, de la commande `ezk` et de son format JSON.
- **ADR-074** (un seul board) : à **amender**. Il y a deux boards, de rôles différents, qui lisent la
  même source.
- **ADR-0062** (le cockpit dans le board de la méthode) : **confirmé**. Son argument tient : la méthode
  ne doit pas dépendre d'un branchement.
- **ADR-086** (Proposed) : à **réécrire** autour de ce contrat.
- **ADR-0005** (fichiers d'abord, service vivant optionnel) : **respecté dans l'esprit, avec un
  coût**. Les fichiers restent la seule source : un humain ou un LLM peut toujours les lire
  directement. `ezk` n'est pas un service qui tourne : c'est une commande qui calcule à la demande,
  comme un export. Mais mission control dépendra d'un outil installé pour afficher son plan. C'est
  ce coût qu'il faut écrire dans l'ADR-021.

## Questions ouvertes, pour la revue

1. **Existe-t-il un `ezk` livrable ?** Aujourd'hui, `ezk` est un lien vers le dépôt vectorz du poste :
   `~/.local/bin/ezk` est un lien direct vers `products/mega-city/bin/ezk.mjs`. Sur
   une autre machine ou en CI, il faut ce dépôt. Aucun paquet n'est publié : la distribution est
   différée (fiche 0087). Tant que mission control vit dans le même monorepo, il peut appeler ce
   chemin. Au-delà, il faudra un `ezk` installable.
2. **Une commande par vue, ou une seule sortie complète ?** Par exemple `board show`,
   `backlog version` et `backlog show <id>`, chacune avec `--json`.
3. **Quel temps est acceptable ?** Un appel coûte une demi-seconde à une seconde. Il faut le mesurer
   dans le daemon, avec tous les projets du registre et un appel non bloquant, puis fixer un seuil.
4. **La copie figée `public/v1` de cop1** : la garder comme archive assumée, ou la retirer au profit
   des pages servies par la méthode ?
5. **La vue « runs » de la méthode** (`diagrams/runs/`) et celle de mission control font-elles double
   emploi ?

## Plan de validation

Rien ne se livre sans ces six preuves.

1. **Le format est tenu.** Un test de contrat dans mega-city vérifie la sortie de chaque commande
   `--json` contre son schéma, et que les exemples rangés pour cop1 sont à jour.
2. **Les chiffres sont les mêmes.** La fixture du script devient un test de parité : mission control
   affiche exactement ce que la méthode calcule, pour chacune des cinq causes. Les vrais projets
   servent de contrôle en plus, jamais de preuve : leurs chiffres bougent.
3. **Le temps reste acceptable.** On mesure dans le daemon, avec tous les projets du registre et un
   appel non bloquant. On vérifie que le daemon répond toujours pendant le calcul.
4. **L'absence d'`ezk` est dite.** Un test lance mission control sans `ezk` : il affiche les runs et le
   message, jamais l'échantillon.
5. **Un format inconnu est dit.** Un test donne à mission control un JSON d'une autre version : il
   affiche le message, jamais un écran faux.
6. **L'écran le montre.** Capture avant / après de mission control sur un projet de démonstration
   **persistant**, construit comme la fixture et inscrit au registre : « en cours » passe de 0 à 1, la
   fiche bloquée apparaît, la version remplacée ne fausse plus la barre. La fixture du script, elle,
   est effacée à chaque passage : elle prouve les chiffres, pas l'écran.

## Revue adverse

Le 2026-10-31, `ezk-reviewer` a rejoué le script et vérifié plus de 15 références. Verdict : NO-GO
sur la première version du dossier, le fond confirmé. Deux défauts bloquants : le tableau des vrais
projets ne correspondait plus au script rejoué le lendemain, et la preuve de l'écran reposait sur une
fiche de muti qui n'était plus en cours. Correction : la preuve stable est désormais la fixture, et la
photo des vrais projets est datée. Les autres remarques sont intégrées : `ezk` livrable (question 1),
daemon non bloquant (règle 8), tests de cop1 sans `ezk` (règle 9), format inconnu (règle 6),
comptes déjà interprétés (constat 3), coût vis-à-vis de l'ADR-0005, vocabulaire sans « kanban »,
« 10 fichiers dont 4 pages ».

## Comment rejouer les mesures

```bash
cd products/mega-city && pnpm exec tsx ../../docs/captures/2026-10-30-enquete-boards/mesure-ecarts.ts
```

```bash
ezk --root /Users/elzinko/git/bacasable/muti board show --json
```
