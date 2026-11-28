---
type: retro
date: 2026-11-28
theme: "Run autonome du 26 novembre « migre tout vers la maquette » : quatorze fiches livrées, des pertes de temps qui viennent de l'outillage autour du code"
scope: "sprints 22 à 28 du 26 novembre (mission control aligné sur la maquette), mode auto ; rétro complète choisie par le PO ; cinq lentilles en sous-agents indépendants, deux tours ; pas de juge, car aucune règle neuve n'a été retenue ; tri des 18 notes du carnet hors git"
participants: [architecture, qualite, revue, dev, produit, po]
actions:
  - proposition: "La vérification des fiches refuse une fiche livrée qui n'a plus sa section « Critères d'acceptation ». C'est le filet qui aurait vu les sept fiches abîmées par le script de finalisation."
    kind: feature
    by: [architecture, qualite, revue, dev, produit]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000201 créée au backlog."
    date: 2026-11-28
  - proposition: "Une commande de la méthode finalise une fiche : elle coche les critères prouvés, pose la preuve avant/après et écrit la référence de livraison au bon format. Elle refuse un nom de fiche inconnu. Elle remplace les scripts maison du pilote."
    kind: feature
    by: [architecture, qualite, revue, dev, produit]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000202 créée au backlog."
    date: 2026-11-28
  - proposition: "Quand une story touche un contrat ou son exemple, la gate rejoue aussi les tests des produits qui le lisent, d'après une liste déclarée « contrat → lecteurs ». Les lecteurs choisissent un élément du contrat par sa clé, jamais par sa place. La gate dit aussi ce qu'elle n'a pas contrôlé, par exemple le lint du web de mission control. Une seule fiche, livrée en trois tranches."
    kind: feature
    by: [architecture, qualite, revue, dev, produit]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000203 créée au backlog."
    date: 2026-11-28
  - proposition: "Les leçons de revue deviennent un fichier gardé dans le projet. Le brief du développeur le reçoit d'office, avec la consigne de comparer sa page à la maquette dès le premier jet. Le relecteur y ajoute chaque défaut qui revient."
    kind: feature
    by: [architecture, qualite, revue, dev, produit]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000204 créée au backlog."
    date: 2026-11-28
  - proposition: "À chaque acceptation, les dettes non bloquantes nommées par le product owner virtuel vont dans une seule fiche de dettes par run, chacune liée à sa fiche mère. Elles ne restent plus dans le journal de sprint, qui n'est pas versionné."
    kind: feature
    by: [produit, architecture, dev]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000205 créée au backlog."
    date: 2026-11-28
  - proposition: "Quand on prépare une fiche d'écran, chaque donnée dessinée par la maquette est reliée au champ publié qui la fournit. Une donnée sans source est signalée au grooming, sans bloquer la fiche."
    kind: feature
    by: [produit, dev]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000206 créée au backlog."
    date: 2026-11-28
  - proposition: "Un test commun lance chaque commande --json de la méthode sur une sortie de plus de 64 Ko et vérifie qu'elle arrive entière par un tuyau. La règle sur ce sujet existe déjà, mais le défaut est revenu : il faut un test, pas une règle de plus."
    kind: feature
    by: [qualite, dev, revue]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000207 créée au backlog."
    date: 2026-11-28
  - proposition: "Le portier retient, pour la durée du run, un passage outre déjà accordé par le PO sur un dossier de travail d'une autre session qui ne touche pas les mêmes fichiers. Il ne le redemande plus à chaque sprint."
    kind: feature
    by: [dev, produit]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000208 créée au backlog."
    date: 2026-11-28
  - proposition: "Le compte rendu de sprint compte les intégrations locales. Aujourd'hui, il écrit « 0 PR mergée » quand le projet travaille sans GitHub."
    kind: feature
    by: [produit, qualite]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000209 créée au backlog."
    date: 2026-11-28
  - proposition: "Exploration : vérifier que la simulation (--dry-run) de l'intégration n'écrit rien et rend le même verdict que la vraie fusion, sur trois cas : depuis un dossier de travail, avec un conflit, avec une branche déjà intégrée."
    kind: spike
    by: [qualite, dev, architecture]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000210 créée au backlog."
    date: 2026-11-28
  - proposition: "Distinguer « lot livré », que le run peut sceller seul, de « version complète », qui porte aussi des fiches réservées au PO. Un run autonome n'est plus bloqué par une fiche qui attend le PO."
    kind: feature
    by: [produit]
    status: ✅
    decision: "Retenue par le PO : fiche idée 20261128120000211 créée au backlog."
    date: 2026-11-28
  - proposition: "Découper Board.tsx et board.css, les deux gros fichiers de l'écran, en un fichier par page. L'équipe recommande de l'écarter : les conflits étaient simples et leur coût n'est pas mesuré."
    kind: feature
    by: [architecture]
    status: ❌
    decision: "Écartée par le PO, comme le recommandait l'équipe : conflits simples, coût non mesuré. À rouvrir après trois conflits difficiles sur ces fichiers."
    date: 2026-11-28
---

**En clair :** le run a livré les quatorze fiches prévues, toutes vérifiées. Les pertes de temps
viennent de l'outillage autour du code. Un script maison a abîmé sept fiches. Une story a cassé les
tests d'un autre produit sans que sa gate le voie. Les leçons de revue et les dettes ont vécu dans
des fichiers qui disparaissent avec la session. L'équipe propose onze changements, tous des
fonctionnalités et non des règles. Le PO les a retenus le 28 novembre et a écarté le douzième.

## 1 · Les faits de départ

Le run du 26 novembre a tenu sept sprints, numérotés 22 à 28. Il a livré quatorze fiches sur `main`
local, avec zéro fiche bloquée et zéro sautée. Chaque fiche a eu sa gate verte, la revue adverse et
l'acceptation du product owner virtuel. Le premier sprint a duré 1 h 49, découpage de la maquette
compris. Les suivants ont pris entre 15 et 44 minutes. Rien n'est poussé.

Fiches livrées :

- [Mission control a l'habillage de la maquette](../../features/done/20261126170000101_habillage-commun-entete-fil-ariane-pied.md)
- [Projets et Vue d'ensemble selon la maquette](../../features/done/20261126170000102_projets-et-vue-densemble-selon-la-maquette.md)
- [La page Fiches est une liste filtrable](../../features/done/20261126170000103_fiches-liste-facon-jira.md)
- [Les pages Sprints et d'un sprint](../../features/done/20261126170000104_sprints-liste-et-page-dun-sprint.md)
- [Les pages Sessions et d'une session](../../features/done/20261126170000105_sessions-liste-et-page-dune-session.md)
- [Les pages Versions et d'une version](../../features/done/20261126170000106_versions-et-page-dune-version.md)
- [Les pages Objectifs et d'un objectif](../../features/done/20261126170000107_objectifs-et-page-dun-objectif.md)
- [Une page qui liste les rétros passées](../../features/done/20260826072532537_vue-retros-actions-ezk-map.md)
- [L'écran Process complété avec la maquette](../../features/done/20261126170000108_process-completer-lecran-avec-la-maquette.md)
- [La page Loi : règles en vigueur et paquets](../../features/done/20261126170000109_loi-regles-en-vigueur-et-paquets.md)
- [La page Configuration en quatre blocs](../../features/done/20261126170000110_configuration-blocs-projet-process-niveaux-plugins.md)
- [La page Recettes en liste compacte](../../features/done/20261126170000111_recettes-liste-compacte.md)
- [La méthode publie les alertes de la cloche](../../features/done/20261114131612944_ezk-now-json-alertes-de-la-cloche.md)
- [La cloche d'alertes de l'en-tête](../../features/done/20261126170000112_cloche-dalertes-de-len-tete.md)

Ce qui a bien marché :

- Deux développeurs ont travaillé en parallèle sur des fichiers distincts.
- Les lots de deux stories par sprint ont tenu.
- Une liste de neuf leçons de revue, donnée à chaque développeur à partir du sprint 25, a réduit les refus.

Les frictions observées :

1. **Un script maison a abîmé sept fiches livrées.** La méthode n'a pas de commande pour cocher les
   critères prouvés et poser la preuve. Le pilote a donc écrit un script. Ce script a effacé le titre
   « Critères d'acceptation » dans sept fiches et leurs corps de PR locaux. Aucune vérification ne
   l'a vu. La réparation est sur `main`, au commit 00979e9c.
2. **Une story de la méthode a cassé cinq tests de mission control.** La story qui publie les
   alertes a ajouté un lot à l'exemple du contrat du tableau. Cinq tests du daemon prenaient leur lot
   par sa place dans la liste. La gate de la story ne lançait que les tests de la méthode. Le défaut
   n'est apparu qu'au sprint suivant.
3. **Le daemon lance la commande ezk du dossier principal.** Une nouvelle commande de la méthode
   n'est donc visible dans mission control qu'après son intégration. La cloche n'a pu être vérifiée
   qu'après l'intégration de la story des alertes.
4. **Le lint ne couvre pas le web de mission control.** La gate de cette partie se réduit au
   contrôle des types et aux tests. On ne l'apprend qu'en lisant la configuration du lint.
5. **La revue a bloqué sur les mêmes défauts, story après story** : faux zéros, code mort, lien non
   branché, page entière qui tombe sur une donnée mal formée. Les règles existent déjà. La liste de
   leçons a aidé, mais elle vit dans un dossier temporaire de la session.
6. **La maquette dessine des données que la méthode ne publie pas.** Six éléments ont été retirés en
   cours de développement. On l'a découvert en codant, pas en préparant les fiches.
7. **Les comptes rendus de sprint affichent encore des zéros trompeurs.** Les sept disent « total 0
   jeton ». Ce zéro figure désormais dans 49 comptes rendus sur 94. Ils disent aussi « 0 PR mergée »,
   alors que quatorze intégrations locales ont eu lieu.
8. **Quatre fiches sur quatorze n'ont pas leur référence de livraison complète.** Le bilan de run
   exige un format précis. Un script maison a aussi été appelé avec un mauvais nom de fiche.
9. **Le portier a redemandé sept fois la même chose.** Il a signalé à chaque sprint le dossier de
   travail d'une autre session, qui ne touche que les dépendances. Il a fallu ressaisir le même
   passage outre à chaque fois. Le premier essai a été refusé par le contrôle de sécurité de l'outil.
10. **Conflits simples, mais à chaque sprint.** Chaque story ajoute un bloc aux deux mêmes gros
    fichiers de l'écran. La reprise de branche a demandé à chaque fois de « garder les deux ».
11. **Les développeurs ont buté sur un port déjà pris** par le serveur d'une autre session. Le pilote
    n'a pas arrêté ce serveur à leur place et l'a signalé. Le PO l'a arrêté ensuite.
12. **Une commande de la méthode coupait son JSON à 64 Ko.** C'est le deuxième cas, après celui du
    1er novembre. Une règle existe depuis ce premier cas.
13. **Les dettes non bloquantes ne vont nulle part.** Le product owner virtuel en a nommé une
    douzaine. Trois seulement ont donné une fiche : [la cloche se souvient des alertes fermées](../../features/20261126170000113_la-cloche-se-souvient-des-alertes-fermees.md),
    [une commande ajoute une recette au projet](../../features/done/20261126170000114_ezk-recipes-add-ajoute-une-recette-au-projet.md)
    et [le bouton « + Ajouter » des recettes](../../features/20261126170000115_bouton-ajouter-de-la-page-recettes.md).
14. **Les jetons du run ne sont pas mesurés.** On ne peut pas dire si la cible de 200 000 jetons par
    fiche a tenu.
15. **La comparaison à la maquette est venue tard.** Le PO a demandé lui-même la maquette en local et
    la liste des écarts.

Signaux lus en plus :

- Les sept comptes rendus de sprint du 26 novembre.
- Trois comptes rendus des 24 et 25 novembre, qu'aucune rétro n'avait lus. Deux fois, deux fiches y
  sont livrées dans une seule intégration.
- Le journal de sprint de la branche. Sa section des galères est vide : les galères sont dans ses notes.
- Les 18 notes du carnet hors git, du 14 octobre au 15 novembre. Aucune ne porte sur ce run.

## 2 · Tour 1 — chaque lentille propose

Cinq agents de l'équipe ont travaillé chacun de son côté, sur le même dossier de faits.

- **Architecture.** Elle a confirmé dans le code que les tests du daemon lisent le contrat par
  position. Elle propose que les lecteurs choisissent un élément par sa clé. Elle propose aussi de
  découper les deux gros fichiers de l'écran, et de faire de chaque dette une fiche.
- **Qualité.** Elle a confirmé que le lint exclut le web de mission control. Elle propose que la gate
  rejoue les lecteurs d'un contrat, que la gate dise ce qu'elle ne couvre pas, et une commande pour
  finaliser une fiche.
- **Revue.** Elle propose de garder les leçons de revue dans le dépôt, et que le développeur relise
  lui-même la liste des défauts connus avant de rendre. Elle propose aussi le filet sur la section
  « Critères d'acceptation ».
- **Dev.** Il propose la commande de finalisation, la gate qui rejoue les lecteurs, les leçons
  durables, et une fiche de dettes par sprint. Son dossier isolé ne lui donnait pas accès au carnet.
- **Produit.** Il propose de ranger les dettes en fiches, la commande de finalisation, et de relier
  chaque donnée d'écran à sa source avant le développement. Il a trié les 18 notes du carnet.

Deux propositions ont fait l'unanimité dès ce tour : le filet sur la section « Critères
d'acceptation », et les leçons de revue gardées dans le dépôt.

## 3 · Tour 2 — confrontation et convergence

Chaque lentille a réagi à la synthèse du tour 1, avec un argument pour chaque position.

- **Le filet et la commande de finalisation restent deux fiches.** La commande écrit, le filet
  vérifie. Le filet attrape aussi une fiche abîmée à la main. Tout le monde le met en premier.
- **Trois idées sur la gate et les contrats fusionnent en une fiche.** Rejouer les lecteurs attrape
  la casse. Lire par clé la prévient. Dire ce qui n'est pas couvert rend la gate honnête. Le dev
  demande une liste déclarée « contrat → lecteurs » plutôt qu'une recherche par nom, qui rate les
  renommages. La qualité demande un test qui échoue si un lecteur n'est pas trouvé.
- **La relecture par le développeur fusionne dans les leçons durables.** Quatre lentilles sur cinq
  la jugent redondante : relire la liste, c'est déjà ce que fait le brief qui la contient. Le lieu
  retenu est le dossier `.vectorz/` du projet, car les leçons sont propres au projet.
- **Les dettes vont dans une seule fiche par run.** Qualité et dev refusent une fiche par dette :
  douze fiches noieraient le backlog.
- **Relier chaque donnée d'écran à sa source reste un signal, pas un blocage.** Architecture et revue
  le demandent, pour ne pas bloquer une fiche sur une seule preuve.
- **Le découpage des gros fichiers est écarté par quatre lentilles.** Les conflits se réglaient en
  gardant les deux côtés. Aucun test n'a cassé, et leur coût n'est pas mesuré. Le dev propose de le
  rouvrir après trois conflits difficiles. L'architecture le maintient seule.
- **La coupure du JSON à 64 Ko ne demande pas une règle de plus.** La règle existe depuis le
  1er novembre, et le défaut est revenu quand même. Qualité et dev proposent un test commun à toutes
  les commandes. Produit et revue avaient d'abord proposé une règle. Ils ont été ralliés par
  l'existence de celle du 1er novembre.

Les trous du tour 1 ont trouvé un porteur :

- Le portier qui redemande : dev et produit proposent qu'il retienne le passage outre pour le run.
- Les comptes rendus qui comptent « 0 PR » : le produit propose de compter les intégrations locales.
- La simulation d'intégration qui ment : trois lentilles proposent une exploration.
- Le port déjà pris : personne ne propose rien. Un seul cas, et la réaction du pilote était la bonne.

L'ordre proposé, partagé par quatre lentilles sur cinq :

1. le filet sur la section « Critères d'acceptation » ;
2. la fiche gate et contrats ;
3. les leçons durables.

Le produit place la commande de finalisation et la fiche de dettes avant la fiche gate et contrats.

## 4 · Le juge de cohérence

Sans objet. Aucune règle neuve n'est proposée : les douze propositions sont des fonctionnalités ou
une exploration. Le juge vérifie qu'une règle ne contredit pas une autre. Il n'avait donc rien à
juger. La règle existante sur les sorties JSON lues par un tuyau reste inchangée.

## 5 · Ce qui est proposé au PO

Chaque proposition part au backlog en fiche « idée » si tu la retiens.

1. **Le filet sur la section « Critères d'acceptation ».** Fait vécu : sept fiches abîmées sans
   alerte. Mesure : la vérification des fiches échoue sur une fiche livrée sans cette section. Zéro
   fiche livrée sans elle au prochain run.
2. **Une commande pour finaliser une fiche.** Fait vécu : un script maison a abîmé sept fiches. Quatre
   fiches ont perdu leur référence de livraison. Mesure : au prochain run, zéro script maison de
   finalisation, et quatorze références complètes sur quatorze.
3. **La gate rejoue les lecteurs d'un contrat, ils lisent par clé, et elle dit ce qu'elle ne couvre
   pas.** Fait vécu : cinq tests de mission control cassés, vus un sprint plus tard. Mesure : sur les
   cinq prochains changements de contrat, zéro test d'un lecteur cassé découvert après l'intégration.
   Chaque sortie de gate porte une ligne « non contrôlé ».
4. **Les leçons de revue gardées dans le projet et données au développeur.** Fait vécu : les mêmes
   défauts refusés story après story, et une liste qui disparaît avec la session. Mesure : le fichier
   survit au run. Sur deux runs, les refus pour un défaut déjà listé baissent d'au moins moitié.
5. **Une fiche de dettes par run.** Fait vécu : douze dettes nommées, trois fiches. Mesure : chaque
   dette nommée à l'acceptation figure dans une fiche du dépôt.
6. **Chaque donnée d'écran reliée à sa source au grooming.** Fait vécu : six éléments retirés en plein
   développement. Mesure : au prochain run d'écrans, zéro retrait d'élément faute de donnée.
7. **Un test commun pour les sorties JSON de plus de 64 Ko.** Fait vécu : deuxième coupure malgré la
   règle. Mesure : zéro sortie tronquée sur les cinq prochaines commandes `--json`.
8. **Le portier retient un passage outre pour le run.** Fait vécu : sept fois la même demande. Mesure :
   au prochain run à plusieurs sessions, un seul passage outre par session voisine.
9. **Le compte rendu compte les intégrations locales.** Fait vécu : « 0 PR mergée » pour quatorze
   intégrations. Mesure : le compte rendu affiche le vrai nombre.
10. **Exploration : la simulation d'intégration dit vrai.** Fait vécu : trois notes du carnet, la
    dernière du 15 novembre. Mesure : un test compare simulation et vraie fusion sur trois cas.
11. **Distinguer lot livré et version complète.** Fait vécu : une note du carnet, un tag bloqué par
    des fiches réservées au PO. Mesure : un run autonome scelle son lot sans buter sur une fiche PO.
12. **Découper les gros fichiers de l'écran.** Fait vécu : un conflit simple à chaque sprint. L'équipe
    recommande de l'écarter tant qu'aucun conflit n'a coûté plus qu'un « garder les deux ».

**Le carnet hors git.** Huit notes restent vivantes et sont portées par une proposition. Dix sont
écartées. Les 18 notes sont versées dans `docs/retro-notes/traitees/` pour ne plus remonter.

| Note | Sort proposé |
|---|---|
| La simulation d'intégration committe le squash | vivante, portée par l'exploration (10) |
| La livraison ne s'écrit que depuis le dossier cible | vivante, portée par la commande de finalisation (2) |
| Le rayon d'impact doit inclure les tests TypeScript | vivante, portée par la fiche gate et contrats (3) |
| La chasse aux bugs de version gagne sa place | à écarter : la note demande de la garder, elle est gardée |
| Un dossier de travail neuf ne teste pas mission control sans installation | à écarter : aucun cas depuis le 14 octobre |
| La simulation du guichet ezk masque celle du script | vivante, portée par l'exploration (10) |
| Un tag autonome bloqué par des fiches réservées au PO | vivante, portée par la proposition 11 |
| Une fiche prête peut citer ce qui n'existe pas | vivante, portée par la proposition 6 |
| Un statut calculé laisse des écrans à zéro | à écarter : couverte par la règle « pas de faux zéro » et la décision en attente du 24 novembre |
| Un contrôle « version prête à lancer » | à écarter : livré, par la commande `ezk backlog version ready` |
| Le versionnement se propose depuis le pilote | à écarter : couverte par la règle qui fait nommer les commits d'autrui avant un push |
| Toute sortie de rétro passe par une fiche ? | vivante, portée en partie par la fiche de dettes (5) |
| Le mode auto en deux phases | à écarter : livré, c'est la phase de grooming du mode auto |
| Audit du découpage des commandes | à écarter : trop large, et déjà repris par l'écran Process et la carte de la méthode |
| Livrer une fiche casse un lien d'une autre session | à écarter : aucun cas depuis le 17 octobre |
| L'isolation de l'éclaireur ne protège pas les dépendances | à écarter : corrigé à la source le 2 novembre |
| La simulation dit « propre » depuis un dossier de travail | vivante, portée par l'exploration (10) |
| Vérifier la branche avant de retirer un chemin concurrent | à écarter : couverte par la consigne de vérifier la branche au réveil |

## 6 · Suivi des décisions de la rétro précédente

La rétro du 24 novembre a laissé cinq propositions en attente. Ce run les éclaire ainsi :

- **Le compte rendu écrit « jetons non mesurés » au lieu de « 0 ».** Toujours en attente, et le
  problème grandit : 49 comptes rendus sur 94 portent ce zéro. Produit et qualité demandent de la
  traiter en priorité.
- **Un test par relais du daemon fait passer tout l'exemple du contrat.** Renforcée par le
  deuxième fait : ce run a encore étendu deux relais à la main. La proposition 3 la complète.
- **Chaque vue de mission control a une adresse.** Pas de nouveau cas dans ce run.
- **La commande ezk du daemon se règle par la config.** Renforcée par le troisième fait : la cloche
  n'a pu être vérifiée qu'après intégration.
- **Rejouer « Comment vérifier » avant la revue.** La revue propose de l'étendre aux tests des
  lecteurs du contrat, ce que fait la proposition 3.

Aucune n'est à retirer. Il est trop tôt pour en mesurer l'effet, puisqu'aucune n'est encore construite.

## 7 · Décisions du PO

| Proposition | Décision | Date |
|---|---|---|
| 1. Filet sur la section « Critères d'acceptation » | ✅ retenue : [fiche idée](../../features/20261128120000201_backlog-check-exige-criteres-sur-fiche-livree.md) (20261128120000201) | 2026-11-28 |
| 2. Commande pour finaliser une fiche | ✅ retenue : [fiche idée](../../features/20261128120000202_commande-finaliser-une-fiche.md) (20261128120000202) | 2026-11-28 |
| 3. Gate et contrats, en trois tranches | ✅ retenue : [fiche idée](../../features/20261128120000203_gate-rejoue-lecteurs-du-contrat.md) (20261128120000203) | 2026-11-28 |
| 4. Leçons de revue gardées dans le projet | ✅ retenue : [fiche idée](../../features/20261128120000204_lecons-de-revue-gardees-dans-le-projet.md) (20261128120000204) | 2026-11-28 |
| 5. Une fiche de dettes par run | ✅ retenue : [fiche idée](../../features/20261128120000205_une-fiche-de-dettes-par-run.md) (20261128120000205) | 2026-11-28 |
| 6. Donnée d'écran reliée à sa source | ✅ retenue : [fiche idée](../../features/20261128120000206_donnee-ecran-reliee-a-sa-source.md) (20261128120000206) | 2026-11-28 |
| 7. Test commun des sorties JSON | ✅ retenue : [fiche idée](../../features/20261128120000207_test-commun-sorties-json-longues.md) (20261128120000207) | 2026-11-28 |
| 8. Le portier retient un passage outre | ✅ retenue : [fiche idée](../../features/20261128120000208_portier-retient-un-passage-outre.md) (20261128120000208) | 2026-11-28 |
| 9. Le compte rendu compte les intégrations locales | ✅ retenue : [fiche idée](../../features/20261128120000209_compte-rendu-compte-integrations-locales.md) (20261128120000209) | 2026-11-28 |
| 10. Exploration : la simulation d'intégration dit vrai | ✅ retenue : [fiche idée](../../features/20261128120000210_exploration-simulation-integration-dit-vrai.md) (20261128120000210) | 2026-11-28 |
| 11. Lot livré et version complète | ✅ retenue : [fiche idée](../../features/20261128120000211_lot-livre-et-version-complete.md) (20261128120000211) | 2026-11-28 |
| 12. Découper les gros fichiers de l'écran | ❌ écartée : conflits simples, à rouvrir après trois conflits difficiles | 2026-11-28 |

## 8 · Glossaire

- **Gate** : la série de contrôles automatiques lancés avant d'intégrer une story (tests, types, lint).
- **Contrat** : le format JSON qu'une commande de la méthode publie et que mission control lit.
- **Lecteur d'un contrat** : un programme qui lit ce JSON, ici le daemon de mission control.
- **Portier** : le contrôle lancé à l'ouverture d'un sprint ; il alerte sur les dossiers et fiches en cours.
- **Passage outre** : l'accord du PO pour ouvrir un sprint malgré une alerte du portier.
- **Product owner virtuel** : l'agent `ezk-pm`, qui accepte les fiches pendant un run autonome.
- **Carnet hors git** : les notes de friction déposées par `ezk retro note`, gardées dans le dossier git partagé.
- **Lentille** : le point de vue d'un agent de la rétro (architecture, qualité, revue, dev, produit).
