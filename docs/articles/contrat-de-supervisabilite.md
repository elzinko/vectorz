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
supervise ? Et quand le process se heurte à quelque chose qui le dépasse — un blocage, une
décision à prendre — à qui le dit-il, et dans quelle langue ?

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
continue-t-on ? » ; « le budget fond — faut-il retenir le prochain feu vert ? » ; « une
nouvelle version du process est sortie — ce run l'adopte-t-il, et quand ? » Ces décisions se
prennent au **grain de la méthode** — aux frontières d'étapes. Et à ce grain-là, personne ne
contractualise rien.

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

**1. La méthode se signale à ses jalons.** Le superviseur ne connaît pas le plan de la
méthode — pas même sa liste d'étapes. La méthode se déclare en démarrant (qui elle est, en
quelle version), puis se signale au fil de l'eau : à chaque fin d'étape, un événement et un
rapport ; entre deux, un signe de vie. Le superviseur n'impose pas de process, et il n'en
apprend pas non plus : il constate. Les rares systèmes qui gèrent des phases font tout
l'inverse — ils les imposent (on y revient plus bas).

**2. À la fin d'une étape, on s'arrête. Par défaut.** La méthode s'arrête à chaque fin d'étape
et ne repart que sur un ordre explicite : `continue`. Cet ordre vient du **siège** — celui qui
tient les commandes, humain ou superviseur logiciel ; on y revient en fin d'article. Le
silence veut dire « attends ».

Pourquoi ce sens-là ? Faites l'exercice de la panne. Si le comportement par défaut est
« continue » et que le canal de supervision tombe, vous obtenez une boucle autonome
silencieuse — un run qui avance sans que personne le regarde, en dépensant des tokens. Si
c'est « stop », vous obtenez un run bloqué, visible, rattrapable. Entre une panne silencieuse
et une panne bruyante, un système de contrôle choisit toujours la bruyante. C'est le principe
des freins de train : le frein serre quand la pression tombe.

Et — c'est, à ma connaissance, une nouveauté — ce stop-par-défaut n'est pas un réglage, c'est
une **clause de contrat vérifiable** : les décisions du siège sont journalisées elles aussi,
et toute activité après une fin d'étape sans reprise autorisée correspondante est une
violation détectable dans le journal. Auditable après coup, alertable en direct.

**3. Tout passe par des événements typés et versionnés.** Rapports d'étape, alertes,
commandes : des événements dont le schéma est versionné — un changement cassant produit une
nouvelle version, un consommateur sait toujours ce qu'il lit. C'est la clause la plus ennuyeuse
du contrat, et c'est voulu : tout existe déjà sur étagère, il n'y a qu'à réutiliser.

**4. Deux sortes de problèmes, deux étages.** Quand quelque chose coince, deux familles de
problèmes se présentent, et les mélanger est une erreur de conception. Les problèmes
**métier** — une revue qui rejette, un désaccord entre agents, un arbitrage — se règlent
*dans* la méthode, par son propre encadrement : c'est le travail du **manager** (scrum master,
product owner — des rôles *de la méthode*). Le superviseur n'en voit rien. Les problèmes
**régaliens** — un blocage, une décision qui dépasse l'autorité de la méthode — traversent la
frontière sous forme typée : `blocked`, `authority`. C'est un signal, pas un arrêt : la
méthode peut continuer sur un autre front pendant que l'alerte vit sa vie, et le superviseur
apprend qu'une décision la dépasse sans jamais apprendre *pourquoi* au sens métier. Mayday
contre pan-pan : deux mots, parce que deux régimes de réponse.

(Et le budget ? Il n'est dans aucune des deux listes, à dessein. La méthode ne le connaît
pas — c'est le superviseur qui mesure la consommation et qui freine, en retenant le prochain
feu vert ou en coupant. On ne demande pas au surveillé de déclarer lui-même qu'il dépense
trop.)

**5. Les mises à jour attendent une fin d'étape — et pas n'importe laquelle.** C'est la
réponse à la question de deux heures du matin. Un run démarre sous une version de la méthode
et la garde — prompts et règles compris — jusqu'à une fin d'étape que la méthode elle-même
déclare **stable** (rien d'à moitié migré, pas de chantier ouvert : elle seule le sait). C'est
uniquement là que le superviseur peut proposer l'adoption : « continue, et au passage passe en
1.4 » ; la méthode confirme la bascule par un événement, et l'adoption est affichée. Jamais en
vol, jamais implicite. Et la même discipline vaut pour le superviseur lui-même : sa mise à
jour est un choix et un redémarrage — jamais quelque chose qui *arrive* à un run.

## À quoi ça ressemble

Le contrat tient sur un écran. Une précision de vocabulaire avant de le lire : dans le schéma,
une fin d'étape s'appelle un *gate* — une barrière où l'on s'arrête. Version 0.1 :

```
ÉVÉNEMENTS méthode → superviseur          (events.jsonl — journal append-only du run, écrit
                                           par la méthode ; une ligne par événement, chaque
                                           ligne portant son identifiant)
  run.started  {method: {name, version}, seat}    # le manifeste : une identité, pas un plan
  gate.reached {gate_id, outcome: ok|attention|failed, report_ref, upgrade_ok}
                                          # OBLIGATOIRE ; la méthode S'ARRÊTE ici
  gate.resumed {gate_event_id}            # accusé de reprise — obligatoire avant toute suite
  version.adopted {from, to}              # confirme une adoption (clause 5) — émis entre la
                                          #   clairance et la reprise
  escalation   {escalation_id, type: blocked|authority, detail}   # un signal, pas un frein
  heartbeat    {note?}                    # signe de vie entre deux jalons
  run.finished {status, final_report_ref} # s'arrêter est toujours permis

COMMANDES siège → méthode                 (commands.jsonl — écrit par le siège, AVANT l'acte)
  continue {gate_event_id, adopt_version?}  # la clairance ; adoption seulement si upgrade_ok
  hold     {gate_event_id, reason}        # rétention explicite (budget, politique…)
  abort    {reason}                       # le frein régalien

ÉTATS DU RUN (tenus par le superviseur, reconstruits en rejouant les journaux)
  launched → running ⇄ at_gate → finished | aborted

INVARIANT : tout événement postérieur à un gate.reached sans gate.resumed
corrélé = violation du contrat — détectée, affichée, comptée.
```

Et voici une soirée type, vue du journal — les noms sont abrégés, et `#12`, `#31` désignent
les identifiants des événements `gate.reached` visés :

```
22:04  run.started     {method: mega-city v1.3, seat: pilot}   ← le siège : le superviseur
23:41  gate.reached    {gate: story-42-review, outcome: ok, report: reports/story-42.md,
                        upgrade_ok: true}
23:41    [commands]    continue {gate_event: #12, adopt_version: v1.4}
23:42  version.adopted {from: v1.3, to: v1.4}   ← l'adoption : explicite, tracée, à un jalon stable
23:42  gate.resumed    {gate_event: #12}
02:17  escalation      {id: e-7, type: blocked, detail: "story-43 : dépendance externe"}
02:31  heartbeat       {note: "story-44 en cours"}      ← bloquée sur un front, pas sur tous
04:52  gate.reached    {gate: story-44-review, outcome: attention, upgrade_ok: false}
04:52    [commands]    hold {gate_event: #31, reason: policy}   ← feu orange : on attend l'humain
```

Au réveil : un run garé proprement sur un feu orange, une escalade ouverte, une adoption de
version tracée — et tout tient dans deux fichiers texte.

Trois choix de conception méritent une ligne. Le canal est un couple de simples **fichiers
append-only** — on ne fait qu'y ajouter, jamais modifier — pas une API : les événements d'un
côté, les décisions du siège de l'autre ; n'importe quelle méthode qui écrit ce flux est
supervisable, n'importe quel superviseur qui le lit sait superviser — et il en garde une copie
miroir hors de portée de la méthode, pour que la preuve ne dépende pas du surveillé. La
machine à états du run appartient au **superviseur**, reconstruite en rejouant les journaux :
une méthode ne peut pas se déclarer elle-même vivante. Et notez la division du travail : les
événements *décrivent* ce qui se passe ; les commandes *prescrivent* ce qui a le droit de se
passer. Cette distinction va revenir.

## Qui tient le « continue » ?

La partie la plus utile du contrat n'est peut-être pas technique. Le contrat ne dit pas *qui*
décide ; il dit *comment* on décide. Celui qui envoie `continue` occupe ce que j'appelle le
**siège d'autorité** — et l'occupant est interchangeable : un humain, un superviseur autonome,
un humain assisté.

La conséquence pratique est immédiate : on peut adopter le contrat *avant* de faire confiance à
un superviseur autonome. Au début, c'est vous qui tenez le siège : la méthode s'arrête à chaque
fin d'étape, tout est journalisé, et c'est vous qui dites « continue ». Puis vous déléguez,
cran par cran — d'abord le superviseur ne continue seul que sur les jalons au feu vert
(`outcome: ok`) et vous ne tranchez que les cas douteux ; à la fin, il ne vous réveille plus
que sur escalade. **L'autonomie devient un curseur, pas un pari binaire.**

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
  entreprise, à la Camunda) séparent depuis vingt ans ce que le process règle en interne de ce
  qui remonte à l'opérateur — jusqu'au signal d'escalade qui remonte *sans arrêter le flux*,
  notre clause 4 presque mot pour mot. Mais chez eux, le moteur *possède* le process ; ici, la
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
- **[La capture d'architecture](../captures/2026-07-13-contrat-methode-et-versions.md)** — les
  décisions D1–D13, le squelette v0.1 complet (enveloppe, layout, limites par mode) et le
  compte rendu du panel design qui l'a éprouvé.
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
