# 0088 — Deux plans : la milestone est l'unité du lancement, la version est une coupe posée après test

- Statut : **accepté** (2026-11-15) — panel adverse du 14 novembre (trois lentilles, deux juges) : amender puis
  ratifier ; amendements du panel intégrés ; **ratifié par le PO le 15 novembre** (quatre oui, section « Ce que le PO
  a tranché »).
- Date : 2026-11-14
- Déciders : PO (Thomas), après panel adverse ; capture :
  [Panel adverse — la coupe](../../../../docs/captures/2026-11-14-panel-coupe-deux-plans-milestone-version.md).
- Dossier : [Deux plans : la milestone se construit, la version se coupe](../../../../docs/plans/2026-11-10-deux-plans-milestone-run-version-coupe.md)
  (10 novembre).
- Amende : [0083](0083-version-etiquette-milestone-unite-de-preparation.md) §2 et §3,
  [0070](0070-le-tirage-reste-dans-la-version-en-cours.md), [0080](0080-checkpoint-de-version.md),
  [ADR-079](../../../../docs/adr/ADR-079-run-et-session-deux-entites-multi-llm.md) D2,
  [ADR-086](../../../../docs/adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md) (table « à
  publier »). **Remplace** [0076](0076-auto-tag-close-local-opt-in.md). Ne rouvre ni
  [0081](0081-sequencement-depends-signal-dag-differe.md) (graphe différé, quatre verrous) ni
  [0069](0069-etape-process-calculee-par-jointure.md) (zéro état stocké).
- Fiche : [Trancher la coupe](../../../../features/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md).

## En clair

Le lancement autonome construit des **objectifs** (les milestones), jamais des versions. La **version est
une coupe** : toi seul la décides, après test. Elle couvre tout ce qui a été livré depuis l'étiquette
précédente, groupé par objectif complet ou partiel, plus les correctifs. Le numéro se pose à la coupe, en
compte rendu. Un objectif et une version ont chacun un fichier d'identité qui porte leur nom en clair ;
leur état, lui, se calcule toujours.

Image : l'objectif est le wagon qu'on charge et qu'on vérifie. La version est le train que tu composes,
quand tu veux, avec les wagons pleins ou à moitié pleins et les colis urgents, puis que tu fais partir. Le
lancement remplit des wagons. Il ne fait jamais partir un train.

## Contexte

- Depuis le 23 octobre, aucune version n'a été posée. Mesuré le 14 novembre : 86 fichiers sont entrés dans
  `features/done/` depuis v0.22.0, dont 79 fiches livrées (72 sans numéro, 4 en v0.23.0, 3 en v0.24.0 sans
  tag) et 7 closes sans livraison (4 split, 3 superseded). 84 fiches sont parkées, 61 sans raison typée ;
  8 fiches actives n'ont pas d'objectif.
- La cause : la version était une étape du lancement (ADR-0070, ADR-0080). Pour passer à la suivante, il
  fallait sceller la précédente ; pour sceller, sortir toute fiche non livrée. « Pas maintenant » devenait
  « parkée » (16 fiches le 20 octobre), et quand le PO ne taguait pas pour tester d'abord, le plan de
  versions s'éteignait.
- Le modèle milestone est adopté depuis l'ADR-0083 (23 octobre). Il manquait de sortir la version de la
  boucle de construction. Le PO l'a demandé le 8 novembre, puis a tranché le 14 novembre que le nom en clair
  d'un objectif et d'une version vit dans l'objet lui-même, pas dans `PLAN.md`.

## Décision

### 1. Le périmètre d'un lancement est un ensemble d'objectifs

- `ezk-product-build run --milestones <a,b|all>`. Sans drapeau : la première milestone non livrée du plan ;
  le lancement s'arrête à sa fin et **nomme la suivante sans la prendre**.
  `--milestones a,b` ou `all` enchaîne, avec un bilan à chaque frontière d'objectif.
- L'**ordre des objectifs** se dérive de `PLAN.md` : la première apparition d'une fiche de chaque
  milestone (`parsePlanOrder`). La liste codée `MILESTONE_ORDER` est retirée. Une milestone sans fiche
  planifiée est « non planifiée ».
- Le tirage garde **un seul axe** : l'ordre du plan, borné par le périmètre. Un bug qui porte une
  milestone appartient à elle ; un bug sans milestone est toujours dans le périmètre ; une fiche active sans
  objectif, hors bug, est écartée et listée dans le bilan, jamais tue.
- Le lancement **ne scelle rien** et **ne parke rien pour sceller**. Il peut toujours parker une fiche
  durablement inconstruisable, après tentative, comme aujourd'hui.
- Son bilan dit, par objectif : **complète** (aucune fiche active non parkée) ou **partielle k/n
  (p parkées, d différées)**, le nombre de correctifs livrés, et la liste « à trancher ».

### 2. La version est une coupe : `ezk backlog version tag <vX.Y.Z>`

Un seul verbe remplace `version close`. Il compose la gate lui-même : un seul geste (décision PO du
12 novembre, un seul bouton « Versionner »).

1. **La borne.** Une fiche entre dans la coupe si elle est livrée (`status: shipped`, rien d'autre) et si
   son commit de livraison est postérieur au dernier tag de release **strict** atteignable depuis HEAD
   (même règle que `releaseTagFor` : jamais `v*`, qui attrape les pré-versions). Le commit de livraison est
   le sha de `pr:` s'il est ancêtre de HEAD ; sinon le commit du ship (ajout à `features/done/`, lu avec
   `--no-renames --diff-filter=A`), écart signalé ; sinon la fiche est « non datable », listée hors coupe.
   Sans tag strict, la coupe couvre tout le livré et le dit. Un `version:` préposé sur une fiche livrée de la
   fenêtre est réécrit, avec une ligne d'avertissement.
2. **Le contenu.** Groupé par objectif : complet ou partiel k/n (p parkées, d différées), plus les
   correctifs. Une coupe partielle est un état dit tel quel, pas une faute : aucun garde-fou ne la refuse.
   Le dry-run rejoue les avertissements de dépendance (`depends:`, ADR-0081) sans bloquer, et dit « aucun
   objectif complet dans cette coupe » s'il y a lieu.
3. **Le numéro.** Patch proposé si et seulement si chaque fiche de la coupe est `type: bug` ; sinon
   mineure ; majeure sur `--major` seulement. Le numéro est strictement supérieur au dernier tag strict
   atteignable, jamais déjà tagué, jamais déduit du plus grand `version:` du backlog. Le PO impose un autre
   numéro d'un mot ; le compte rendu écrit `numero: propose` ou `numero: impose`.
4. **La séquence.** `--dry-run` imprime la coupe sans rien écrire. Sans `--dry-run` : la gate de release
   joue **d'abord**, sur HEAD, rien d'écrit avant son GO (doctrine « refus = rien d'écrit ») ; sur GO, la
   coupe écrit `version:` sur les fiches coupées et le fichier de version (décision 7), committe, et pose
   le tag **local** sur ce commit. Le push de l'étiquette reste un geste du PO, en toutes lettres.
5. **La gate.** La passe `dod-mecanique` (`backlog version check <v>`) est remplacée par
   `backlog version tag <v> --dry-run` : l'ancienne passe sortait en 1 sur toute version que personne ne
   portait encore, et bloquait la chaîne. Les autres passes ne changent pas ; la passe `tests` vient par
   sa fiche. Dit au PO : sur ce dépôt, 6 verdicts GO pour 22 tags ; la première coupe sera la première gate
   vraiment jouée.
6. **Où.** La coupe se joue sur la branche principale. Le verbe refuse de tourner ailleurs : tague HEAD
   quelle que soit la branche, c'est ce que faisait `close --tag`.

### 3. La prévision de livraison : hors du premier lot

Une prévision (« v0.24 ← recettes, carte ») est une intention du PO. Elle vit dans `PLAN.md`, jamais sur une
fiche ni sur un objet. Aucun parseur ni section nouvelle tant qu'aucune coupe ne l'a réclamée.

### 4. Les correctifs

Un correctif (`type: bug`) sans objectif se construit dès qu'il est prêt. Une coupe faite de correctifs
seuls est un patch.

### 5. Une seule ligne sur `main`, et deux refus mécaniques

Une seule ligne se construit sur `main` à la fois ; la suivante se groome. `version tag` refuse : (a) un
numéro inférieur ou égal au dernier tag strict atteignable ; (b) un numéro de patch quand la fenêtre
contient une fiche hors `type: bug`. Dans les deux cas il nomme les deux sorties : couper une mineure, ou
ouvrir `maint/vX.Y` depuis le tag `vX.Y.0` et y reporter les correctifs par leurs sha. La branche de
maintenance reste une décision du PO, le jour venu. Le déclencheur « un critère
d'acceptation contredit un comportement livré » du dossier est retiré : il n'est pas vérifiable.

### 6. `park` garde l'objectif

`milestone:` reste intact ; `park` pose `parked: <date>` et `blocked: <raison typée>`. `isParked` lit le
drapeau en un seul endroit (`fiche-schema.ts`) ; `versions.ts` l'importe ; `regen-backlog.sh` change de
colonne ; le schéma de fiche déclare le champ. `parked` sort de `milestones[]`. Les parkées sortent du
dénominateur d'un objectif. Ordre : le code, puis le contrat (décision 9), puis la passe de tri assistée
des 84 parkées : 19 origines évidentes (un label égal à un nom d'objectif) écrites, le reste « origine
inconnue », curation du PO. Sur 84, 72 n'avaient aucun objectif avant le park.

### 7. Les objets d'identité : un fichier par objectif, un par version

- `features/milestones/<slug>.md` : front-matter `milestone` (la valeur exacte du champ des fiches), `nom`,
  `but` facultatif, `created`. Ni ordre, ni état, ni prévision. Créé par `ezk backlog milestone add <slug>
  --nom "<nom>"`, proposé au grooming quand une valeur neuve apparaît ; `backlog check` avertit sur un lien
  vers un objectif non déclaré, sans refuser.
- `features/versions/<vX.Y.Z>.md`, écrit par la coupe : `version`, `nom` facultatif (`--nom`, éditable
  après), `date`, `commit`, `gate` (verdict, passes jouées, soupape), `numero: propose|impose` ; corps = les
  notes de version par objectif et correctifs.
- Les 22 noms de la table « Train de versions » de `PLAN.md` migrent dans les objets ; la table est retirée ;
  `PLAN.md` ne porte plus aucun nom d'objectif ni de version.
- Deux sous-dossiers neufs sous `features/` : une migration de layout (Skema, `layout_version`) pour tous les
  projets qui portent la méthode ; le loader et `regen-backlog.sh` ignorent ces sous-dossiers.
- **ADR-0069 reste intact** : un nom déclaré n'est pas un état calculé. ADR-0083 §3 est amendé : « un objet
  d'identité, jamais un objet à état ». Le verrou 3 de l'ADR-0081 est levé pour l'identité seule.

### 8. Le gel est retiré

`freeze`, `unfreeze`, `diff`, `frozenBaseIds`, `freezeTagOf`, `freezeTagFor`, `lifecycleOf`, `diffFrozen`,
`FrozenDiff`, les champs `frozen` / `freezeTag` du lot et `cycleDeVie` / `etiquetteGel` du contrat sont
retirés (0 tag `freeze/` sur 91, aucun bouton dans la maquette). Dans le même saut de contrat que la
décision 9.

### 9. Ce que la méthode publie (contrat `board-show` v2, un seul saut)

- `coupes[]` : l'historique ; pour chaque coupe : version, nom, date, commit, objectifs (nom, complet ou
  partiel k/n, fiches), correctifs.
- `prochaineCoupe` : la même forme, calculée depuis le dernier tag strict, plus le numéro proposé et son
  type, et les preuves du carnet de tests ; `null` si rien n'a été livré depuis le dernier tag.
- `milestones[]` : nom en clair, ordre dérivé du plan, état calculé, comptes (les parkées à part), sans
  `parked`.
- Retirés dans le même saut : `courante`, `ecartees`, `sansVersion`, l'état `a-clore`, `cycleDeVie`,
  `etiquetteGel`. cop1 suit dans le même lot (il lit `sansVersion` et `a-clore` aujourd'hui).
- La cloche : le type `couper` naît de l'évènement « une fiche livrée après le dernier tag », jamais d'un
  compteur (doctrine du PO du 11 novembre).

### 10. Les notes de version et la règle « changelog »

Les notes de version sont le **corps de l'objet version** (décision 7) : la coupe les rend par objectif
(complet ou partiel k/n) et par correctif, depuis les fiches coupées ; rien ne s'écrit à la main. La règle
`documentation-guidelines/changelog` (niveau MUST, dans aucun paquet, jamais appliquée, aucun `CHANGELOG.md`
dans le dépôt) est **remplacée par ces notes** : un projet qui porte la méthode n'a pas de fichier de
changelog, il a ses versions. Le retrait de la règle du catalogue est un geste de rétro (`ezk-retro retire`),
sous contrôle du PO, avec ce motif ; d'ici là elle reste dormante, comme aujourd'hui. Le rendu des notes vers
une release GitHub relève de la fiche
[Recopier sur GitHub ce que la méthode écrit en local](../../../../features/0171-adapter-github-issues-push-only.md).

## Conséquences

- (+) Plus aucune fiche parkée pour une frontière ; le tag ne peut plus mentir, son contenu se calcule.
- (+) Le lancement enchaîne des objectifs sans jamais prendre une décision de livraison.
- (+) Les 72 fiches livrées sans numéro redeviennent visibles : elles sont la prochaine coupe.
- (+) Un objectif et une version ont un nom que mission control affiche sans deviner.
- (−) Code retiré : enchaînement multi-versions (`--versions`, `ezk run versions`, `version-sequence.ts`),
  auto-tag (`--seal-versions`, ADR-0076), report-hors, gel, `close --tag`. Règle `clean-code/no-dead-code`.
- (−) Une coupe peut contenir un objectif partiel ; elle le dit, c'est un état, pas une faute.
- (−) Une migration de layout pour les projets qui portent la méthode (deux sous-dossiers).
- (−) La passe `tests` de la gate n'existe pas encore : la première coupe le dira.
- (−) La règle `changelog` du catalogue est à retirer en rétro, sous contrôle du PO ; les notes de version la
  remplacent.

## Ce que le PO a tranché

| | Question (un oui ou un non) | Réponse |
|---|---|---|
| 1 | « But du sprint » comme mot d'écran du Sprint Goal ; pas de « but de version » | ✅ oui, 2026-11-15 |
| 2 | Objectifs et versions = fichiers d'identité sans état ; ADR-0083 §3 amendé | ✅ oui, 2026-11-15 |
| 3 | Correctif pendant un objectif partiel → mineure ; patch refusé, deux sorties nommées | ✅ oui, 2026-11-15 |
| 4 | Sans `--milestones`, une milestone puis arrêt qui nomme la suivante | ✅ oui, 2026-11-15 |

Quatre oui le 15 novembre (réponse du PO dans sa session) : statut **accepté**.

## Options écartées

Celles du dossier (section « Options écartées »), plus celles du panel : un garde-fou qui refuse une mineure
sans objectif complet (re-décide à la place du PO ; interdirait toute coupe aujourd'hui) ; un déclencheur de
branche de maintenance par critère d'acceptation (non vérifiable) ; une règle de numéro sur « correctif »
sans définition (`type:` ne porte pas le sens semver ; la proposition se trompe vers la mineure, jamais
vers le patch) ; `milestones.yml` ou la section de `PLAN.md` comme source des noms (décision PO du
14 novembre).

## Suites

Les fiches de build, dans l'ordre : `park` garde l'objectif
([« parked » n'est plus un pseudo-objectif](../../../../features/20261114131614612_parked-n-est-plus-un-pseudo-objectif.md)) ;
le tirage par objectif et le verbe de la coupe
([`ezk backlog version tag <v>`](../../../../features/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md)) ;
les objets d'identité et la publication
([les objectifs publiés](../../../../features/20261114131612572_objectifs-publies-comme-objets.md),
[les versions publiées](../../../../features/20261114131612759_versions-publiees-comme-coupes.md)) ;
la gate joue les tests ([fiche](../../../../features/done/20261114131613314_gate-de-release-joue-les-tests.md)) ;
mission control (page Versions, page Objectifs). Les notes de version rendues depuis l'objet version, et le
Product Goal (« But du produit »), restent des décisions à part.
