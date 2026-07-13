# Le contrat de supervisabilité

*Tout le monde surveille ce que les agents IA **font**. Personne ne surveille la **méthode**
qu'ils suivent.*

---

## Deux heures du matin

Il est deux heures du matin et mon ordinateur travaille. Un programme que j'ai écrit — un
superviseur, il s'appelle cop1 — fait avancer une petite équipe d'agents IA sur le backlog d'un
projet. Un *run* : une exécution de bout en bout, qui durera jusqu'au matin. Les agents
écrivent des tests, du code, ouvrent des pull requests. Le superviseur, lui,
ne comprend rien à ce qu'ils fabriquent. C'est voulu. Il ne surveille que trois choses : ce que
ça coûte, si c'est bloqué, et si ça a le droit de continuer.

La *façon* de travailler — les étapes, les revues, ce qui définit « terminé » — ne vit pas dans
le superviseur. Elle vit dans une **méthode** : un dépôt à part, versionné, qui décrit les
rôles, les étapes et les règles. La mienne s'appelle mega-city ; en gros, un scrum outillé pour
des agents, avec des numéros de version.

Au matin, je relis ce que la nuit a produit, et j'améliore la méthode. Une étape de revue en
plus, un format de rapport qui change. Je committe, je tague la version 1.4.

Et là, une question toute bête : **le run de cette nuit, il tourne sous quelle version de la
méthode ?** Celle d'hier soir, ou celle de ce matin ? Si la réponse est « ça dépend du moment
où le fichier a été relu », ce n'est pas une réponse. C'est un bug qui n'a pas encore eu lieu.

## Un problème, pas une anecdote

Vous n'avez pas besoin de mes outils pour rencontrer ce problème. Deux ingrédients suffisent,
et vous les avez peut-être déjà : des agents IA qui travaillent dans la durée, et un process
qui évolue pendant qu'ils travaillent.

Dès que les deux coexistent, les questions arrivent en grappe. Que fait-on d'un travail en
cours quand le process change ? Peut-on mettre à jour l'outil de supervision pendant qu'il
supervise ? Et quand le process a besoin d'un humain — budget épuisé, décision à prendre — à
qui le dit-il, et dans quelle langue ?

J'ai d'abord cru à une collection de petits problèmes d'ingénierie. C'est un seul problème :
**il n'existe aucun contrat entre celui qui supervise et la méthode supervisée.** Chaque moitié
est bien outillée de son côté. La frontière entre les deux est un no man's land.

## On garde les actions, pas les méthodes

« La supervision d'agents, c'est couvert », me direz-vous. C'est vrai — mais regardez le
*niveau* auquel tout le monde travaille.

L'outillage existant monte la garde devant les **actions** : un agent veut lancer `rm -rf`,
exécuter du shell, appeler une API — on autorise, on refuse, on demande confirmation. Les
outils du marché font ça, et c'est nécessaire.

Mais ce n'est pas là que se prennent les décisions qui comptent. « L'étape est finie —
continue-t-on ? » ; « le budget fond — vaut-il mieux s'arrêter proprement à la fin de
l'étape ? » ; « une nouvelle version du process est sortie — ce run l'adopte-t-il, et quand ? »
Ces décisions se prennent au niveau de la **méthode**, aux frontières d'étapes. Et à ce
niveau-là, personne ne contractualise rien.

C'est la phrase qui résume cet article : **on garde les actions ; personne ne garde les
méthodes.**

## L'idée : une tour de contrôle

Une tour de contrôle ne sait pas piloter. Elle ne connaît ni la checklist d'un A320 ni le
chargement d'un cargo. Et pourtant elle contrôle — parce que tout appareil respecte un contrat
minuscule : se signaler à des points définis ; ne jamais franchir une piste sans clairance
explicite (le silence de la tour veut dire « attends », jamais « vas-y ») ; parler une
phraséologie normalisée, où « mayday » (détresse) et « pan-pan » (urgence) ne sont pas le même
mot.

Un superviseur d'agents IA est exactement dans la situation de la tour. Il fait tourner des
méthodes qu'il ne comprend pas — et c'est une qualité : un superviseur qui comprend la méthode
finit toujours par la recoder chez lui. Ce qui lui manque, ce n'est pas de l'intelligence.
C'est la phraséologie.

C'est ce contrat que je propose de nommer **contrat de supervisabilité** : le minimum qu'une
méthode doit exposer pour être supervisable par quelqu'un qui n'y comprend rien.

## Le contrat, en cinq clauses

**1. La méthode annonce ses étapes.** Avant de démarrer, la méthode publie un manifeste : la
liste de ses étapes, et le format du rapport qu'elle produira à la fin de chacune. Le
superviseur n'impose pas de process ; il apprend celui de la méthode. Les rares systèmes qui
gèrent des phases font l'inverse — ils les imposent (on y revient plus bas).

**2. À la fin d'une étape, on s'arrête. Par défaut.** La méthode s'arrête à chaque fin d'étape
et ne repart que sur un ordre explicite du superviseur : `continue`. Le silence veut dire
« attends ».

Pourquoi ce sens-là ? Faites l'exercice de la panne. Si le comportement par défaut est
« continue » et que le canal de supervision tombe, vous obtenez une boucle autonome
silencieuse — un run qui avance sans que personne le regarde, en dépensant des tokens. Si
c'est « stop », vous obtenez un run bloqué, visible, rattrapable. Entre une panne silencieuse
et une panne bruyante, un système de contrôle choisit toujours la bruyante. C'est le principe
des freins de train : le frein serre quand la pression tombe.

Et — c'est, à ma connaissance, une nouveauté — ce stop-par-défaut n'est pas un réglage, c'est
une **clause de contrat vérifiable** : dans le journal d'événements, toute activité après une
fin d'étape sans `continue` correspondant est une violation détectable. Auditable après coup,
alertable en direct.

**3. Tout passe par des événements typés et versionnés.** Rapports d'étape, alertes,
commandes : des événements dont le schéma est versionné — un changement cassant produit une
nouvelle version, un consommateur sait toujours ce qu'il lit. C'est la clause la plus ennuyeuse
du contrat, et c'est voulu : tout existe déjà sur étagère, il n'y a qu'à réutiliser.

**4. Deux sortes d'appels à l'aide.** Quand quelque chose coince, deux familles de problèmes se
présentent, et les mélanger est une erreur de conception. Les problèmes **métier** — une revue
qui rejette, un désaccord entre agents, un arbitrage — se règlent *dans* la méthode, par ses
propres rôles ; le superviseur n'en voit rien. Les problèmes **régaliens** — budget épuisé, run
bloqué, décision qui dépasse l'autorité de la méthode — traversent la frontière sous forme
typée : `budget`, `blocked`, `authority`. Le superviseur apprend que la méthode a besoin d'une
décision qui la dépasse ; il n'apprend jamais *pourquoi* au sens métier. Mayday contre
pan-pan : deux mots, parce que deux régimes de réponse.

**5. Les mises à jour attendent la fin d'étape.** C'est la réponse à la question de deux heures
du matin. Un run démarre sous une version de la méthode et la garde — prompts et règles
compris — jusqu'à une fin d'étape. C'est uniquement là que le superviseur peut proposer
l'adoption : « continue, et au passage passe en 1.4 ». Jamais en vol, jamais implicite,
toujours affichée à l'utilisateur. Et la même discipline vaut pour le superviseur lui-même :
sa mise à jour est un choix et un redémarrage — jamais quelque chose qui *arrive* à un run.

## À quoi ça ressemble

Le contrat tient sur un écran. Une précision de vocabulaire avant de le lire : dans le schéma,
une fin d'étape s'appelle un *gate* — une barrière où l'on s'arrête. Version zéro :

```
MANIFESTE (déclaré par la méthode avant le run)
  contract: "supervisability/v1"
  method: {name, version}               # épinglée jusqu'à adoption explicite à un gate (clause 5)
  gates: [{id, after?, report_schema}]  # les étapes, leur ordre (after), le schéma de leur rapport

ÉVÉNEMENTS méthode → superviseur (flux ordonné, append-only)
  gate.reached {gate_id, report}        # OBLIGATOIRE ; la méthode S'ARRÊTE ici
  escalation  {type: budget|blocked|authority, detail}
  usage       {tokens_in/out}           # télémétrie périodique
  run.finished {status, final_report}

COMMANDES superviseur → méthode (l'unique canal de progression)
  continue {gate_id, adopt_version?}    # pas de continue = la méthode reste arrêtée
  abort    {reason}

INVARIANT : toute activité après un gate.reached sans continue
correspondant = violation du contrat (détectable, auditable).
```

Deux choix de conception méritent une ligne. Le canal est un simple **flux d'événements**
append-only — on ne fait qu'y ajouter, jamais modifier — pas une API : n'importe quelle
méthode qui parle ce flux est supervisable, n'importe quel superviseur qui le lit sait
superviser. Et la machine à états du run appartient au **superviseur**, pas à la méthode :
une méthode ne peut pas se déclarer elle-même vivante.

Notez enfin la division du travail dans ce schéma : les événements *décrivent* ce qui se
passe ; les commandes *prescrivent* ce qui a le droit de se passer. Cette distinction va
revenir.

## Qui tient le « continue » ?

La partie la plus utile du contrat n'est peut-être pas technique. Le contrat ne dit pas *qui*
décide ; il dit *comment* on décide. Celui qui envoie `continue` occupe ce que j'appelle le
**siège d'autorité** — et l'occupant est interchangeable : un humain, un superviseur autonome,
un humain assisté.

La conséquence pratique est immédiate : on peut adopter le contrat *avant* de faire confiance à
un superviseur autonome. Au début, c'est vous qui tenez le siège : la méthode s'arrête à chaque
fin d'étape, tout est journalisé, et c'est vous qui dites « continue ». Puis vous déléguez,
cran par cran — d'abord le superviseur valide les rapports conformes et vous ne tranchez que
les cas douteux ; à la fin, il ne vous réveille plus que sur escalade. **L'autonomie devient un
curseur, pas un pari binaire.**

## « Ça n'existe pas déjà ? »

C'est la bonne question, et je ne voulais pas y répondre avec des recherches en diagonale :
j'ai lu de première main les quatre sources les plus proches — LangGraph, A2A, Rel(AI)Build,
Faramesh —, specs et papiers, citations vérifiées une à une
([notes de lecture](../captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md)) ;
Temporal et les moteurs BPM, plus anciens et mieux connus, sont décrits d'après le balayage
documentaire. Le résumé honnête :

- **LangGraph** (le framework d'orchestration d'agents de LangChain, la boîte à outils LLM la
  plus répandue) a exactement la bonne
  mécanique d'arrêt : un run interrompu attend indéfiniment qu'on le reprenne. Mais elle est
  *opt-in* : un graphe qui ne demande jamais d'interruption court jusqu'au bout, et rien ne
  l'oblige à s'arrêter.
- **A2A** (le protocole d'interopérabilité entre agents, hébergé par la Linux Foundation)
  versionne et ordonne ses événements impeccablement — le substrat rêvé pour porter ce contrat.
  Mais la polarité est inverse : c'est l'agent qui décide de s'interrompre, et un agent qui ne
  s'arrête jamais est parfaitement conforme.
- **Rel(AI)Build** (une prépublication de juin 2026) est le seul, parmi les systèmes examinés,
  à faire du stop-par-défaut au bon niveau — mais ses phases sont codées en dur dans le
  superviseur ; la méthode ne déclare rien.
- **Temporal** (le moteur d'exécution durable qui fait tourner des workflows pendant des mois)
  a résolu la clause 5 il y a des années : les workflows restent épinglés à leur version,
  l'adoption attend une frontière. Pour du code d'orchestration — pas comme contrat envers une
  méthode qu'on ne comprend pas.
- Les moteurs **BPM** (*Business Process Management* — l'orchestration des processus métier en
  entreprise, à la Camunda) distinguent depuis vingt ans l'erreur métier de l'incident
  opérationnel — notre clause 4. Mais chez eux, le moteur *possède* le process ; ici, la
  méthode s'appartient et n'expose que ses frontières.
- Et **Faramesh** (une prépublication de janvier 2026) verrouille le niveau du dessous — chaque
  action individuelle refusée par défaut — en assumant explicitement de ne pas monter au niveau
  des étapes. Les deux couches s'empilent naturellement.

Un analyste de Forrester notait d'ailleurs en mars 2026 — je traduis — que les schémas
permettant aux plans de construction, d'orchestration et de contrôle d'échanger de
l'information de gouvernance « n'existent pas ». Chaque clause existe donc quelque part,
souvent depuis longtemps. La composition n'existe nulle part — et surtout, personne ne fait du
stop-par-défaut une **clause de contrat** : une exigence que la méthode déclare elle-même et
que n'importe qui peut auditer dans le flux d'événements.

## Trois honnêtetés

**Ce n'est pas un standard.** C'est une proposition, avec une implémentation de référence en
construction : mega-city comme première méthode supervisable, cop1 comme premier superviseur.
Une spec seule ne prouve rien ; le premier run réel, si.

**La moitié descriptive va se banaliser.** Les formats d'événements d'agents — traces, tokens,
états — sont en cours de standardisation ; dans deux ans, *décrire* un run sera banal. Ce qui
restera discriminant, c'est la moitié *prescriptive* du contrat : qui a le droit de faire
avancer le run.

**La fenêtre se referme.** Plusieurs travaux de 2026 tournent autour du sujet sans s'y poser.
C'est exactement pourquoi ce contrat mérite d'être nommé maintenant.

## Faites l'exercice

Si vos agents travaillent dans la durée, ouvrez les logs d'hier et posez-vous une seule
question : sauriez-vous prouver qu'aucune étape n'a avancé sans clairance ? Si la réponse est
non, vous avez le même bug que moi.

Il n'a juste pas encore eu lieu.

## Pour creuser

Cet article est la version 2, réécrite pour un lecteur qui découvre le sujet. Tout ce qu'il
simplifie est documenté ailleurs :

- **[La version détaillée (v1)](./contrat-de-supervisabilite-v1.md)** — le positionnement
  complet source par source (avec les citations verbatim), la lignée intellectuelle (du
  Contract Net Protocol — le premier protocole de délégation de travail entre agents, 1980 —
  aux protocoles d'agents de 2026) et le glossaire complet des termes proposés (siège
  d'autorité, escalade régalienne, adoption aux gates…).
- **[Les notes de lecture](../captures/2026-07-13-notes-lecture-sources-contrat-supervisabilite.md)** —
  la vérification de première main, citation par citation, avec les corrections apportées au
  balayage initial.
- Les sources primaires : Rel(AI)Build, *A Deterministic Control Plane for LLM Coding Agents*
  (<https://arxiv.org/abs/2606.26924>) · Agent Protocol (la spec d'API de runs de LangChain) /
  LangGraph (<https://github.com/langchain-ai/agent-protocol>,
  <https://docs.langchain.com/oss/python/langgraph/interrupts>) · spec A2A v1.0
  (<https://a2a-protocol.org/latest/specification/>) · Faramesh
  (<https://arxiv.org/abs/2601.17744>) · Leslie Joseph (Forrester), *Agent Control Planes
  Still Need A Robust Standards Stack*, mars 2026 · *A Survey of AI Agent Protocols*
  (<https://arxiv.org/abs/2504.16736>).

*Publication externe volontairement différée : le contrat devra d'abord avoir été éprouvé par
au moins un run réel.*
