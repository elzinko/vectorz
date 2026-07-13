# Le contrat de supervisabilité (v1 — version détaillée)

*Les control planes gardent les actions ; personne ne garde les méthodes.*

> ⚠️ Version archivée : la version courante, réécrite pour être lisible sans rien connaître du
> sujet, est [contrat-de-supervisabilite.md](./contrat-de-supervisabilite.md). Celle-ci reste
> la référence détaillée (positionnement complet source par source, lignée intellectuelle,
> glossaire).

> Statut : article de fond, publié dans la doc du projet cop1 (2026-07-13). Issu des captures
> de session du 2026-07-13 ([décisions](../captures/2026-07-13-contrat-methode-et-versions.md),
> [prior art](../captures/2026-07-13-prior-art-contrat-supervisabilite.md),
> [notes de lecture](../captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md)).

---

## 1. Une nuit de juin

Il est deux heures du matin. Sur une machine quelque part, un superviseur logiciel — appelons-le
cop1, c'est son nom — fait tourner une équipe d'agents IA sur le backlog d'un projet. Une story
est en cours : des tests s'écrivent, du code passe au vert, un budget de tokens s'égrène. Le
superviseur ne comprend rien au métier de ce qui se développe. C'est voulu : son travail, c'est
le budget, les arrêts d'urgence, la concurrence entre runs, la frontière d'autonomie. Le
*comment on travaille* — les phases, les revues, les critères d'acceptation — vit ailleurs, dans
une **méthode** : un ensemble versionné de règles, de rôles et de rituels, qui s'appelle ici
mega-city.

Au matin, l'humain se lève, relit ce que la nuit a produit, et améliore la méthode. Un gate de
revue en plus. Un rapport de fin d'étape qui change de forme. Il committe, il tague une version.

Et là, une question toute bête : **le run de cette nuit, il tourne sous quelle méthode ?** Celle
d'hier soir, ou celle de ce matin ? Si la réponse est « ça dépend du moment où tel fichier a été
relu », ce n'est pas une réponse — c'est un bug qui n'a pas encore eu lieu.

La question s'est posée pour de vrai, et elle en a entraîné d'autres. Que fait-on d'un process
en cours quand la méthode change ? Peut-on mettre à jour le superviseur pendant qu'il supervise ?
Que se passe-t-il quand deux sessions de travail — une la nuit, pilotée par le superviseur, une
le jour, pilotée par l'humain — se marchent dessus dans le même dépôt ? Et surtout : quand la
méthode veut s'arrêter pour demander de l'aide, à qui parle-t-elle, et dans quelle langue ?

On a d'abord cru à une série de problèmes d'ingénierie indépendants. C'en est un seul : **il
n'existe pas de contrat entre un superviseur et une méthode.** Chacun des deux mondes est bien
outillé de son côté ; la frontière entre les deux est un no man's land. Cet article propose de
la nommer, de la spécifier, et de montrer pourquoi personne — standards, frameworks, papiers,
produits — ne l'a encore fait.

## 2. Le superviseur aveugle, ou l'art du contrôle aérien

Pour comprendre le problème, une analogie qui va nous servir tout du long : **le contrôle
aérien**.

Une tour de contrôle ne sait pas piloter un avion. Elle ne connaît ni la checklist d'un A320 ni
la charge d'un cargo. Et pourtant elle *contrôle* : parce que tout appareil, quel qu'il soit,
respecte un contrat minuscule et non négociable. Il se signale à des points définis. Il **ne
franchit pas** une piste sans clairance explicite — le silence de la tour veut dire « attends »,
jamais « vas-y ». Il parle une phraséologie normalisée, dans laquelle « mayday » (détresse) et
« pan-pan » (urgence) ne sont pas le même mot. C'est ce contrat, pas une quelconque
compréhension du pilotage, qui rend le contrôle possible.

Un superviseur d'agents IA est dans la situation de la tour. Il fait tourner des méthodes qu'il
ne comprend pas — scrum aujourd'hui, autre chose demain — et c'est une *qualité* : un
superviseur qui comprend la méthode finit par la recoder chez lui, et on obtient un monolithe de
plus. Pour rester aveugle au métier *et* garder le contrôle, il lui faut l'équivalent de la
phraséologie et de la clairance : un contrat que **toute** méthode doit exposer pour être
supervisable.

C'est ce contrat qu'on propose d'appeler **contrat de supervisabilité** (*Supervisability
Contract*).

## 3. Ce qui existe déjà — et le trou au milieu

L'intuition dit qu'un tel contrat doit bien exister quelque part. L'écosystème 2025-2026
déborde de « control planes » pour agents, de protocoles d'interopérabilité, de frameworks
d'orchestration. Un balayage systématique (dix angles, des standards aux produits en passant
par vingt ans de littérature académique — le détail est dans le
[prior art](../captures/2026-07-13-prior-art-contrat-supervisabilite.md)) donne une réponse
plus intéressante : **chaque pièce existe isolément, souvent depuis longtemps ; la composition
n'existe nulle part.** Et surtout, tout le monde garde le même niveau de la pile.

Les garde-fous existants opèrent au **grain de l'action** : autoriser ou refuser un appel
d'outil, une commande shell, une requête réseau. C'est le modèle de Faramesh, d'OpenHands
(mode confirmation), des politiques d'autorisation de Claude Code, des garde-fous de Devin.
C'est utile, et c'est insuffisant : au grain de l'action, on peut empêcher un agent de faire
`rm -rf`, pas de *continuer sereinement un sprint dont la définition a changé sous ses pieds*.
Les décisions qui comptent pour un superviseur — continuer ou s'arrêter, escalader ou absorber,
adopter une nouvelle version ou finir sous l'ancienne — se prennent au **grain de la méthode** :
aux frontières d'étapes, aux gates. Et à ce grain-là, personne ne contractualise.

D'où la phrase qui résume le créneau : *les control planes gardent les actions ; personne ne
garde les méthodes.*

## 4. Le contrat — cinq clauses

Le contrat de supervisabilité tient en cinq clauses. Aucune n'est exotique prise isolément ;
c'est leur composition qui n'existe nulle part — et, au passage, trois inventions à repérer :
le stop par défaut comme invariant *vérifiable* (clause b), l'escalade à deux étages (clause
d), l'adoption de version confinée aux gates (clause e).

### (a) La méthode déclare ses étapes

Avant le run, la méthode publie un **manifeste** : la liste de ses gates (fins d'étapes,
points de revue), leur topologie minimale, et le schéma du **rapport structuré** qu'elle
s'engage à produire à chacun. Le superviseur n'impose pas de phases ; il apprend celles de la
méthode. C'est l'inverse exact des control planes existants qui, quand ils connaissent des
phases, les imposent — on les retrouvera au §7. Ici, **la méthode est le savant, le
superviseur est la tour**.

### (b) Stop par défaut au gate — la clause centrale

À chaque gate, la méthode **s'arrête**. Elle ne repart que sur un ordre explicite du
superviseur : `continue`. L'absence de réponse signifie « attends », jamais « vas-y ».

Pourquoi cette polarité et pas l'inverse ? Faites l'exercice de panne : si le défaut est
« continue » et que le canal de supervision tombe, on obtient une boucle autonome silencieuse —
un run qui avance sans que plus personne ne le regarde, en dépensant des tokens. Si le défaut
est « stop » et que le canal tombe, on obtient un run bloqué, visible, rattrapable. Entre une
défaillance silencieuse et une défaillance bruyante, un système de contrôle choisit toujours la
seconde. C'est le principe *fail-safe* des freins de train (le frein serre quand la pression
tombe) et la clairance du contrôle aérien, appliqués au workflow.

La mécanique stop/continue existe partout — mais **toujours en opt-in, ou à l'initiative de
l'agent** (le tour des voisins, au §7, le documente cas par cas). La clause (b) en fait une
**exigence de conformité vérifiable** : dans le flux d'événements, toute activité après un
`gate.reached` sans `continue` correspondant est une violation détectable — auditable après
coup, alertable en direct. Du *default-deny*, doctrine standard en sécurité, jamais appliqué au
contrat de workflow.

### (c) Un schéma d'événements versionné

Tout ce qui traverse la frontière — rapports de gate, escalades, télémétrie, commandes — est un
événement typé, dans un schéma **versionné** : un changement cassant produit une nouvelle
version identifiable, un consommateur sait toujours quelle version il lit. C'est la clause la
moins originale du contrat, et c'est tant mieux : le versionnage propre (A2A), les enveloppes
d'événements (CloudEvents), le vocabulaire de télémétrie GenAI (OpenTelemetry) sont des
solutions sur étagère. De l'hygiène à réutiliser, pas à réinventer.

### (d) L'escalade à deux étages : métier et régalien

Quand quelque chose coince dans un run, deux familles de problèmes très différentes se
présentent, et les mélanger est une erreur de conception.

L'**escalade métier** — un désaccord entre agents, une revue qui rejette, un arbitrage de
priorité — se traite **dans la méthode**, par ses propres rôles : c'est le travail d'un scrum
master, d'un manager, d'un product owner. Le superviseur n'en voit rien, et n'a rien à en voir.

L'**escalade régalienne** — le budget est épuisé, le run est bloqué, une décision requiert une
autorité que la méthode n'a pas — traverse la frontière et remonte au superviseur, sous forme
d'événement typé : `budget`, `blocked`, `authority`. Le superviseur apprend que la méthode a
besoin d'un humain ; il n'apprend jamais *pourquoi* au sens métier.

C'est « mayday » contre « pan-pan » : deux mots différents parce que deux régimes de réponse
différents. Le seul précédent formel de cette dualité est vieux de vingt ans — la distinction
*error*/*incident* de BPMN (§7). Aucun standard d'agents ne l'a reprise ; aucun ne définit
d'événement `budget.*`.

### (e) L'adoption de version aux gates — la réponse à la nuit de juin

Retour à la question d'ouverture. La méthode est **épinglée** (*pinned*) : un run démarre sous
une version de méthode et la garde — prompts, skills, règles compris, pas seulement le code —
jusqu'à une frontière de gate. C'est **uniquement** là, au moment du `continue`, que le
superviseur peut proposer une adoption : `continue {adopt_version: v1.4}`. Et l'adoption est
**affichée** à l'utilisateur : « ce run passe de mega-city v1.3 → v1.4 ».

Jamais de migration à chaud, jamais d'adoption implicite, jamais en vol. La même discipline
vaut pour le superviseur lui-même — deuxième question du récit : le mettre à jour pendant
qu'il supervise est un choix explicite de l'utilisateur, assorti d'un redémarrage, jamais un
événement qui *arrive* à un run. Le monde de l'exécution durable a résolu ce problème à
grande échelle pour du *code de workflow* (§7) ; personne ne l'avait transposé en **clause de
contrat** envers une méthode opaque.

## 5. Le squelette v0

Concrètement, le contrat tient sur un écran. La version v0 — un squelette à raffiner, pas une
spec gelée :

```
MANIFESTE (déclaré par la méthode avant le run)
  contract: "supervisability/v1"        # URI versionnée, breaking change ⇒ nouvelle URI
  method: {name, version}               # version PINNÉE pour tout le run (code + prompts
                                        #   + skills + règles, à la Temporal/Restate)
  gates: [{id, after?, report_schema}]  # topologie minimale + schéma du rapport de chaque gate

ÉTATS DU RUN (machine à états possédée par le SUPERVISEUR, pas par la méthode)
  created → running → at_gate(gate_id) → running → … → completed | failed | killed

ÉVÉNEMENTS méthode → superviseur (enveloppe CloudEvents, ordonnés, append-only)
  gate.reached {gate_id, report}        # OBLIGATOIRE ; la méthode S'ARRÊTE ici (fail-safe)
  escalation  {type: budget|blocked|authority, detail}   # seul le régalien traverse ;
                                        #   l'escalade métier reste interne (rôle manager)
  usage       {tokens_in/out}           # heartbeat périodique (vocabulaire OTel gen_ai.*)
  run.finished {status, final_report}

COMMANDES superviseur → méthode (l'UNIQUE canal de progression)
  continue {gate_id, adopt_version?}    # absence de continue = la méthode reste arrêtée ;
                                        #   adopt_version : upgrade UNIQUEMENT ici
  abort    {reason}                     # kill-switch (budget, autorité)

INVARIANT VÉRIFIABLE : dans l'event-stream, toute activité après un gate.reached
sans continue correspondant = violation du contrat (détectable, auditable).
```

Trois choix de conception méritent d'être soulignés.

**Le canal est un flux d'événements, pas une API.** Un journal append-only d'événements typés
que la méthode émet et que le superviseur consomme (et un canal de commandes en face). C'est le
choix le moins couplant : n'importe quelle méthode qui parle ce flux est supervisable,
n'importe quel superviseur qui le lit peut superviser, et l'interface utilisateur ne fait que
le rendre. Le précédent le plus proche est l'event stream d'OpenHands.

**La machine à états appartient au superviseur.** La méthode déclare ses gates et émet ses
événements ; c'est le superviseur qui tient l'état du run (`at_gate`, `killed`…). Une méthode
ne peut pas se déclarer elle-même vivante.

**Un profil au-dessus de l'existant, pas un protocole ex nihilo.** Chaque clause emprunte sa
mécanique là où elle est déjà résolue : versionnage et cycle de vie à la A2A, enveloppe
CloudEvents, télémétrie OTel `gen_ai.*`, dualité error/incident de BPMN pour (d), sémantique
*Pinned* de Temporal pour (e), sémantique d'interruption de LangGraph pour le stop. Tout le
reste est emprunté ; ne restent en propre que les trois inventions annoncées au §4.

## 6. Le siège d'autorité : qui tient le « continue » ?

Une subtilité du contrat, qui est peut-être son idée la plus généralisable : **le contrat ne
dit pas qui décide. Il dit comment on décide.**

Dans le squelette, quelqu'un envoie `continue`. Ce quelqu'un — appelons-le le **siège
d'autorité** — est interchangeable. En mode **pilote**, le superviseur tient le siège : c'est
lui qui lance les sessions, évalue les rapports de gate et décide de continuer (l'humain ayant
délégué, avec budget et kill-switch). En mode **moniteur**, la méthode tourne dans la session
interactive de l'humain — c'est *lui* qui voit les gates s'afficher et décide — et le
superviseur se contente de consommer le flux d'événements pour suivre l'avancement.

Le contrat est **identique dans les deux modes** ; seul le détenteur du siège change. Une
nuance honnête : en mode moniteur, l'invariant fail-safe passe de l'*enforcement* (le
superviseur retient la méthode) à la *détection* (un gate franchi sans `continue` est signalé
et audité). C'est la différence entre un sas et une alarme — les deux ont leur place, tant
qu'on sait lequel on a.

C'est aussi la réponse aux deux sessions du récit qui se marchaient dessus : la session de
nuit et la session de jour ne sont pas deux mondes à réconcilier, ce sont deux sièges
possibles au-dessus du même flux d'événements — et le flux, lui, garde la trace de qui a dit
« continue ».

Ce découplage a une conséquence pratique immédiate : on peut commencer à travailler *avec* une
méthode supervisable avant d'avoir un superviseur autonome de confiance — l'humain tient le
siège, la méthode s'arrête aux gates, tout est déjà audité. Puis, gate après gate, déléguer le
siège. **La frontière d'autonomie devient un curseur, pas un pari binaire.**

## 7. Positionnement — les cinq voisins les plus proches

Affirmer que « personne ne le fait » demande mieux que des recherches web : les quatre sources
primaires de cet article ont été lues de première main — specs, papiers, schémas ; les
[notes de lecture](../captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md)
détaillent chaque vérification — et toutes les citations ci-dessous sont verbatim. La carte,
clause par clause :

| Voisin | (a) gates déclarés | (b) stop par défaut | (c) événements versionnés | (d) escalade 2 étages | (e) adoption aux gates |
|---|:---:|:---:|:---:|:---:|:---:|
| LangGraph + Agent Protocol | ⚠️ | ⚠️ opt-in | ⚠️ | ❌ | ❌ |
| A2A v1.0 | ❌ | ❌ polarité inverse | ✅ | ⚠️ | ❌ |
| Rel(AI)Build | ❌ imposés | ✅ mais phases fixes | ❌ | ❌ | ❌ |
| Temporal / Restate | ❌ | ⚠️ opt-in | ❌ | ❌ | ✅ mais pour du code |
| BPMN / Camunda | ⚠️ | ❌ polarité inverse | ⚠️ | ✅ | ✅ |

**LangGraph Platform + Agent Protocol (LangChain)** — le voisin industriel le plus proche. La
sémantique d'arrêt est exactement la bonne : « When an interrupt is triggered, LangGraph saves
the graph state using its persistence layer and **waits indefinitely until you resume
execution** » ; et l'Agent Inbox prouve qu'une supervision aveugle au graphe est viable dès
qu'un schéma d'interruption typé est imposé. Mais tout est **opt-in** : un graphe sans
`interrupt()` court jusqu'au bout. L'interruption est un canal unique au contenu opaque
(« payload: any — Opaque interrupt value from runtime; application-defined shape ») — pas de
taxonomie d'escalade. Reprendre un run après un changement de code est non spécifié (le
rattachement des réponses est « strictly index-based » : réordonner les interruptions apparie
silencieusement les reprises aux mauvaises interruptions). Et la gouvernance est mono-éditeur.

**A2A v1.0 (Linux Foundation)** — le meilleur *substrat*. Le versionnage est le plus propre du
marché (« A new URI MUST be created for breaking changes to an extension »), les événements
sont strictement ordonnés (« Events MUST NOT be reordered during transmission »), et l'opacité
des agents y est un principe fondateur : « Opaque Execution: Agents collaborate based on
declared capabilities and exchanged information, without needing to share their internal
thoughts, plans, or tool implementations. » Mais la polarité est inverse : c'est **l'agent**
qui décide de s'interrompre (`INPUT_REQUIRED`, `AUTH_REQUIRED`), et un agent qui file jusqu'à
`COMPLETED` sans jamais s'arrêter est parfaitement conforme. L'Agent Card déclare des *skills*
(« largely a descriptive concept »), pas des gates ; rien sur le budget ; rien sur la version
d'un process en cours de run. Le mécanisme d'extensions requises (`required: true`) est en
revanche exactement la porte par laquelle un profil « supervisabilité » pourrait se greffer
sur A2A sans le forker.

**Rel(AI)Build (arXiv:2606.26924)** — le cousin conceptuel le plus proche, et le seul à la
bonne polarité au bon grain : une machine à états déterministe refuse la progression par
défaut (« blocks on violation »), exige des *receipts* nommés pour franchir les phases, plafonne
les boucles d'auto-correction à trois itérations avant escalade humaine, au-dessus de harnesses
non modifiés (Cursor, Claude Code). Sa thèse mérite d'être gravée : « A non-deterministic
component cannot serve as a trustworthy control for another non-deterministic component. »
Nous la partageons entièrement. La divergence est ailleurs : ses phases sont **imposées par le
control plane** (« hard-coded in the control plane », héritées du stage-gate de Cooper, 1990) —
la méthode ne déclare rien, il n'y a pas de méthode pluggable. Pas de budget de tokens, pas de
schéma d'événements versionné, pas de taxonomie d'escalade (une seule destination : pause,
humain, même log). C'est la clause (b) sans les clauses (a), (c), (d), (e).

**Temporal / Restate (exécution durable)** — la clause (e) résolue à l'échelle industrielle,
dix ans avant tout le monde : les workflows restent épinglés à leur version de départ et
n'adoptent la suivante qu'aux frontières ; Restate ajoute le détail décisif pour l'ère LLM (le
snapshot de version inclut prompts et définitions d'outils). Mais tout opère au niveau du *code
d'orchestration dans le moteur* — c'est la couche de durabilité, pas un contrat envers une
méthode opaque, et l'interruption par signaux y est opt-in.

**BPMN / Camunda (external tasks)** — le squelette structurel historique. La dualité *error*
(métier, traité dans le modèle) / *incident* (opérationnel, gèle le process, remonte à
l'humain) est le seul précédent formel de notre clause (d) ; l'*external task* est une
exécution aveugle en pull ; le *version binding* fait finir une instance sur sa version. Mais
la polarité est inverse (le jeton avance par défaut), les incidents ne sont pas typés (pas de
budget), et surtout **le moteur possède le modèle de process** — l'exact opposé de notre
partage des rôles, où la méthode s'auto-orchestre et n'expose que ses frontières.

**Et en dessous, le complément : Faramesh (arXiv:2601.17744).** Le plus instructif des
non-concurrents. Ce preprint verrouille le grain de l'action — *default-deny* : « No action
instance may produce an external effect unless this predicate holds » — et démontre
formellement qu'il *refuse* de monter au niveau des plans et des étapes : « Governing cognition
would require … enforcing transactional control over reasoning steps, both of which violate
the autonomy and composability assumptions » (§13.1 du papier, un *non-goal* prouvé). Autrement dit : le
papier le plus proche du sujet déclare notre étage volontairement vacant. Les deux couches
s'empilent naturellement — Faramesh garde chaque action, le contrat de supervisabilité garde
chaque étape.

La validation tierce va dans le même sens. Forrester (Leslie Joseph, blog du 20 mars 2026)
titre l'une des trois barrières des agent control planes « **Cross-Plane Governance Schemas
Don't Exist** » : « a third layer of standards remains absent: the schemas that define how the
build, orchestrate, and control planes exchange governance-relevant information about agent
state, policy, and lifecycle. » Et la première cartographie systématique des protocoles
d'agents (arXiv:2504.16736, *A Survey of AI Agent Protocols*) n'a tout simplement pas de
catégorie pour un protocole superviseur↔méthode — zéro occurrence de « supervisor »,
« gate » ou « control plane » dans sa taxonomie.

## 8. La lignée intellectuelle

Rien de tout cela ne sort de nulle part. Le contrat de supervisabilité est l'héritier d'une
lignée de près d'un demi-siècle, dont chaque maillon a apporté une pièce :

- **Contract Net Protocol (Smith, 1980)** — l'idée fondatrice : des nœuds de calcul qui ne se
  connaissent pas coordonnent du travail par un *protocole de contractualisation* (annonce,
  enchère, attribution), pas par une compréhension mutuelle.
- **FIPA-ACL (années 1990)** — la standardisation des *actes de langage* entre agents : des
  performatifs typés (`request`, `inform`, `failure`…) plutôt que du texte libre. L'ancêtre
  direct des « événements typés » de la clause (c).
- **Les institutions électroniques (AMELI, ISLANDER, ~2004)** — le précédent intellectuel le
  plus profond : une *institution* déclare ses scènes et ses règles dans une spec formelle, et
  un middleware **indépendant du domaine** fait respecter la norme à des agents qu'il ne
  comprend pas. L'aveuglement au métier comme principe d'architecture, vingt ans avant les LLM.
- **Le BPM et ses moteurs (BPMN, XES, external tasks)** — l'industrialisation du workflow :
  gates explicites, dualité error/incident, exécution aveugle en *pull*, version binding des
  instances (le détail au §7).
- **L'exécution durable (Temporal, Restate)** — le versionnage d'exécutions longues résolu
  industriellement ; la clause (e) est sa transposition contractuelle.
- **Les protocoles d'agents (A2A, 2025-26)** — versionnage d'interface, cycle de vie typé,
  agents opaques : le substrat naturel sur lequel un profil « supervisabilité » peut se poser.

La composition est neuve ; presque aucune pièce ne l'est. C'est plutôt bon signe — les
protocoles qui durent recombinent de l'éprouvé.

## 9. Honnêteté de positionnement : ce que ce contrat n'est pas

**Ce n'est pas un standard.** C'est une proposition, avec une implémentation de référence en
construction : mega-city comme première méthode supervisable, cop1 comme premier superviseur.
Le format « spec + reference implementation » est un début, pas une fin.

**Le versant descriptif se commoditise à vue d'œil.** Observer des agents — événements,
traces, tokens — est en cours de standardisation (OpenTelemetry GenAI, notamment). Dans deux
ans, « émettre des événements de méthode » sera banal. Ce qui restera défendable, c'est le
versant **prescriptif** : l'autorité, la polarité du défaut, la partition des escalades — les
clauses qui disent qui a le droit de faire avancer le monde, pas celles qui le décrivent.

**La fenêtre se referme.** Des travaux récents tournent autour du sujet sans le traiter —
c'est précisément pour cela que ce contrat mérite d'être nommé maintenant.

## 10. Glossaire

Les termes suivis de *(proposé)* sont introduits — et assumés — par cet article ; les autres
sont employés dans leur sens établi.

- **Contrat de supervisabilité** *(proposé)* (*Supervisability Contract*) — l'ensemble minimal
  de clauses qu'une méthode doit exposer pour être pilotable par un superviseur aveugle au
  métier : déclaration de gates, stop par défaut, événements versionnés, escalade à deux
  étages, adoption de version aux gates.
- **Méthode** — le *comment on travaille*, versionné : phases, rôles, rituels, gates, règles.
  Scrum outillé pour des agents en est une ; il y en aura d'autres. La méthode est le savant ;
  elle s'auto-orchestre et n'expose que ses frontières.
- **Superviseur / control plane** — le composant qui tient budget, arrêts, concurrence et
  frontière d'autonomie d'un ensemble de runs, **sans comprendre leur métier**. La tour de
  contrôle.
- **Gate** — une frontière d'étape déclarée par la méthode, matérialisée par un rapport
  structuré, où la méthode s'arrête par défaut.
- **Stop par défaut / polarité fail-safe** — la convention selon laquelle l'absence de
  décision vaut « attends », jamais « continue » (l'argument complet au §4-b).
- **Siège d'autorité** *(proposé)* — le détenteur du droit d'envoyer `continue` : un humain,
  un superviseur autonome, ou un humain assisté. Interchangeable sans changer le contrat.
- **Mode pilote / mode moniteur** *(proposé)* — les deux positions du siège : le superviseur
  décide (pilote) ; l'humain décide dans sa propre session et le superviseur observe le flux
  (moniteur). En mode moniteur, l'invariant fail-safe est *détecté* plutôt qu'*imposé*.
- **Escalade métier** *(proposé, par opposition au régalien)* — un problème que la méthode
  résout avec ses propres rôles (arbitrage, revue rejetée, désaccord entre agents). Ne
  traverse jamais la frontière.
- **Escalade régalienne** *(proposé)* — un problème qui excède l'autorité de la méthode :
  budget, blocage, besoin d'une décision humaine. Traverse la frontière sous forme d'événement
  typé (`budget` | `blocked` | `authority`), sans exposer le pourquoi métier. Le terme emprunte
  au vocabulaire politique français : les fonctions qu'on ne délègue pas.
- **Adoption de version aux gates** *(proposé)* — la règle selon laquelle un run n'adopte une nouvelle
  version de méthode qu'aux frontières de gate, sur ordre explicite (`adopt_version` porté par
  le `continue`), et de façon affichée. Entre deux gates, la méthode est épinglée.
- **Épinglage (pinning) de méthode** — la version de méthode d'un run est figée au démarrage —
  code, prompts, skills et règles compris — jusqu'à adoption explicite.
- **Manifeste** — la déclaration publiée par la méthode avant le run : identité, version,
  gates et schémas de rapports.
- **Grain de l'action vs grain de la méthode** *(proposé)* — les deux niveaux de garde : autoriser
  des appels d'outils individuels (l'existant), ou contractualiser des frontières d'étapes de
  travail (ce contrat). Complémentaires, pas concurrents.

## 11. Pour aller plus loin

Les quatre sources lues de première main pour cet article (notes de lecture détaillées, avec
vérification citation par citation, dans
[le doc compagnon](../captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md)) :

- **Rel(AI)Build** — Padmaraj Madatha, *A Deterministic Control Plane for LLM Coding Agents*,
  arXiv:2606.26924 (juin 2026). <https://arxiv.org/abs/2606.26924>
- **Agent Protocol** — LangChain, spec OpenAPI + sous-protocole streaming (CDDL).
  <https://github.com/langchain-ai/agent-protocol> ; sémantique d'interruption :
  <https://docs.langchain.com/oss/python/langgraph/interrupts> ; supervision aveugle au
  graphe : <https://github.com/langchain-ai/agent-inbox>
- **A2A v1.0** — Linux Foundation (contribué par Google), spec + `a2a.proto` normatif.
  <https://a2a-protocol.org/latest/specification/>
- **Faramesh** — Amjad Fatmi, *Faramesh: A Protocol-Agnostic Execution Control Plane for
  Autonomous Agent Systems*, arXiv:2601.17744 (janvier 2026, preprint).
  <https://arxiv.org/abs/2601.17744>

Le contexte et la validation tierce :

- Leslie Joseph (Forrester), *Agent Control Planes Still Need A Robust Standards Stack*,
  20 mars 2026.
  <https://www.forrester.com/blogs/agent-control-planes-still-need-a-robust-standards-stack/>
- Yang et al., *A Survey of AI Agent Protocols*, arXiv:2504.16736 (v3, juin 2025).
  <https://arxiv.org/abs/2504.16736>

Et la lignée, pour qui veut creuser : R. G. Smith, *The Contract Net Protocol* (IEEE Trans.
Computers, 1980) ; les specs FIPA-ACL (<http://www.fipa.org/>) ; Esteva et al., *AMELI: An
Agent-Based Middleware for Electronic Institutions* (AAMAS 2004) ; la doc BPMN/Camunda sur les
external tasks et la dualité error/incident ; la doc Temporal sur le Worker Versioning
(Pinned / Continue-as-New) ; l'event stream d'OpenHands.

---

*Cet article est la base interne citable du projet cop1 sur le sujet (l'« antichambre » de
l'ADR correspondant). mega-city — la méthode versionnée du récit d'ouverture — en sera la
première implémentation de référence ; cop1 le premier superviseur. La publication externe est
volontairement différée : le contrat devra d'abord avoir été éprouvé par au moins un run réel.*
