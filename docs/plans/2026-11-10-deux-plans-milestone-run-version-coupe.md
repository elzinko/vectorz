# Deux plans : la milestone se construit, la version se coupe — dossier de décision (2026-11-10)

## En clair

Le run autonome construit des **milestones** ; toi seul **coupes des versions**, après avoir testé.
Aujourd'hui la version est une étape du run : c'est elle qui a parké 16 fiches le 20 octobre, et
depuis le 23 octobre plus aucune version n'est posée (85 fiches livrées, 76 sans numéro, dernier
tag v0.22.0). Ce dossier propose le modèle à deux plans, nomme les trois ADR qu'il amende, ce que
la méthode publie pour mission control, et les questions qu'un panel adverse doit attaquer.

Image : la **milestone est le wagon** qu'on charge et qu'on vérifie. La **version est le train**
que tu composes, quand tu veux, avec les wagons pleins et les colis urgents, puis que tu fais partir.
Le run remplit des wagons. Il ne fait jamais partir un train.

## Ce que tu as demandé (le 8 novembre)

- Fonctionner **par milestones**, et ne **taguer** qu'après avoir fait tourner un ou plusieurs lots
  et **testé** ce qui a été codé. Le tag décide si on livre et si on versionne.
- Prévoir d'un côté **les milestones et leur ordre**, de l'autre **les versions et ce qu'on y met**.
- Pouvoir livrer des **correctifs entre deux versions**.
- Ne pas lancer un mode auto **sur plusieurs versions**, sans pour autant renoncer à **avancer sur
  la V1 en préparant la V2**, ou à avoir une idée précise de la 1.8.x et de la 1.9.y.
- Et surtout : un modèle **stable**, parce que mission control se conçoit dessus.

## Ce qui s'est passé, chiffres vérifiés

| Fait | Mesure | Source |
|---|---|---|
| Le run multi-versions du 20 octobre a parké des fiches **pour pouvoir sceller** v0.19 → v0.22 | 16 fiches passées `milestone: parked` dans un seul merge (11 « à découper », 2 « attend GitHub », 1 « différée PO », 1 « attend panel », 1 « attend dépendance ») | commit `783b663e` |
| Depuis le 23 octobre, le numéro « posé à la construction » n'a **jamais été posé** | 85 fiches livrées depuis le tag v0.22.0 ; **76 sans numéro**, 9 en v0.23.0 ou v0.24.0 | `git log v0.22.0..HEAD` sur `features/done` |
| Ces 76 fiches sont **invisibles** du suivi de version | `ezk backlog version list` les compte comme « historique d'avant le champ » et affiche « 2 versions à clore » (7 fiches) | [`versions.ts`](../../products/mega-city/src/backlog/versions.ts), compteur `history` |
| Les runs des 3 et 4 novembre n'ont presque rien parké | arrêt sur « aucune fiche prête » : 4 têtes du plan en `blocked: deferred`, décisions du PO | fiche [« À trancher »](../../features/done/20261104204526440_a-trancher-decisions-qui-bloquent-le-run.md) |
| Le tas parké est **intriable par milestone** | 85 parkées ; 62 sans raison typée (tri du 30 septembre), 23 avec (11 oversized, 4 panel, 3 github, 3 dependency, 1 review, 1 deferred) ; `park` a écrasé leur milestone d'origine | `grep '^milestone: parked' features/*.md` |

Rejouer ces mesures depuis la racine du dépôt :

```bash
git tag -l 'v*' | sort -V | tail -1
```

```bash
git log v0.22.0..HEAD --diff-filter=A --name-only --format= -- features/done | grep -c '\.md$'
```

```bash
ezk --root "$(git rev-parse --show-toplevel)" backlog version list
```

```bash
git diff 783b663e^1 783b663e -- features | grep -c '^+milestone: parked'
```

## Le diagnostic en une phrase

**La version est une étape du run, et c'est ça qui casse.** Pour passer à la version suivante, le
run doit sceller la précédente (ADR-0070). Pour sceller, il doit sortir toute fiche non livrée
(ADR-0080, « le tag ne couvre que le livré »). Donc « pas maintenant » devient « parkée ». Et quand
le PO ne tague pas, parce qu'il veut tester d'abord, le tirage se bloque : les runs de novembre ont
contourné le blocage en construisant des fiches **sans version**, ce qui a éteint le plan de versions
sans que personne ne le décide.

Le modèle milestone, lui, est **déjà adopté** : [ADR-083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md)
(23 octobre) fait de la milestone l'unité de préparation et de la version une étiquette. Il reste
une étape : sortir la version de la boucle de construction.

## Le modèle proposé : deux plans séparés

```
PLAN DE CONSTRUCTION  (le run y vit)          PLAN DE LIVRAISON  (toi seul y vis)
  ordre des milestones, dans PLAN.md            prévision : v0.23 ← board + qualite
  milestone board      prête → en sprint                    v0.24 ← recettes + carte
  milestone qualite    à groomer                            (une intention, éditable)
  milestone recettes   idée
  correctifs           sans milestone,           coupe : « v0.23.0 » = tout ce qui a été livré
                       tirés dès qu'ils                  depuis le tag précédent, groupé par
                       sont prêts                        milestone complète / partielle + correctifs,
                                                         décidée par toi APRÈS test, jamais avant
```

### 1. La milestone est l'unité du run

- Un run autonome se borne à **une ou plusieurs milestones nommées** :
  `ezk-product-build run --milestones board,qualite`. Sans drapeau : la **tête** de l'ordre du
  plan, c'est-à-dire la première milestone non livrée.
- Le tirage garde **un seul axe** : l'ordre de [`PLAN.md`](../../features/PLAN.md). Le filtre pur
  qui écartait les versions supérieures (`applyVersionScope`) devient un filtre qui écarte les
  fiches **hors des milestones demandées**. Même point d'insertion, même forme, avant la sélection.
- Les **correctifs** (fiches `type: bug` sans milestone) restent dans le périmètre par défaut, comme
  les « fiches sans version » aujourd'hui (décision PO du 2026-10-11).
- Le run **ne scelle rien** et **ne parke rien pour sceller**. Il peut toujours parker une fiche
  durablement inconstruisable, après tentative, comme aujourd'hui.
- Son bilan dit, par milestone : **complète** (plus aucune fiche active), **partielle** (il en
  reste), et le nombre de correctifs livrés. Plus la liste « à trancher ».

### 2. La version est une coupe

Un verbe, `ezk backlog version tag <vX.Y.Z>`, remplace `version close`. « Étiqueter » est le mot de
ta maquette ; « coupe » nomme le concept dans ce dossier, le verbe suit ton mot.

1. **Il calcule le contenu** : les fiches livrées dont le champ `version:` est vide et dont le commit
   de livraison (le `pr: local (<sha>)` de la fiche) est **postérieur au dernier tag**. Il les groupe
   par milestone, dit laquelle est complète ou partielle, et liste les correctifs.
2. **Il propose le numéro** : patch si la coupe ne contient que des correctifs, mineure dès qu'une
   fiche de fonctionnalité est dedans, majeure seulement sur `--major`. Tu peux imposer le numéro.
3. **Il exige la gate de release** : `ezk release <v>` doit être GO, sur HEAD, comme aujourd'hui.
   Rien ne change dans [`ezk-release`](../../products/mega-city/skills/ezk-release/SKILL.md).
4. **Il écrit `version: vX.Y.Z` dans ces fiches**, en compte rendu, pose le tag **local**, régénère
   les vues. Le push de l'étiquette reste un geste du PO, en toutes lettres.

`version tag --dry-run` imprime la coupe sans rien écrire : c'est la carte « À étiqueter » de mission
control. La coupe est **honnête par construction** : elle ne couvre que ce qui a été livré. Une
milestone partielle n'est pas un mensonge, c'est un état dit tel quel. Plus rien n'a besoin de sortir
d'une version pour que le tag dise vrai, donc plus de report-hors ni de park à la frontière.

### 3. Le plan de livraison est une prévision

- Une section « Prévision de livraison » dans `PLAN.md` : une ligne par version prévue,
  `v0.24 ← recettes, carte`. C'est une intention, éditable à la main, comme l'ordre du plan.
- Elle n'est **jamais écrite sur une fiche**. Une fiche ne porte un numéro qu'une fois coupée.
- `plan check` signale une milestone citée dans la prévision qui n'existe sur aucune fiche.
- À la coupe, le bilan compare **prévu** et **livré** : « prévu board + qualite ; livré board
  complète, qualite 2/4, 17 correctifs ». L'écart se lit, il ne bloque rien.

C'est ta « idée précise de la 1.8.x et de la 1.9.y » : deux lignes de prévision, sans numéro gravé.

### 4. Les correctifs entre deux versions

Un correctif n'a pas de milestone. Il se construit dès qu'il est prêt, par un run ou à la main. Tu
coupes un **patch**, `v0.23.1`, avec seulement des correctifs dedans, quand tu veux, même pendant
qu'une milestone est à moitié construite sur `main`. Semver donne le vocabulaire : correctif =
patch, milestone = mineure, rupture = majeure.

Limite assumée : une seule branche principale. Un patch coupé pendant une milestone à moitié livrée
**contient** les fiches déjà livrées de cette milestone. Chaque fiche livrée est complète et testée
(une PR, une revue, une gate), donc le patch reste sain. La coupe le dit : « qualite 2/4, partielle ».

### 5. Avancer sur la V1 en préparant la V2

- Le grooming est déjà libre (ADR-0070). Préparer la V2 = groomer ses milestones, sans run.
- `PLAN.md` peut porter **deux lignes** de milestones (« ligne 1.x », « ligne 2.0 »). Un run se
  pointe sur une ligne par `--milestones`. Deux runs ne construisent pas deux lignes en même temps
  sur le même `main`.
- Une seule branche principale tant que la V2 ne casse pas un comportement livré de la V1. Le
  **déclencheur** d'une branche de maintenance 1.x est nommé d'avance : la première fiche de la
  ligne 2 dont un critère d'acceptation contredit un comportement livré de la ligne 1. Ce jour-là,
  décision PO et fiche dédiée. Rien n'est construit avant.

## Ce que ça amende, et ce qui ne bouge pas

| ADR | Aujourd'hui | Après ce dossier |
|---|---|---|
| [ADR-083](../../products/mega-city/docs/adr/0083-version-etiquette-milestone-unite-de-preparation.md) §2 | le numéro se pose **à la construction**, dans l'ordre, sans saut | le numéro se pose **à la coupe**, après test ; l'ordre des numéros suit l'ordre des coupes |
| [ADR-0070](../../products/mega-city/docs/adr/0070-le-tirage-reste-dans-la-version-en-cours.md) | le tirage lit `version:` ; la suivante n'ouvre qu'une fois la précédente taguée | le tirage lit l'ordre des milestones du plan, borné par `--milestones` ; **un seul axe, toujours** ; plus de borne par tag |
| [ADR-0080](../../products/mega-city/docs/adr/0080-checkpoint-de-version.md) | la version est un checkpoint du run (gate d'entrée, gate de sortie, report-hors) | la gate d'entrée devient le verdict « lançable » d'une **milestone** ; la gate de sortie devient la **coupe**, hors run ; le report-hors disparaît |
| [ADR-0076](../../products/mega-city/docs/adr/0076-auto-tag-close-local-opt-in.md) | le run peut taguer en local sur opt-in | **remplacé** : le run ne tague jamais ; le drapeau `--seal-versions` est retiré |
| [ADR-086](../adr/ADR-086-la-methode-seul-lecteur-des-fiches-contrat-json.md) | la méthode publie versions et milestones « façon lots » | la table « à publier » gagne les coupes, la prochaine coupe et la prévision (section suivante) |

Ce qui **ne bouge pas**, et que le panel ne doit pas rouvrir :

- **Aucun graphe de dépendances.** `depends:` reste un signal lu en avertissement
  ([ADR-0081](../../products/mega-city/docs/adr/0081-sequencement-depends-signal-dag-differe.md),
  quatre verrous intacts). L'ordre des milestones reste une liste curée à la main.
- **Aucun objet milestone persistant** (ADR-0069). `milestone:` reste une chaîne libre sur la fiche.
  La prévision vit dans `PLAN.md`, qui est une décision, pas un objet.
- **Les quatre décisions humaines** restent absolues. La coupe en est une : c'est pour ça qu'elle
  sort du run.
- **La gate de release** (`ezk release`) reste la précondition du tag.
- **Un seul flux de code** : une PR par fiche, squash sur `main`, comme avant.

### L'outillage, brique par brique

| Brique | Aujourd'hui | Après | Geste |
|---|---|---|---|
| [`version-scope.ts`](../../products/mega-city/src/backlog/version-scope.ts) | écarte les versions au-dessus de la courante | écarte les fiches hors `--milestones` | remplacée par `milestone-scope.ts`, même forme |
| [`version-checkpoint.ts`](../../products/mega-city/src/backlog/version-checkpoint.ts) | `launch()` lançable, `seal()` scellable | `launch()` par milestone ; `seal()` retirée, la coupe calcule | renommée |
| `version-sequence.ts`, [`run-versions.ts`](../../products/mega-city/bin/run-versions.ts), drapeau `--versions` | enchaîner des versions dans un run | le run enchaîne des milestones | retirés (pas de code mort) |
| drapeau `--seal-versions local` | auto-tag par le run | aucun tag par le run | retiré |
| [`backlog-version.ts`](../../products/mega-city/bin/backlog-version.ts) `list / check / close` | lots par `version:` planifié | `list` = coupes passées + prochaine coupe ; `check` = un numéro n'apparaît que sur une fiche livrée ; `close` → `tag` | réécrit |
| [`park-fiche.ts`](../../products/mega-city/src/backlog/park-fiche.ts) | vide `version:`, écrase `milestone:` par `parked` | pose un drapeau `parked:` daté, **garde la milestone** | corrigé, puis passe de tri des 85 |
| [`plan-head.ts`](../../products/mega-city/bin/plan-head.ts), `plan-lot.ts` | ordre du plan + filtre de version | ordre du plan + filtre de milestone | un import change |
| [`ezk-release`](../../products/mega-city/skills/ezk-release/SKILL.md) | gate avant tag | inchangée, précondition de `version tag` | rien |
| tags `freeze/<v>` (cycle de vie figer / dégeler) | gel du périmètre d'une version ; aucun tag `freeze/` n'existe à ce jour | à trancher au panel : gel par milestone, ou retrait | question 6 |
| [`ezk-product-build`](../../products/mega-city/skills/ezk-product-build/SKILL.md) | sections « boucle multi-versions » et « scellage » | une section « périmètre du run = milestones » ; bilan par milestone | réécrit |

## Ce que la méthode publie pour mission control

Règle inchangée (ADR-086) : la méthode interprète, mission control affiche. Le contrat
[`board-show`](../../products/mega-city/contracts/board-show/v1/schema.json) publie déjà `versions`
(courante, écartées, lots) et `milestones`. Il passe en v2 avec cette forme :

- `coupes[]` : l'historique. Pour chaque coupe : version, date, étiquette, milestones (nom, état
  complète ou partielle, fiches), correctifs.
- `prochaineCoupe` : la même forme, calculée depuis le dernier tag, plus le numéro proposé et son
  type (patch ou mineure), plus les preuves du carnet de tests (« 12 fiches sur 22 ont une preuve
  datée »). `null` si rien n'a été livré depuis le dernier tag.
- `prevision[]` : par version prévue, les milestones annoncées, et l'écart avec le livré quand la
  coupe est faite.
- `milestones[]` : nom, ordre du plan, état calculé (à groomer, prête, en construction, livrée,
  partielle), comptes de fiches, version prévue si une ligne de prévision la cite.
- `aTrancher[]` gagne un type `couper` dès que `prochaineCoupe` n'est pas vide.

### Ce que la maquette dit déjà (relue le 11 novembre)

Tu as retouché la maquette après le dossier. Quatre points comptent ici.

- **Une milestone s'appelle un objectif** à l'écran (menu « Objectifs », page « Un objectif »). Le
  champ des fiches reste `milestone:` ; la méthode publie le nom et l'ordre du plan, l'écran dit
  « objectif ».
- **La page Versions porte déjà la coupe.** Sa carte « À étiqueter » dit « depuis v0.22.0, N fiches
  livrées », propose le numéro au choix (v0.23.0, v0.22.1, v1.0.0) et un seul bouton « Étiqueter ».
  Son infobulle le dit dans tes mots : « la version n'est qu'une photo de ce qui est livré, posée
  quand le PO le décide ; son contenu se calcule ». C'est ce dossier.
- **Son compte ment, pour la raison que ce dossier corrige** : la carte affiche 7 fiches, parce
  qu'elle lit les lots qui portent un numéro (v0.23.0 et v0.24.0). Les 76 livrées sans numéro sont
  invisibles. Quand la méthode publiera « livrées depuis le dernier tag », la carte dira 85.
- **La page Décisions garde une file de versions** (« étiqueter v0.23.0 », puis « v0.24.0 une fois
  v0.23.0 close »). Avec la coupe, c'est une décision et un numéro.

Sur les écrans de la [maquette](https://claude.ai/artifact/Q6UFuLx4BoCon1CLNrmcTP), que ce modèle
**confirme** plutôt qu'il ne redessine :

| Écran | Ce qu'il montre | Ce qui vient de la méthode |
|---|---|---|
| Versions | l'historique des étiquettes ; la carte « À étiqueter » avec le contenu calculé depuis le dernier tag, la prévision en face, le numéro au choix, un seul bouton « Étiqueter » | `coupes`, `prochaineCoupe`, `prevision` |
| Objectifs | le plan de construction : liste ordonnée, nom et état de chaque objectif, c'est là qu'on lance un run | `milestones` (nom, ordre, état) |
| Vue d'ensemble | « À trancher », dont « une coupe est possible » ; rien d'autre sur les versions | `aTrancher` |
| Fiche | pas de champ version avant la coupe ; ensuite « livrée le …, dans v0.23.0 » | front-matter publié |
| Sprint | rattaché à une milestone, jamais à une version | `derniersSprints` |
| Décisions | la file « À trancher », filtrable, avec un seul type « étiqueter » quand une coupe est possible | `aTrancher` |

Tes décisions de relecture de la maquette tiennent toutes : « Versions : livrées seules », « pas de
version suivante », « un seul bouton sur la version courante », « parked n'est pas une milestone ».

## Trois journées, dans ce modèle

**Un run du matin.** `ezk-product-build run --milestones board --max-sprints 6`. À midi, le bilan :
« board complète 5/5, 3 correctifs livrés, 2 fiches à trancher ». Aucun tag, aucune fiche parkée
pour une frontière.

**Tu testes, tu coupes.** Tu ouvres mission control, carte « Prochaine coupe » : « depuis v0.22.0 :
board complète, qualite 2/4, 17 correctifs ; numéro proposé v0.23.0 ; 12 fiches sur 22 ont une
preuve datée ». Tu testes une heure. Puis `ezk release v0.23.0`, et `ezk backlog version tag v0.23.0`. Les
fiches reçoivent leur numéro, le tag local existe. Tu pousses l'étiquette quand tu veux.

**Un correctif urgent, la semaine suivante.** Une fiche `type: bug` sans milestone, construite par
un run ou à la main. `ezk backlog version tag v0.23.1` : « 1 correctif, patch ». Une milestone en cours sur
`main` n'empêche rien.

## Options écartées

| Option | Pourquoi non |
|---|---|
| Garder le numéro posé à la construction (ADR-083 §2 tel quel) | jamais appliqué en pratique ; dès que le PO ne tague pas pour tester, le tirage se bloque et le plan de versions s'éteint |
| Borner le mode auto à une seule version, et interdire le multi-versions | la frontière reste dans le run : le run devra toujours sceller ou parker pour finir ; c'est la cause, pas le périmètre |
| Report-hors ou park pour un « tag honnête » (ADR-0080 §4) | c'est le mécanisme qui a parké 16 fiches ; l'honnêteté vient du calcul du contenu, pas du tri des fiches |
| Un objet milestone persistant, avec une prévision stockée dedans | ADR-0069 : zéro objet de process ; la prévision est une décision, elle vit dans `PLAN.md` |
| Un graphe de dépendances inter-milestones | ADR-0081 : différé derrière quatre verrous, aucun franchi ici |
| Des branches de release par ligne (1.x, 2.0) dès maintenant | prématuré ; le déclencheur est nommé (§5), la branche se crée le jour où il se produit |
| Taguer après chaque milestone livrée | revient à « milestone = version » ; interdit les correctifs seuls et les versions à plusieurs milestones que tu demandes |

## Questions au panel adverse

1. **La borne de la coupe.** « Livrée, sans numéro, commit de livraison après le dernier tag » :
   quelles fiches passent entre les mailles ? Les livrées d'avant le champ `version:` (sans sha
   local) doivent rester dans l'historique, jamais dans une coupe.
2. **La milestone partielle dans une coupe.** Acceptable telle quelle, dite « partielle » ? Ou faut-il
   un garde-fou (par exemple refuser une coupe mineure dont aucune milestone n'est complète) ?
3. **Patch ou mineure.** La règle « correctifs seuls = patch, sinon mineure » tient-elle quand une
   milestone partielle n'a livré qu'une fiche de fond sans effet visible ?
4. **L'axe de tirage.** L'ordre du plan borné par `--milestones` suffit-il ? Que fait le run quand
   la milestone demandée n'a plus rien de prêt : s'arrêter, ou passer à la suivante du plan ?
5. **Deux lignes sur un seul `main`.** Le déclencheur de branche de maintenance (§5) est-il
   vérifiable, ou faut-il une règle plus simple (« la ligne 2 attend que la ligne 1 soit en
   maintenance ») ?
6. **Le gel (`freeze/<v>`).** Le cycle de vie figer / dégeler livré le 23 octobre gèle une version.
   Aucun tag `freeze/` n'existe aujourd'hui dans le dépôt. Garder un gel par milestone, ou le
   retirer sans usage prouvé ? Ma position : retirer.
7. **Le tas parké.** La passe de tri des 85 fiches repose la milestone d'origine depuis `labels:`.
   La faire avant ou après le changement de `park` ?

## Ce qui suivrait la décision (fiches candidates, à créer par `ezk-backlog add`)

Une milestone « La coupe », dans cet ordre :

1. **`park` garde la milestone** et pose un drapeau daté ; puis la passe de tri des 85 parkées.
2. **Tirage par milestone** : filtre pur `milestone-scope`, drapeau `--milestones` ; retrait de
   `--versions`, `--seal-versions` et `run versions`.
3. **`ezk backlog version tag`** : contenu depuis le dernier tag, numéro proposé, gate de release, écriture
   du numéro en compte rendu, tag local ; `list` et `check` réécrits.
4. **La prévision dans `PLAN.md`** : section, parseur, contrôle, écart prévu / livré à la coupe.
5. **Publication JSON** : contrat `board-show` v2 (coupes, prochaine coupe, prévision, milestones,
   type « couper » dans « à trancher »).
6. **Mission control** : page Versions avec la carte « Prochaine coupe », page Milestones, type
   « couper » sur la Vue d'ensemble et la page Décisions.
7. **Les ADR** : ADR-0088 ci-dessous, par `ezk adr new` ; amendements tracés dans ADR-083, 0070,
   0080, 0076 et ADR-086.

## Annexe — brouillon de l'ADR-0088, à ratifier en panel

> Dossier méthode : il ira dans `products/mega-city/docs/adr/` (ADR-078, routage), créé par
> `ezk adr new` après le panel. Le texte ci-dessous est la proposition à attaquer.

### 0088 — Deux plans : la milestone est l'unité du run, la version est une coupe posée après test

- Statut : **proposé** (2026-11-10). Amende ADR-083 §2, ADR-0070, ADR-0080 ; remplace ADR-0076.
  Ne rouvre pas ADR-0081 (graphe différé) ni ADR-0069 (zéro objet de process).
- Déciders : PO (Thomas), après panel adverse.
- Dossier : ce document.

#### En clair

Le run autonome construit des **milestones**, jamais des versions. La **version est une coupe** :
le PO la décide après test, elle couvre tout ce qui a été livré depuis le tag précédent, groupé par
milestone complète ou partielle plus les correctifs. Le numéro se pose à la coupe, en compte rendu.
Un plan de livraison dit, en prévision, quelles milestones iront dans quelle version ; il n'écrit
jamais de numéro sur une fiche.

#### Décision

1. **Le périmètre d'un run est un ensemble de milestones** (`--milestones`, défaut : la tête du
   plan). Le tirage lit l'ordre du plan, borné par ce périmètre. Un seul axe. Le run ne scelle
   rien et ne parke rien pour sceller.
2. **La coupe** (`ezk backlog version tag <v>`) calcule le contenu livré depuis le dernier tag, propose le
   numéro (patch si correctifs seuls, mineure sinon, majeure explicite), exige la gate de release,
   écrit le numéro sur les fiches coupées, pose le tag local. Le push reste au PO.
3. **La prévision** vit dans `PLAN.md`, section « Prévision de livraison » ; elle est contrôlée, et
   comparée au livré à chaque coupe. Elle n'est jamais écrite sur une fiche.
4. **Les correctifs** n'ont pas de milestone ; ils sont tirables à tout moment ; une coupe de
   correctifs seuls est un patch.
5. **Une seule branche principale.** Une branche de maintenance ne se crée que sur le déclencheur
   nommé : une fiche d'une ligne nouvelle contredit un comportement livré de la ligne en cours.
6. **`park` garde la milestone** et pose un drapeau daté.

#### Conséquences

- (+) Plus aucune fiche parkée pour une frontière ; le tag ne peut plus mentir, il est calculé.
- (+) Le run auto peut enchaîner des milestones sans jamais prendre une décision de livraison.
- (+) Les 76 fiches livrées sans numéro redeviennent visibles : elles sont la prochaine coupe.
- (−) Code retiré : enchaînement multi-versions, auto-tag, report-hors. ADR-0076 remplacé.
- (−) Une coupe peut contenir une milestone partielle ; elle le dit, c'est un état, pas une faute.
- (−) Le gel de périmètre (`freeze/`) perd son objet tel quel ; à trancher (question 6).

#### Options écartées

Voir la section « Options écartées » du dossier.
