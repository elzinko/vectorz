# Les fenêtres de mise à jour

*On sait déployer sans couper le trafic. On ne sait pas encore mettre à jour une méthode sans
couper le travail — et c'est le travailleur qui sait quand c'est possible, pas l'opérateur.*

---

## Une clause dont j'étais content

Il y a peu, j'ai écrit un contrat. Pas un contrat de travail — un contrat technique : le
[contrat de supervisabilité](./contrat-de-supervisabilite.md), le minimum qu'une méthode de
travail pour agents IA doit exposer pour être supervisable par un programme qui n'y comprend
rien. Le décor, d'abord. Un superviseur fait avancer une équipe d'agents sur un projet, toute
la nuit ; la *façon* de travailler — étapes, revues, règles — vit dans une **méthode**
versionnée, que le superviseur ne comprend pas. C'est voulu — un superviseur qui comprend la
méthode finit toujours par la recoder chez lui — et ça tient grâce à un contrat de cinq
clauses. Les miens s'appellent cop1, le superviseur, et mega-city, la méthode : deux projets
en construction. Le problème, lui, n'attend pas qu'ils soient finis.

Une seule clause nous occupe ici, la cinquième : **les mises à jour attendent la fin
d'étape.** Un **run** — une exécution de bout en bout, du coup d'envoi au rapport final —
démarre sous une version de la méthode et garde cette version jusqu'à un **jalon** : une fin
d'étape, ce que le contrat appelle un *gate*. C'est uniquement là que le superviseur peut
proposer : « continue, et au passage, passe en 1.4 ». Jamais en vol, jamais implicite.
J'étais content de cette clause. Elle avait la simplicité des bonnes règles.

Puis l'objection est arrivée, en une phrase : **un jalon n'est pas forcément un point
stable.** Imaginez la fin d'une étape : le rapport est produit, le jalon est atteint — et il
reste deux *worktrees* ouverts (des copies de travail du dépôt, chacune sur son chantier), une
branche à moitié fusionnée, une migration de données entamée. Si le superviseur profite de ce
jalon pour changer la version de la méthode, il change les règles d'un travail qui, en
réalité, est encore en l'air.

Le pire, c'est que le superviseur ne peut pas le savoir. Il est aveugle au métier *par
construction* — c'est toute l'idée du contrat. « Jalon atteint », il le voit passer. « État
migrable », il ne le verra jamais. Le seul qui le sait, c'est celui qui a les mains dedans :
la méthode. C'est la méthode qui sait quand le code est stable.

Ma clause disait *quand* adopter une version. Elle ne disait pas *qui sait* si on peut.

## La relève de 19 h

Avant de replonger dans la technique, une image. Dans un service hospitalier, l'heure de la
relève est fixée — disons 19 h. Mais si à 19 h une pose de perfusion est en cours, l'équipe
sortante ne lâche pas l'aiguille pour partir. La relève attend un état *transmissible* : le
geste terminé, le dossier à jour, les consignes dites. Le planning dit **quand** on peut se
relayer ; l'état du service dit **si** on peut. Et remarquez qui tranche : pas le planning,
pas le cadre de garde — l'équipe qui tient l'aiguille.

Tout le problème des mises à jour de systèmes qui travaillent tient dans cette distinction.
Un moment où le travail *s'interrompt* n'est pas la même chose qu'un moment où l'état est
*transmissible*. Un jalon de projet est le premier ; une **fenêtre de mise à jour** est le
second. Les confondre, c'est croire que 19 h suffit.

L'industrie a pourtant un mot installé de longue date — la **fenêtre de maintenance** : un
créneau choisi par l'opérateur, dans le calendrier, « la nuit de samedi à dimanche ».
Remarquez la direction : c'est l'opérateur qui choisit, et il choisit une *heure*. Une fenêtre
de mise à jour est l'inverse terme à terme : déclarée par le travailleur, et déclarée depuis
l'*état*. Tout cet article tient dans cette différence.

L'informatique d'infrastructure bute sur ce problème depuis des décennies, des bases de
données aux orchestrateurs. Je suis allé lire de première main comment chacun de ces systèmes
s'en sort ([notes de lecture](../captures/2026-07-13-notes-lecture-fenetres-mise-a-jour.md),
citations vérifiées une à une). J'y ai trouvé partout la même forme de réponse — pas celle
que j'attendais.

## Ce qu'on sait faire : basculer le trafic

Commençons par ce qui marche si bien qu'on n'y pense plus. Le **blue-green deployment**,
décrit en 2010 par Martin Fowler, l'auteur de référence sur l'architecture logicielle : deux
environnements de production aussi identiques que possible, un seul reçoit le trafic ; on
déploie la nouvelle version sur l'autre, on la teste, puis « you switch the router so that
all incoming requests go to the green environment » — on bascule le routeur. La **canary
release**, décrite en 2014 par Danilo Sato, dont l'essai est hébergé sur le site de Fowler,
fractionne le même geste : on livre la nouvelle version à un petit sous-ensemble
d'utilisateurs, on observe les métriques, on élargit à mesure que la confiance monte.

Regardez bien sur quoi porte la bascule : les requêtes *entrantes*. Le futur. Et le travail
en cours au moment de la bascule ? Fowler n'y consacre que quelques mots — des « missed
transactions » à rattraper, ou un mode lecture seule le temps de basculer. C'est tout, et
c'est rationnel : ces patterns reposent sur une hypothèse si naturelle qu'on ne la voit plus.
**L'unité de travail est courte.** Une requête HTTP dure 200 millisecondes ; ce qui était en
vol pendant la bascule se termine sur l'ancienne version ou se perd sans drame. Personne ne
migre une requête — on attend qu'elle meure.

On sait déployer sans couper le trafic. Mais un run d'agents n'est pas du trafic. C'est un
travail qui dure une nuit.

## L'éviction se négocie

Que se passe-t-il quand le travail ne meurt pas en 200 millisecondes ? Premier arrêt :
**Kubernetes**, l'orchestrateur qui répartit les applications, empaquetées en conteneurs, sur
des flottes de machines — une bonne partie du cloud tourne dessus. Pour mettre à jour une
machine du cluster — un *nœud* — l'opérateur la vide : c'est `kubectl drain`. Mais « vider »
ne veut pas dire « supprimer » : le drain *demande* l'éviction de chaque pod (chaque charge
de travail), et l'application a son mot à dire. Son propriétaire a déclaré un
**PodDisruptionBudget** — littéralement, un budget de perturbation : « au moins deux réplicas
de mon application debout, en permanence ». Une éviction qui violerait ce budget n'est pas
mise en file, pas forcée : elle est **refusée**, et l'outil réessaie, patiemment, jusqu'à ce
que l'application ait reconstitué ses réplicas ailleurs — ou jusqu'à un délai d'abandon
configurable. La documentation met même en scène « an impatient cluster administrator » dont
la commande reste bloquée, et résume l'esprit en une phrase : « Pod Disruption Budgets
support this separation of roles by providing an interface between the roles ».

La séparation des rôles, la voilà : l'opérateur décide *quoi* — vider ce nœud, mettre à jour
ce kernel. La charge, elle, a déclaré d'avance *à quel rythme* c'est supportable. L'upgrade
du cluster avance nœud par nœud, exactement à la vitesse que les applications tolèrent — et
c'est précisément ce qui permet de l'automatiser sans danger.

L'opérateur propose. La charge dispose.

## Le travail épinglé

Deuxième arrêt, plus près de nos agents : les moteurs d'exécution durable, conçus pour du
travail qui dure des jours. **Temporal**, le moteur qui fait tourner des *workflows* — des
programmes de longue haleine, capables de survivre aux pannes et aux redémarrages — pendant
des mois, sépare soigneusement deux décisions. L'opérateur choisit quelle version du parc de
*workers* (les processus qui exécutent les workflows) est la version courante. Mais le sort
du travail en vol, lui, est déclaré par chaque type de workflow, dans sa configuration, par
le SDK ou la CLI : *Pinned*, « guaranteed to complete on a single Worker Deployment
Version » — épinglé jusqu'au bout à la version sur laquelle il a démarré ; ou *Auto-Upgrade*,
au prix d'une compatibilité de rejeu maintenue à la main, patch par patch. L'ancienne
version, elle, « draine » : le système attend que ses derniers workflows épinglés se
terminent avant de l'éteindre.

Et pour adopter une version sans attendre la toute fin ? Temporal a une frontière pour ça :
Continue-as-New, le point où un workflow trop long repart de zéro — même identité de
workflow, mais une nouvelle exécution et un historique vierge. C'est exactement là, où plus
rien n'est en l'air, que l'adoption devient sûre par construction : depuis mars 2026, en
préversion publique, *Upgrade on Continue-as-New* fait de ces frontières des points
d'adoption de version, où le workflow peut opter pour la nouvelle version. La documentation
suggère d'ailleurs de faire Continue-as-New périodiquement, précisément pour ne pas vieillir
sur du code périmé.

**Restate**, un moteur d'exécution durable plus récent qui s'est penché sur le cas des agents
IA, pousse le même renversement un cran plus loin : « Every deployment is a complete,
versioned snapshot of the agent: code, prompts, tool definitions, schemas, guardrails, and
model configuration. » Les déploiements sont immuables ; toute invocation en vol reste
épinglée à sa version de départ — reprises et rappels compris.

Relisez la citation : la version d'un agent, ce n'est pas que du code. Ce sont aussi ses
prompts et ses définitions d'outils — le manuel avec lequel il interprète son propre
historique. Changer ce manuel sous les pieds d'un agent en plein travail ne le fait pas
planter : ça corrompt silencieusement ses décisions. C'est la meilleure description que j'aie
lue du risque que court une méthode d'agents, car une méthode, c'est exactement ça : des
prompts et des règles.

Partout où le travail est long, la même réponse : le travail en vol garde sa version — et
c'est lui qui a déclaré comment.

## « Prêt » et « maintenant » sont deux mots

Troisième arrêt, le plus ancien : les bases de données. Changer le schéma d'une table MySQL
de plusieurs centaines de gigaoctets, sous trafic, sans la verrouiller — c'est le métier de
**gh-ost**, l'outil de migration de schéma en ligne de GitHub. Sa technique : construire une
table fantôme en parallèle, y recopier les lignes par petits paquets, rejouer les écritures
au fil de l'eau… et à la fin, l'instant critique — le **cut-over**, la substitution des
tables. gh-ost le rend différable : un simple fichier drapeau
(`--postpone-cut-over-flag-file`) suspend la bascule « until such time that you're
comfortably available », dit le README.

Mais regardez la répartition exacte des pouvoirs, car elle est subtile. L'outil établit que
c'est **prêt** : copie terminée, retard de réplication sous le seuil, et une table sentinelle
qui bloque physiquement le renommage « until gh-ost is satisfied all is in order ». L'humain
choisit le **moment** : il retire le drapeau, ou tape `unpostpone`. Deux signatures pour une
bascule : celle de qui connaît l'état — prêt ou pas — et celle de qui connaît le contexte —
maintenant ou pas. L'humain ne peut pas rendre la migration prête ; l'outil ne sait pas si
c'est le bon soir.

Aucune des deux signatures ne remplace l'autre.

## Le contre-exemple qui confirme

Reste le cas d'école qu'on m'opposera : **Erlang/OTP**, le langage conçu pour les
commutateurs téléphoniques, célèbre pour changer le code d'un système *sans l'éteindre*. La
migration à chaud comme choix de conception, depuis trente ans. Si quelqu'un sait mettre à
jour un travailleur en plein travail, c'est lui.

Et de fait, la machinerie est splendide : deux versions d'un module coexistent en mémoire
(*current* et *old*), les processus en cours « traînent » dans l'ancienne sans être cassés.
Mais suivez ce qui se passe quand l'état interne d'un processus doit changer de forme. Le
gestionnaire de release d'OTP — un composant du système, pas un humain — suspend le
processus, puis la documentation est limpide : « The process must explicitly transform its
state using the callback function `code_change/3` ». Le processus convertit *lui-même* son
propre état, avec du code de conversion écrit à l'avance, dans les deux sens — montée et
descente de version. Pas de fonction de conversion ? L'appel plante. La conversion échoue ?
Tout l'upgrade est annulé, retour à l'ancienne version. Et le système ne garde que deux
générations de code : à la troisième version chargée, le processus encore attardé dans la
première est tué.

Autrement dit : même le champion du monde de la migration à chaud ne sait pas migrer un
travailleur de l'extérieur. Il l'*oblige* à savoir se migrer lui-même — et le prix de cette
obligation (les fonctions de conversion, les fichiers d'upgrade, la discipline) est celui que
peu d'équipes acceptent de payer. La migration à chaud n'est pas une échappatoire à la règle.
C'en est la démonstration par le prix.

## La clause corrigée

Résumons la tournée. Quand le travail est court, l'opérateur bascule le trafic et ne demande
la permission à personne. Dès que le travail est long et porte un état, le savoir « peut-on
basculer ? » déménage — toujours dans le même sens : vers le travailleur. Le workflow
Temporal déclare son épinglage, la charge Kubernetes déclare son budget, gh-ost déclare
« prêt », le processus Erlang convertit son propre état. L'opérateur ne garde qu'un pouvoir :
choisir le moment *parmi les moments déclarés possibles*.

Chez nous, la correction de la clause 5 tient en un champ. Sur la ligne de vie d'un run, tous
les jalons ne se valent plus :

```
run ── étape ──◆── étape ──◆── étape ──◆──▶
            jalon 1      jalon 2      jalon 3
upgrade_ok:   non          oui          non
           (worktrees   (rien en     (migration de
            ouverts)     l'air)       données en cours)
```

Le rapport que la méthode produit à chaque jalon porte ce champ de plus, déclaré par elle
seule :

```
ÉVÉNEMENT méthode → superviseur
  gate.reached {gate_id, report, upgrade_ok}   # upgrade_ok : la méthode déclare
                                               # si ce jalon est une fenêtre
                                               # de mise à jour

COMMANDE superviseur → méthode
  continue {gate_id, adopt_version?}           # adopt_version n'est permis que
                                               # si le jalon est éligible

INVARIANT : un continue {adopt_version} sur un jalon sans upgrade_ok
= violation du contrat — détectable dans le flux, auditable après coup.
```

`upgrade_ok` est le PodDisruptionBudget de la méthode, son équivalent du « prêt » de gh-ost :
worktrees refermés, branches fusionnées, rien en l'air — elle seule le sait, elle seule le
déclare. Le parallèle a une limite, assumée : un budget de perturbation est une politique
permanente que le système peut vérifier ; `upgrade_ok` est déclaré jalon par jalon, et reste
opaque. C'est voulu : le superviseur n'apprend pas *pourquoi* le jalon est éligible ou non,
il apprend juste si c'en est un. (Un booléen suffit pour commencer ; une fenêtre avec durée
reste possible.) Pas de course entre la déclaration et l'adoption, non plus : au jalon, la
méthode est déjà à l'arrêt — c'est une autre clause du contrat, le stop par défaut — et ne
repart que sur `continue`. Et les règles existantes ne bougent pas : jamais de migration à
chaud, et toute adoption reste affichée à l'utilisateur — « ce run passe de mega-city 1.3 à
1.4 », en toutes lettres, au moment où ça se produit.

Quatre objections.

- **Une méthode peut se tromper, ou mentir.** Oui — l'éligibilité déclarée n'est pas une
  garantie, c'est une responsabilité, comme un budget de perturbation mal réglé. Mais la
  déclaration est dans le flux d'événements : quand une adoption tourne mal, on sait qui a
  dit « allez-y », et sur la foi de quoi.
- **Une méthode peut ne jamais déclarer de fenêtre.** C'est le drain Kubernetes qui « never
  completes » : pas un bug du contrat, un signal — visible, mesurable — que la méthode doit
  apprendre à fabriquer des points stables, comme les workflows Temporal font Continue-as-New
  périodiquement.
- **Il faudra bien forcer, parfois.** Sans doute — Kubernetes a son `--disable-eviction`,
  « use with caution ». Le correctif urgent est le cas canonique : quand la version courante
  corrompt le travail, attendre la fenêtre prolonge le dégât. Mais forcer doit rester un acte
  explicite, bruyant et journalisé. Jamais le chemin par défaut.
- **La plus dure : une fenêtre n'est pas une compatibilité.** `upgrade_ok` garantit « rien en
  l'air » ; il ne garantit pas que les artefacts au repos — le backlog, les conventions, la
  structure du dépôt — soient lisibles par la version suivante. Et il ne peut pas le
  garantir : c'est la 1.3 qui déclare la fenêtre, et la 1.3 ne sait rien de ce que la 1.4
  attendra. Erlang a tranché ce point il y a longtemps : le code de conversion est livré par
  la version qui arrive. La leçon vaut ici — à la version qui arrive de porter sa migration,
  et son retour arrière ; le contrat n'a pas à la comprendre, seulement à exiger qu'elle
  existe. Cette clause-là reste à écrire.

## Faites l'exercice

La prochaine fois que vous mettrez à jour quelque chose qui travaille longtemps — un
pipeline, un workflow, une méthode d'agents — posez une seule question : **qui a déclaré que
c'était possible ?** Si la réponse est « personne — on a juste choisi un moment calme », vous
avez confondu l'heure de la relève et l'état du service.

L'équipe de nuit, elle, attendra que la perfusion soit posée.

## Pour creuser

- **[Les notes de lecture](../captures/2026-07-13-notes-lecture-fenetres-mise-a-jour.md)** —
  la vérification de première main, source par source, citation par citation.
- **[Le contrat de supervisabilité](./contrat-de-supervisabilite.md)** — l'article dont
  celui-ci corrige la clause 5 (et sa [version détaillée](./contrat-de-supervisabilite-v1.md)).
- Les sources primaires : Temporal, *Worker Versioning* et *Continue-as-New*
  (<https://docs.temporal.io/worker-versioning>,
  <https://docs.temporal.io/workflow-execution/continue-as-new>) et l'annonce de mars 2026 —
  Worker Versioning en disponibilité générale, Upgrade on Continue-as-New en préversion
  publique
  (<https://temporal.io/blog/ga-worker-versioning-public-preview-upgrade-on-continue-as-new>) ·
  Restate, *Updating AI Agents safely in production*, mars 2026
  (<https://www.restate.dev/blog/dealing-with-versioning-in-long-running-agents>) et la doc
  *Versioning* (<https://docs.restate.dev/services/versioning>) · Kubernetes, *Disruptions* et
  *Safely Drain a Node*
  (<https://kubernetes.io/docs/concepts/workloads/pods/disruptions/>,
  <https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/>) · gh-ost, README
  et docs cut-over (<https://github.com/github/gh-ost>) · pt-online-schema-change,
  l'équivalent chez Percona
  (<https://docs.percona.com/percona-toolkit/pt-online-schema-change.html>) · Erlang/OTP,
  *Code Replacement*, *Release Handling*, *Appup Cookbook*
  (<https://www.erlang.org/doc/system/code_loading.html>,
  <https://www.erlang.org/doc/system/release_handling.html>,
  <https://www.erlang.org/doc/system/appup_cookbook.html>) · Martin Fowler,
  *BlueGreenDeployment*, 2010 (<https://martinfowler.com/bliki/BlueGreenDeployment.html>) ·
  Danilo Sato, *CanaryRelease*, 2014 (<https://martinfowler.com/bliki/CanaryRelease.html>).

*Publication externe volontairement différée : comme le contrat qu'il complète, cet article
devra d'abord avoir été éprouvé par au moins un run réel.*
