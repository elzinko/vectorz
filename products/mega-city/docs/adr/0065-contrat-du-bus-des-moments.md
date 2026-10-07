# ADR-0065 — Le contrat du bus des moments : un catalogue unique, trois sortes d'échange

- Statut : **Proposé** (2026-10-07)
- Date : 2026-10-07
- Compose / précise : [ADR-0061](0061-un-seul-guichet-pour-github.md) (la perspective du bus, qui annonçait ce contrat), [ADR-0039](0039-trois-etages-moteur-methode-branchements-plugin.md) §4 (la supervision est un branchement observabilité), [ADR-0059](0059-revue-locale-plancher-codex-filet-pr-optionnelle-par-config.md) (la revue : plancher et filet)
- Fiches : [20261004101755756](../../../../features/20261004101755756_contrat-bus-catalogue-moments.md) (écrire le contrat du bus)

## En clair

La méthode fait des choses à des moments précis : un run s'ouvre, une revue rend son verdict, une version se clôt. Aujourd'hui, ces moments portent des noms éparpillés — la supervision a les siens, le guichet GitHub les siens, la fiche 0171 en ajoute d'autres. Sans liste commune, chaque nouvel outil inventera ses propres noms, et le « bus » deviendra illisible avant d'exister.

On écrit donc **un catalogue unique** des moments (`moments.yml`), lisible par une machine. Chaque moment y déclare **sa sorte d'échange** — un événement qu'on annonce, une commande qu'on confie, un avis qu'on demande —, ce qu'il transporte, et qui l'écoute aujourd'hui.

Analogie : c'est l'annuaire d'une maison. Avant, chacun criait dans le couloir avec ses propres mots. Maintenant, un annuaire dit quels messages existent, lesquels attendent une réponse, et qui les reçoit. On ne construit pas encore le téléphone — juste l'annuaire.

Ce que ça veut dire pour toi : brancher GitHub, Codex ou Slack ne demandera plus de deviner le vocabulaire de la méthode. Il sera écrit, à un seul endroit, et un test refuse tout doublon ou toute sorte inconnue.

## Contexte

L'ADR-0061 a tranché que tout outil se branche sur la méthode par un **bus**, sans toucher au texte des skills, et a posé trois rôles : la méthode décide **quand**, le projet **qui**, le plugin **comment**. Il disait aussi : « on n'attend pas pour fixer le contrat », car un deuxième plugin écoute déjà — la supervision.

Mais la liste des moments n'était écrite nulle part. Elle existait en morceaux :

- la **supervision** a ses six événements (`run.started`, `gate.reached`, `gate.resumed`, `escalation`, `heartbeat`, `run.finished`), déjà émis par le kit (ADR-0032 et ADR-0036, série ombrelle) ;
- le **guichet** `ezk forge` a ses verbes `changes` et `integrate` (ADR-0061), déjà posés comme commandes ;
- la fiche **0171** ajoute des moments à venir : une issue au passage en `ready`, une release à la clôture d'une version ;
- la **revue** a sa règle « plancher et filet » (ADR-0059).

## Décision

### 1. Un catalogue unique, lisible par une machine

`products/mega-city/moments.yml` liste chaque moment. Un loader (`src/loaders/moments.ts`) le lit et le **valide** ; le cœur (`src/core/moments.ts`) porte le schéma. Un moment déclare : `nom`, `sorte`, `etape` (l'étape de la méthode qui l'émet), `transporte` (ce qu'il porte), `clients` (qui l'écoute aujourd'hui — vide = déclaré, pas encore branché).

### 2. Trois sortes d'échange (reprises d'ADR-0061)

- **événement** — la méthode annonce et continue. Zéro, un ou plusieurs abonnés. Motif *publier-s'abonner*.
- **commande** — la méthode attend un résultat. **Un seul** exécutant, choisi par la config du projet.
- **avis** — la méthode attend un verdict. **Plusieurs** avis, combinés par une **règle écrite**.

> Dans le catalogue et le schéma, ces sortes s'écrivent **sans accent** : `evenement`, `commande`, `avis` (identifiants ascii). La prose, elle, les accentue.

### 3. Cinq règles de non-interférence

1. Un moment a **une seule** sorte : pas d'ambiguïté « annoncer » / « attendre ».
2. Les **noms sont uniques** : un doublon fait échouer la validation.
3. La méthode **ne connaît pas** ses clients : elle émet le moment, les plugins s'y abonnent (événement) ou s'y branchent (commande, avis).
4. Un **plugin absent ne casse rien** : un événement sans abonné passe ; une commande sans exécutant répond « sans objet » ; un avis manquant ne vaut pas veto.
5. La **méthode possède le « quand »** : un plugin ne crée pas de moment, il écoute ceux qui existent.

### 4. La forme du manifeste d'un plugin (esquisse)

Un plugin déclarera, dans un manifeste, ce qu'il **écoute** (événements), ce qu'il **exécute** (une commande au plus par verbe) et ce qu'il **rend** (avis). Le détail du manifeste et la découverte des plugins restent **hors de cet ADR** : canal par canal (ADR-0061).

## Conséquences

- Le vocabulaire des moments est **à un seul endroit**. Un nouveau plugin lit le catalogue, il n'invente rien.
- Un **test de forme** garde le catalogue : noms uniques, sortes connues, moments attendus présents.
- Les moments **déclarés mais pas encore branchés** (ceux de 0171) sont visibles dès maintenant, `clients` vide : le contrat précède le câblage.

## Hors périmètre

Le **code du bus** (le routage réel), la **découverte des plugins**, le **diagramme généré**. Ils viendront canal par canal, comme l'ADR-0061 le prévoit. Ici, on fixe le **contrat**, pas le moteur.
