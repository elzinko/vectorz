# 0083 — La version est une étiquette posée à la construction ; la milestone est l'unité de préparation

- Statut : **Accepté** (2026-10-23). **Décision PO (Thomas)**, tracée au titre du verrou n°4 de
  l'ADR-0081 (« ADR amendés, pas contredits en silence »). Amende / étend, ne contredit pas :
  [0070](0070-le-tirage-reste-dans-la-version-en-cours.md), [0080](0080-checkpoint-de-version.md),
  [0081](0081-sequencement-depends-signal-dag-differe.md). Doctrine anti-surproduction de l'ADR-0081
  honorée : on grave le noyau, pas le moteur différé.
- Date : 2026-10-23
- Déciders : PO (Thomas)
- Plan : [Préparer par milestone (2026-10-23)](../../../../docs/plans/2026-10-23-preparer-par-milestone.md)

## En clair

On prépare désormais le travail **par milestone** — un lot de fiches qui forment un tout cohérent —
et non plus par lot de version. Le **numéro de version devient une étiquette** : il se pose **à la
construction**, dans l'ordre, jamais de saut, et s'incrémente tout seul. Une milestone prête peut
donc être construite dès qu'elle est prête, sans attendre un numéro plus bas. Rien d'autre ne change :
le tirage lit toujours `version:` (ADR-0070), et on ne construit **aucun graphe de dépendances**
(ADR-0081 reste différé).

Image : la **milestone est le wagon** qu'on charge et qu'on vérifie ; la **version est le numéro
peint sur le flanc** au moment où le wagon part. On ne garde plus un wagon à quai parce que le wagon
d'à côté porte un numéro plus petit.

## Contexte

Le train de versions a confondu deux rôles, et ça a fait mal.

- **Le numéro était posé trop tôt.** Une fiche recevait un `version:` dès la planification. Résultat :
  une version prête restait **coincée derrière** des numéros plus bas non encore scellés (douleur
  nommée dans l'ADR-0081 : « v0.23 prête mais coincée derrière v0.18–v0.22 »).
- **Le plan curé a dérivé.** Le tableau « train » de [`PLAN.md`](../../../../features/PLAN.md)
  présentait des versions « à construire » déjà livrées. L'ordre vivait dans deux têtes à la fois.
- **La règle intérimaire existait déjà** mais n'était pas gravée : PLAN.md disait « le numéro se pose
  à la construction, dans l'ordre, jamais de saut… étiquettes provisoires, jusqu'au modèle milestones,
  différé ». Le PO acte aujourd'hui cette règle comme **le** modèle de préparation.

L'ADR-0081 avait tranché : le **noyau** (lire `depends:`, désambiguïser « en cours », grouper au
grooming) se fait maintenant ; le **basculement lourd** (milestone = unité *séquencée* avec **graphe
de dépendances** et migration) reste différé derrière quatre verrous. Cet ADR grave **le noyau côté
préparation**. Il ne touche **pas** au basculement lourd.

## Décision

### 1. Deux rôles séparés

- **Milestone = unité de préparation.** On groupe les fiches par `milestone:` (un lot cohérent), on
  les groome en entier, on les amène à « prête ». C'est le niveau auquel on pense et on prépare.
- **Version = étiquette de construction.** Le numéro ne se pose **plus à la planification**. Il se
  pose **au moment de construire**, sur la milestone choisie, dans l'ordre, **jamais de saut**. Il
  s'incrémente seul.

### 2. Le geste « construire une milestone » assigne le numéro

Quand le PO (ou le run) décide de construire une milestone prête, on **assigne le prochain numéro de
version libre** à ses fiches (un geste de construction, pas de planification), puis on lance. À partir
de là, tout le mécanisme existant s'applique à l'identique : tirage, gates d'entrée/sortie, sceau
(ADR-0080).

### 3. Ce qui ne change pas — aucun axe de tirage nouveau

- **Le tirage lit toujours `version:`** (ADR-0070). La version reste le **seul** axe d'ordre au tirage.
  On ne crée pas de second axe : l'ordre de construction des milestones **devient** l'ordre des
  numéros (ils sont posés dans cet ordre). ADR-0070 (« un seul axe, décision PO ») est donc respecté,
  pas rouvert.
- **Aucun objet « milestone » persistant.** `milestone:` reste une **chaîne libre** sur la fiche
  (ADR-0069 : zéro objet de process persistant ; ADR-0080 : `milestone:` sert déjà aux fiches
  couplées). On ne la promeut pas en objet.
- **Aucun graphe de dépendances.** `depends:` reste un **signal** lu en avertissement (ADR-0081),
  jamais un barrage, jamais un DAG. Le basculement lourd reste `idea`, derrière ses quatre verrous.

### 4. L'ordre vit dans le plan curé

[`PLAN.md`](../../../../features/PLAN.md) nomme la **suite des milestones** (quelle milestone après
quelle milestone). Il n'énumère plus un train de numéros. Le numéro n'y apparaît qu'en **compte
rendu** (« cette milestone a été livrée sous vX.Y »).

## Conséquences

- (+) Une milestone **prête se construit sans attendre** : la douleur « prête mais coincée » disparaît.
- (+) Le numéro **ne ment plus** : il décrit ce qui est parti, pas un pari de planification.
- (+) **Rayon de souffle minuscule** : c'est une discipline de préparation + le moment d'assignation du
  numéro déplacé à la construction. Le cœur (tirage, gates, sceau) est inchangé.
- (−) **Trou d'outillage connu, non comblé ici** : `ezk backlog version` raisonne par version ; il n'y
  a pas encore de vue « par milestone » ni de geste « assigner le prochain numéro à cette milestone ».
  Première brique de construction de la milestone « Préparer une milestone » (voir le plan).
- (−) **Dette `parked` dans `milestone:`** : le `park` écrase la milestone d'origine par la valeur
  magique `parked`. Si la milestone devient l'unité de préparation, cette collision gêne. À traiter par
  une fiche dédiée (la passe de tri du parké), pas ici.

## Options écartées

| Option | Verdict |
|---|---|
| **Basculer vers milestone *séquencée* + DAG maintenant** | ❌ Hors périmètre. Reste différé derrière les 4 verrous de l'ADR-0081 ; cet ADR ne les franchit pas. |
| **Garder l'assignation du numéro à la planification** (statu quo) | ❌ C'est la cause de « prête mais coincée » et du plan qui dérive. |
| **Faire de `milestone:` un second axe de tirage** | ❌ Rouvrirait ADR-0070 (un seul axe). Inutile : l'ordre des milestones devient l'ordre des numéros. |
