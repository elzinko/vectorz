---
type: panel
date: 2026-11-14
theme: "La coupe : la milestone se construit, la version se coupe — panel adverse du dossier du 10 novembre"
scope: "le dossier docs/plans/2026-11-10-deux-plans-milestone-run-version-coupe.md et son brouillon d'ADR-0088 ; ses sept questions, plus la forme de l'objet nommé (décision PO n° 2 du 14 novembre), la cohérence avec les décisions PO 1 et 3, et les deux confirmations que le PO garde ; trois lentilles (architecte de la méthode, produit au nom du PO, qualité-release-autonomie) puis deux juges adverses (PO adverse, gardien de la méthode) ; mesures rejouées en lecture seule sur HEAD 2a90f349 puis 92e976bc ; le panel n'a rien écrit"
participants: [architecture, produit, qualite, juge, po]
---

# Panel adverse — la coupe : deux plans, milestone et version (2026-11-14)

**En clair :** Le modèle du dossier tient : le run construit des objectifs, toi seul coupes des versions
après test. Le panel demande d'**amender** le brouillon d'ADR-0088 avant de le ratifier, pas de le
rejeter : la borne de la coupe doit s'écrire comme une règle git, le numéro proposé se décide sur le type
des fiches, le gel se retire, et l'objet qui porte un nom devient un fichier d'identité sans état. Quatre
questions reviennent à toi, un oui ou un non chacune ; le reste est décision de méthode.

## 1 · La demande

La fiche [Trancher la coupe](../../features/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md)
(carte des écarts du 14 novembre, écart I4) demande un panel adverse sur les sept questions du dossier,
la forme de l'objet nommé (décision 2 du PO du 14 novembre, qui heurte « aucun objet milestone persistant »
du dossier), et la cohérence avec les décisions 1 (numéro de sprint continu) et 3 (graphe compilé = contrat).
Le PO garde deux confirmations : « But du sprint » comme mot d'écran du Sprint Goal, et le « but de
version » laissé ouvert dans l'ADR-0080. Le panel doit les faire surgir.

Ce que le dossier interdit de rouvrir, et que le panel a respecté : le graphe de dépendances (ADR-0081),
les quatre décisions humaines (la coupe en est une), la gate de release comme précondition du tag, un seul
flux de code. Un seul interdit a été rouvert, par les trois lentilles et les deux juges, et de façon
bornée : « aucun objet milestone persistant » (section 4). Raison : la décision 2 du PO est postérieure au
dossier, et la fiche du panel en fait son point de tension.

## 2 · Méthode

Trois lentilles indépendantes, puis deux juges adverses qui attaquent les convergences. Chaque lentille a
répondu aux dix questions avec preuves (fichier:ligne, chiffre rejoué, ADR cité), un risque si elle se
trompe, une recommandation d'une ligne, et son verdict sur le brouillon d'ADR-0088. Les juges ont tranché
les divergences preuve en main et dit, question par question, ce qui revient au PO. Le panel a tourné en
lecture seule : rien d'écrit, aucun git d'écriture. Les mesures sont rejouables (section 9).

Les trois lentilles et les deux juges rendent le même verdict sur l'ADR-0088 : **amender**, puis ratifier.

## 3 · Les verdicts, question par question

| # | Question du dossier | Verdict du panel | Ce que l'ADR-0088 doit écrire |
|---|---|---|---|
| 1 | La borne de la coupe | **Conditionnel : la borne tient si elle s'écrit comme une règle git, pas comme une date.** Depuis v0.22.0, 86 fichiers sont entrés dans `features/done/` : 79 fiches livrées (72 sans numéro, 4 en v0.23.0, 3 en v0.24.0) et 7 closes sans livraison (4 split, 3 superseded). Le dossier confond « ajoutée à done/ » et « livrée ». Les 79 sha de `pr:` sont ancêtres de HEAD, aucun de v0.22.0. | Livrée = `status: shipped` seul. Commit de livraison = le sha de `pr:` s'il est ancêtre de HEAD ; sinon le commit du ship (ajout à done/, `--no-renames --diff-filter=A`), écart signalé ; sinon « non datable », listée hors coupe. Fenêtre = après le dernier tag de release strict atteignable depuis HEAD (même règle que `releaseTagFor`, jamais `v*`, qui attrape les pré-versions de muti) ; sans tag strict, tout le livré, dit tel quel. Les `version:` préposés sur des fiches livrées de la fenêtre sont réécrits, avec une ligne d'avertissement. |
| 2 | La milestone partielle dans une coupe | **Oui, telle quelle, dite « partielle ». Aucun garde-fou bloquant.** Toute coupe d'aujourd'hui est partielle (board 45/77, qualite 10/13, cockpit 3/5, exploration-app 3/5, methode-configurable 2/3) : un garde-fou interdirait la première coupe et re-déciderait à la place du PO. | « Complète » = aucune fiche active non parkée. Le dry-run et l'objet version écrivent « partielle k/n (p parkées, d différées) » ; le dry-run rejoue les avertissements de dépendance (`dependencyFindings`) sans bloquer, et dit « aucun objectif complet dans cette coupe » s'il y a lieu. |
| 3 | Patch ou mineure | **Non en l'état : « correctif » n'est pas défini.** `type:` ne porte pas le sens semver (un chore peut retirer un comportement visible). Une proposition doit se tromper vers la mineure, jamais vers le patch. | Patch proposé si et seulement si chaque fiche de la coupe est `type: bug` ; sinon mineure ; majeure sur `--major` seulement. Numéro strictement supérieur au dernier tag strict atteignable, jamais déjà tagué, jamais déduit du plus grand `version:` du backlog. Le PO impose un autre numéro d'un mot ; l'objet version écrit `numero: propose` ou `impose`. |
| 4 | L'axe de tirage | **Oui, l'ordre du plan borné par `--milestones` suffit**, à condition que la méthode lise cet ordre : aucun code ne le fait aujourd'hui, et `MILESTONE_ORDER` (`avancement-data.ts:36-44`) est périmé. | L'ordre des objectifs = première apparition d'une fiche de chaque milestone dans `PLAN.md` (`parsePlanOrder`) ; `MILESTONE_ORDER` est retiré ; une milestone sans fiche planifiée est « non planifiée ». Un bug qui porte une milestone appartient à elle ; un bug sans milestone est toujours dans le périmètre ; une fiche active sans objectif, hors bug, est écartée et listée (8 aujourd'hui). Sans drapeau : la première milestone non livrée, puis arrêt qui nomme la suivante sans la prendre (question au PO, section 6). `--milestones a,b` ou `all` enchaîne, avec un bilan à chaque frontière. |
| 5 | Deux lignes sur un seul `main` | **Non : le déclencheur du dossier (« un critère d'acceptation contredit un comportement livré ») n'est pas vérifiable.** Aucune branche release ou maint n'existe ; 22 tags sur 22 sont ancêtres de HEAD. Le dossier se contredit (§4 : un patch « même pendant une milestone à moitié construite », puis « ce patch contient ses fiches livrées »). | Deux refus mécaniques de `version tag`, à la place du déclencheur : un numéro inférieur ou égal au dernier tag strict atteignable ; un numéro de patch quand la fenêtre contient une fiche hors `type: bug`. Dans les deux cas le verbe nomme les deux sorties : couper une mineure, ou ouvrir `maint/vX.Y` depuis le tag `vX.Y.0` et y reporter les correctifs par leurs sha. Avant ce jour : une seule ligne se construit sur `main`, la suivante se groome. La branche de maintenance reste une décision du PO (question, section 6). |
| 6 | Le gel `freeze/<v>` | **Retirer.** 0 tag `freeze/` sur 91 tags, un mois après la livraison ; aucun bouton « figer » dans la maquette ; avec la coupe, il n'y a plus de périmètre planifié à photographier. | Retirer `freeze`, `unfreeze`, `diff`, `frozenBaseIds`, `freezeTagOf`, `freezeTagFor`, `lifecycleOf`, `diffFrozen`, `FrozenDiff`, les champs `frozen` / `freezeTag` du lot et `cycleDeVie` / `etiquetteGel` du contrat (9 fichiers, 84 lignes, 4 tests), dans l'unique montée en v2 de `board-show` qui porte aussi le retrait de `parked` dans `milestones[]`, de `courante`, `ecartees`, `sansVersion`, et de l'état `a-clore` ; cop1 suit dans le même lot. |
| 7 | Le tas parké | **Après le changement de `park`.** Si la passe de tri repose une milestone avant, 84 idées se réveillent (isParked = `idea` + `milestone: parked`, lu à trois endroits). Et la prémisse « park a écrasé la milestone d'origine » est fausse pour 72 des 84 : elles n'en avaient aucune ; les 12 autres venaient d'objectifs livrés. 19 sur 84 portent un label égal à un nom de milestone. | Une seule forme : `milestone:` intact, `parked: <date>`, `blocked: <raison typée>` ; `isParked` lit le drapeau en un seul endroit (`fiche-schema.ts`), `versions.ts` l'importe, `regen-backlog.sh` change de colonne, le schéma de fiche déclare le champ. Puis la passe de tri assistée : 19 origines évidentes écrites, le reste « origine inconnue », curation du PO. Les parkées sortent du dénominateur d'un objectif. |

Les trois questions ajoutées par la fiche et la carte :

| # | Question | Verdict du panel |
|---|---|---|
| 8 | La forme de l'objet nommé (décision 2) | Section 4 : un fichier d'identité par objectif, un compte rendu par version écrit par la coupe ; aucun état dedans. |
| 9 | Cohérence avec les décisions 1 et 3 | **Cohérent, et renforcé.** Le sprint se rattache à un objectif, jamais à une version : le numéro continu ne dépend d'aucune coupe, et la coupe peut dire « livrée par les sprints N à M » par jointure sur les lots scellés. Le graphe compilé et l'objet nommé suivent la même doctrine : les objets se déclarent, la méthode extrait, mission control consomme. Oubli commun des trois lentilles, confirmé par les juges : **ADR-079 D2** construit la clé de chantier depuis la version ; `deriveChantierKey` rend `undefined` sans version (`runtime.ts:124-129`). L'ADR-0088 doit l'amender : la clé de chantier est l'objectif ; la version est un attribut posé après la coupe ; un lancement multi-objectifs porte la clé du premier et liste les autres. |
| 10 | Les deux confirmations du PO | **« But du sprint » : oui.** Le Guide Scrum français dit « Objectif de sprint » ; « Objectif » est pris par la milestone depuis le 11 novembre ; « But du sprint » évite la collision et reste le Sprint Goal (ce que `start --objective` saisit, drapeau interne). Le texte est déjà dans ADR-0054 § Nommage ; il manque ton oui. **« But de version » : non.** La version est une photo posée après test ; elle a un nom posé à la coupe et des notes, pas de but ; l'intention vit sur l'objectif (champ `but`) et sur le sprint. Le point ouvert d'ADR-0080 (lignes 87-88) se ferme par une ligne datée. « But du produit » reste réservé au Product Goal, décision PO à part, plus tard. |

## 4 · La forme de l'objet nommé (décision 2 du PO)

Le heurt était mal attribué. ADR-0069 interdit de **stocker un état calculé** (l'étape, le sprint) ; un nom
en clair n'est pas un état, c'est une déclaration, comme le titre d'une fiche. Le texte à amender est
ADR-0083 §3, qui a étendu l'interdit en « aucun objet milestone persistant ». Forme retenue, réduite au
nécessaire par le juge PO adverse :

- **Un objectif** : `features/milestones/<slug>.md`, front-matter `milestone` (la valeur exacte du champ
  des fiches), `nom`, `but` facultatif, `created`. Ni ordre (il vit dans `PLAN.md`), ni état (calculé par
  jointure), ni version prévue (le gardien de la méthode la voulait en champ facultatif `version_prevue`,
  le PO adverse la refuse tant qu'aucune coupe ne l'a réclamée : laissée hors du premier lot). Créé par
  `ezk backlog milestone add <slug> --nom`, proposé au grooming quand une valeur neuve apparaît sur une
  fiche ; `backlog check` avertit sur un lien vers un objectif non déclaré, sans refuser.
- **Une version** : `features/versions/<vX.Y.Z>.md`, écrit par la coupe : `version`, `nom` facultatif
  (`--nom`, éditable après), `date`, `commit`, `gate` (verdict, passes jouées, soupape), `numero: propose`
  ou `impose` ; corps = les notes de version rendues par objectif (complète ou partielle k/n) et
  correctifs. Ni état, ni prévision.
- **Migration** : les 22 noms de la table « Train de versions » de `PLAN.md` passent dans les objets, puis
  la table est retirée ; `PLAN.md` ne porte plus aucun nom d'objectif ni de version. Deux sous-dossiers
  neufs sous `features/` : c'est une migration de layout (Skema, `layout_version`) pour tous les projets
  qui portent la méthode, pas seulement vectorz ; le loader et `regen-backlog.sh` doivent ignorer ces
  sous-dossiers.
- **ADR-0069 reste intact** ; ADR-0083 §3 est amendé pour dire : « un objet d'identité, jamais un objet à
  état ». Le verrou 3 de l'ADR-0081 (« aucun objet milestone ») est levé pour l'identité seule.

## 5 · Cohérence avec les décisions 1 et 3

Voir la ligne 9 du tableau. Deux conséquences pour les fiches du lot : le compte rendu de sprint porte
`objectif:` (fiche [Le sprint se publie avec son numéro continu](../../features/20261114131612204_sprint-publie-numero-but-branche.md)),
et la fiche [L'émetteur nomme la session](../../features/20261114131612388_session-nommee-cle-de-chantier-derivee.md)
dérive la clé de chantier de l'objectif seul, ce que ce panel confirme.

## 6 · Ce qui revient au PO

Quatre questions, un oui ou un non chacune. Les deux juges ne renvoient au PO que celles-là : les autres
sont des décisions de méthode, ou des décisions qu'il a déjà prises (8, 11, 12 et 14 novembre).

1. **« But du sprint »** comme mot d'écran du Sprint Goal (le drapeau `--objective` reste interne), et
   **pas de « but de version »** : la version a un nom posé à la coupe et des notes, pas de but. Oui ?
2. **La forme de ta décision 2** : un fichier d'identité par objectif (`features/milestones/<slug>.md`) et
   un par version écrit par la coupe (`features/versions/<v>.md`), sans aucun état calculé dedans ;
   ADR-0083 §3 amendé pour le dire. Oui ?
3. **Un correctif livré pendant qu'un objectif est à moitié construit sort dans une mineure** qui embarque
   l'objectif partiel, pas dans un patch ; `version tag` refuse un numéro de patch dans ce cas et nomme
   les deux sorties (couper une mineure, ou ouvrir toi-même `maint/vX.Y` depuis le tag). Oui ?
4. **Sans drapeau `--milestones`**, un lancement construit la première milestone du plan et s'arrête à sa
   fin en nommant la suivante, sans la prendre. Oui ?

Ce que le panel **ne lui demande pas**, parce que c'est à la méthode de le décider : la forme du drapeau
de `park`, la règle du numéro proposé, le retrait du gel, l'ordre de la passe de tri, la clé de chantier
d'un lancement multi-objectifs, le texte du Product Goal (décision PO à part, un autre jour).

| | Décision | Date |
|---|---|---|
| 1 | But du sprint = Sprint Goal ; pas de but de version | ⏳ |
| 2 | Objectifs et versions = fichiers d'identité sans état ; ADR-0083 §3 amendé | ⏳ |
| 3 | Correctif pendant un objectif partiel → mineure ; patch refusé, deux sorties nommées | ⏳ |
| 4 | Sans `--milestones`, une milestone puis arrêt qui nomme la suivante | ⏳ |

## 7 · ADR-0088 : amender, puis ratifier

Le brouillon du dossier (annexe) reçoit ces amendements avant ratification :

1. **Les chiffres** (En clair, Contexte, Conséquences) : 86 fichiers entrés dans `features/done/` depuis
   v0.22.0 ; 79 livrées (72 sans numéro, 4 en v0.23.0, 3 en v0.24.0 sans tag) ; 7 closes sans livraison ;
   84 parkées, 61 sans raison typée ; 8 fiches actives sans objectif.
2. **Décision 1, le périmètre du run** : l'ordre des objectifs dérivé de `PLAN.md` ; `MILESTONE_ORDER`
   retiré ; sans drapeau une milestone puis arrêt qui nomme la suivante (sous réserve du oui n° 4) ;
   `--milestones a,b` ou `all` enchaîne avec bilan à chaque frontière ; le bug qui porte une milestone
   appartient à elle ; les fiches sans objectif hors bug sont écartées et listées.
3. **Décision 2, la coupe** : la borne (question 1) ; la séquence : la gate joue **avant** toute écriture
   (doctrine « refus = rien d'écrit » de `backlog-version.ts`), puis sur GO la coupe écrit `version:` sur
   les fiches et le fichier de version, committe, et tague ce commit ; la passe `dod-mecanique` de la gate
   devient `backlog version tag <v> --dry-run` (aujourd'hui `check <v>` sort en 1 sur une version que
   personne ne porte encore : la chaîne du dossier se bloquait sur son propre code) ; « rien ne change dans
   ezk-release » est retiré, la coupe compose la gate elle-même (un seul geste, décision PO du 12 novembre).
4. **Décision 2, le numéro** (question 3).
5. **Décision 3, la prévision** : sortie du premier lot. La phrase « elle vit dans `PLAN.md`, jamais sur
   une fiche ni sur un objet » reste ; aucun parseur ni section nouvelle tant qu'aucune coupe ne l'a réclamée.
6. **Décisions 4 et 5** : supprimer « tu coupes un patch même pendant qu'une milestone est à moitié
   construite » ; écrire les deux refus mécaniques (question 5) et « une seule ligne se construit sur
   `main`, la suivante se groome » (sous réserve du oui n° 3).
7. **Décision 6, park** : la forme unique (question 7) et l'ordre code → contrat v2 → passe de tri.
8. **Décision 7, nouvelle : les objets d'identité** (section 4, sous réserve du oui n° 2).
9. **Décision 8, nouvelle : le gel retiré** (question 6).
10. **Table « Ce que ça amende »** : ajouter ADR-079 D2 (clé de chantier = objectif) et ADR-0083 §3
    (objet d'identité) ; ADR-0076 « remplacé » ; ADR-086 touché seulement sur la table « à publier » ;
    fermer le point « but de version » d'ADR-0080 par non (sous réserve du oui n° 1).
11. **Ce que la coupe garantit, dit au PO** : la gate socle ne joue aucun test aujourd'hui (fiche
    [La gate de release joue les tests du projet](../../features/20261114131613314_gate-de-release-joue-les-tests.md)) ;
    sur ce dépôt, 6 verdicts GO pour 22 tags : la première coupe sera la première gate vraiment jouée.
12. **La coupe se joue sur `main`** : `close --tag` tague HEAD quelle que soit la branche
    (`backlog-version.ts:312`) ; six dossiers de travail vivent en parallèle ; `version tag` refuse de
    tourner hors de la branche principale.

## 8 · Angles morts relevés par les juges

- Le lanceur de mission control tue tout appel `ezk` à 30 secondes (`ezkExec.ts:13`) : le bouton
  « Versionner » lancera une gate qui jouera les tests du projet ; il doit devenir un travail suivi avec
  journal (fiches [config-show v2](../../features/20261114131613503_contrat-config-show-v2-passes-tests-niveaux.md)
  et [version tag](../../features/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md)).
- Doctrine de la cloche (11 novembre) : une alerte naît d'un évènement, jamais d'un compteur. « Une coupe
  est possible dès que `prochaineCoupe` n'est pas vide » est un compteur : le type `couper` doit naître de
  l'évènement « une fiche livrée après le dernier tag » (fiche [la cloche](../../features/20261114131612944_ezk-now-json-alertes-de-la-cloche.md)).
- Les sha de `pr:` ne sont jamais le commit d'ajout à `done/` (79 sur 79 diffèrent : le code et le ship
  sont deux commits) : le repli « commit du ship » est un autre évènement, à dire tel quel.
- `git describe --match 'v*'` attrape une pré-version : sur muti les seuls tags sont `v1.7.0-rc.4/5/6`,
  que `releaseTagFor` exclut ; l'ADR dit « tag strict ».
- cop1 lit `comptes.sansVersion` (`ezkPlanTranslator.ts:305`) et `etat === 'a-clore'` (`:196`, `:201`) :
  sous le modèle, le premier vaut « toutes les actives » et le second n'existe plus ; les deux champs
  perdent leur sens, cop1 suit dans le saut v2.
- `method/ceremonies.yml` n'a aucun élément pour la coupe : sans un élément « Versionner » déclaré, la
  coupe n'apparaît pas sur la page Process (fiche [La méthode émet ses étapes fines](../../features/20261110191135802_methode-emet-ses-etapes-fines.md),
  cinquième compétence).
- Les trois lentilles se sont contredites sur des comptes simples (fiches actives sans milestone : 9, 5, 5 ;
  réel 8) : un panel qui recompte à la main viole ADR-0001 ; les commandes sont dans la section 9.
- Le commit 92e976bc, posé le jour même par la fiche des amendements, écrit « l'objectif ou la version en
  construction » dans ADR-079 D11 alors que la clé de chantier devient l'objectif : corrigé le jour même
  (1c1c39de, « l'objectif en construction »).

## 9 · Mesures rejouées

Depuis la racine du dépôt, à HEAD 2a90f349 (lentilles) puis 92e976bc (juges), le 14 novembre :

```bash
git log v0.22.0..HEAD --diff-filter=A --name-only --format= -- features/done | grep -c '\.md$'   # 86
git tag -l 'freeze/*' | wc -l                                                                   # 0
git tag -l | wc -l                                                                              # 91
grep -c '^milestone: parked' features/*.md                                                      # 84
ezk --root "$(git rev-parse --show-toplevel)" backlog version list
ezk --root "$(git rev-parse --show-toplevel)" backlog version check v0.25.0 ; echo "EXIT=$?"     # 1 : aucune fiche ne porte la version
ezk --root "$(git rev-parse --show-toplevel)" board show --json | jq '.milestones[] | {milestone, status, total, shipped}'
```

Les comptes par statut des 86 fichiers (79 shipped, 4 split, 3 superseded), les 79 sha ancêtres de HEAD
et aucun de v0.22.0, et l'origine des 84 parkées lue commit par commit, viennent des lentilles et des
juges (rapport complet du panel : `tasks/w39yjzucj.output` de la session maquette, hors dépôt).

## 10 · Application

- **ADR-0088** : écrit par la fiche [Trancher la coupe](../../features/20261114131613874_trancher-la-coupe-dossier-panel-adr-0088.md)
  avec les amendements de la section 7 ; statut « accepté » dès les quatre oui du PO, « proposé » avant.
- **Amendements** : ADR-0083 §2 et §3, ADR-0070, ADR-0080 (dont le point « but de version »), ADR-0076
  (remplacé), ADR-079 D2, ADR-086 (table « à publier »).
- **Fiches débloquées ou requalifiées** : [version tag](../../features/20261114131613689_ezk-backlog-version-tag-un-seul-verbe.md)
  perd `blocked: panel` ; [Séquencer par milestone + dépendances inter-milestones](../../features/20261016081021364_sequencer-par-milestone-dependances.md)
  est requalifiée (la coupe et l'ordre dérivé du plan en reprennent le cœur, le graphe reste différé) ;
  [les objectifs publiés](../../features/20261114131612572_objectifs-publies-comme-objets.md),
  [les versions publiées](../../features/20261114131612759_versions-publiees-comme-coupes.md) et
  [la fin du pseudo-objectif « parked »](../../features/20261114131614612_parked-n-est-plus-un-pseudo-objectif.md)
  prennent la forme de la section 4.
- **Suites nommées, pas décidées** : le Product Goal (« But du produit »), une décision PO à part ; la
  passe de tri des 84 parkées, curation du PO ; les notes de version rendues depuis l'objet version.
