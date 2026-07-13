# Notes de lecture première main — fenêtres de mise à jour (2026-07-13)

Statut : phase 1 de la fiche [0026](../../features/0026-article-fenetres-de-mise-a-jour.md).
Lecture de première main de six familles de systèmes qui savent « mettre à jour un système
pendant qu'il travaille », en préparation de l'article
[fenêtres de mise à jour](../articles/fenetres-de-mise-a-jour.md). Toutes les citations
ci-dessous ont été vérifiées dans le contenu réellement téléchargé (docs officielles, markdown
brut GitHub, HTML source) — pas de mémoire de modèle, pas de source secondaire non recoupée.

**Grille de lecture commune** (dérivée de la clause 5 du
[contrat de supervisabilité](../articles/contrat-de-supervisabilite.md) et des décisions D1/D2
de la [capture 2026-07-13](./2026-07-13-contrat-methode-et-versions.md)) : qui *déclare* que la
bascule de version est possible ? que devient le travail *en vol* ? quand la bascule peut-elle
avoir lieu ?

---

## 1. Temporal — Worker Versioning (Pinned, Continue-as-New)

**Métadonnées vérifiées.** Pages docs officielles : « Worker Versioning »
(<https://docs.temporal.io/worker-versioning>), « Worker Versioning » côté production
(<https://docs.temporal.io/production-deployment/worker-deployments/worker-versioning>,
« Minimum versions: Go SDK version v1.35.0, Python v1.11, Java v1.29, Typescript v1.12,
.NET v1.7.0, Ruby v0.5.0 »), « Continue-As-New »
(<https://docs.temporal.io/workflow-execution/continue-as-new>), « Patching »
(<https://docs.temporal.io/patching>). Statut de maturité : blog Temporal du 30 mars 2026,
*Announcing GA for Worker Versioning and Public Preview for Upgrade on Continue-as-New*
(<https://temporal.io/blog/ga-worker-versioning-public-preview-upgrade-on-continue-as-new>) —
le statut GA/Preview vient du blog, pas des pages docs. Ne pas confondre avec « Worker
versioning (legacy) » (ancien mécanisme, non lu).

**Citations verbatim.**

- « You can declare each Workflow type to have a **Versioning Behavior**, either Pinned or
  Auto-Upgrade, in your Workflow configuration using an SDK or the CLI. » — worker-versioning,
  § Versioning Behaviors.
- « A **Pinned** Workflow is guaranteed to complete on a single Worker Deployment Version. » —
  worker-versioning, § Versioning Behaviors. *(contre-vérifiée par grep source)*
- « An **Auto-Upgrade** Workflow will move to the latest Worker Deployment Version
  automatically whenever you change the current version. » — ibid.
- « Auto-upgrade Workflows are not restricted to a single Deployment Version and need to be
  kept replay-safe manually, i.e. with patching. » — ibid.
- Statuts de drainage : « The version has open pinned Workflows running on it, but stopped
  being Current or Ramping » (Draining) ; « The version was draining and now all the pinned
  Workflows that were running on it are closed. » (Drained) — worker-versioning,
  § Versioning Statuses.
- « The new Workflow Execution has the same Workflow Id, but a different Run Id, and starts
  its own Event History. » — continue-as-new.
- « To prevent long-running Workflows from running on stale versions of code, you may also
  want to Continue-as-New periodically, depending on how often you deploy. » — continue-as-new.
- « When Original Workflow is Pinned: The Pinned version is inherited across the
  Continue-As-New chain. […] When Original Workflow is Auto-upgrade: No version inheritance
  occurs » — worker-versioning, § Continue-As-New.
- « Upgrade on Continue-as-New lets you use these boundaries as version upgrade points » ;
  « At your next Continue-as-New, you can opt into the upgrade » — blog du 30 mars 2026.
- Patching : « It applies a code change to new Workflow Executions while avoiding disruptive
  changes to in-progress Workflow Executions. » ; sans patch, le replay lève « a
  non-deterministic exception because the replay and original event histories don't match » —
  patching.

**Lecture à travers la grille.** Deux niveaux de décision, explicitement séparés :
l'**opérateur** décide quelle version est Current/Ramping (`temporal worker deployment
set-current-version`, ramp en pourcentage) ; le **workflow** déclare dans son code comment les
exécutions en vol réagissent (behavior Pinned/Auto-Upgrade). Un workflow Pinned termine sa vie
sur sa version de départ ; l'ancienne version passe Draining → Drained avant que ses workers
puissent être éteints. Continue-as-New (nouveau Run Id, historique vierge) est la frontière qui
rend l'adoption sûre — supprimant la contrainte de replay — et la feature « Upgrade on
Continue-as-New » (Public Preview) en fait un point d'adoption opt-in. Auto-Upgrade est
possible mais au prix du patching manuel, sous peine d'exception de non-déterminisme.

**Limites.** Le lien patching↔auto-upgrade est établi par la page Worker Versioning, pas par la
page Patching ; l'historique « Public Preview depuis server v1.28.0 » vient de résultats de
recherche non vérifiés par fetch direct.

---

## 2. Restate — versioning des services et des agents

**Métadonnées vérifiées.** Doc officielle « Versioning »
(<https://docs.restate.dev/services/versioning>, servie aussi sous
`/operate/versioning/`, sans date affichée). Blog Restate : *Updating AI Agents safely in
production*, Giselle van Dongen & Francesco Guardiani, 2026-03-11
(<https://www.restate.dev/blog/dealing-with-versioning-in-long-running-agents>) ; *Solving
durable execution's immutability problem*, Jack Kleeman, 2024-02-02
(<https://www.restate.dev/blog/solving-durable-executions-immutability-problem>) — ce dernier
à traiter comme document de genèse, pas comme état de l'art.

**Citations verbatim.**

- « When you deploy a version of your code, you give it an immutable, unique endpoint and
  register it with Restate. » — doc Versioning, intro.
- « Restate automatically routes new requests to the latest deployment. Existing requests
  continue on the original deployment. » — doc Versioning, § Manual versioning.
- « Every deployment is a complete, versioned snapshot of the agent: code, prompts, tool
  definitions, schemas, guardrails, and model configuration. Once deployed, it never changes.
  New versions are deployed alongside old ones, not on top of them. » — blog agents,
  § Two rules for safe agent versioning. *(contre-vérifiée par grep source)*
- « Every agent execution continues on the same version it started with. Every retry,
  resumption, and callback returns to that same version, while new requests route to the
  latest version. » — ibid.
- « Tool removals: the history references tool calls that no longer exist and the agent will
  likely ignore them or hallucinate about their meaning » — blog agents, § The danger of
  swapping out code from under an agent.
- « the code executing a given request must never change in its behaviour, despite the
  potential for requests to be replayed long after they started. » — blog Kleeman,
  § The immutability problem.
- « If something about the execution environment has changed in a way that conflicts with the
  journal, the mismatch will be detected during replay and will cause the execution to fail
  loudly. » — blog agents, § Failing loudly on mismatches.
- « Because executions are pinned to deployments, every trace is also tied to a specific
  version of the agent. » — blog agents, § Knowing what's running and where.
- « Once all invocations are complete, you can safely remove the old deployment via the UI or
  CLI. » — doc Versioning, § Manual versioning.
- « The fix must be compatible with already-executed journal entries so they can replay
  successfully. » — doc Versioning, § Pause invocations and resume on a new deployment.

**Lecture à travers la grille.** L'invocation en vol n'est *jamais* migrée d'office : elle
reste épinglée à son déploiement d'origine (retries, reprises et callbacks compris) ; seules
les nouvelles requêtes partent sur la nouvelle version. La « version » d'un agent dépasse le
code : prompts, définitions d'outils, schémas, guardrails, config modèle — parce que ces
éléments sont le manuel avec lequel le LLM interprète son propre historique ; en changer un en
vol ne fait pas crasher, ça corrompt silencieusement les décisions. La réparation d'une vieille
version bloquée est un acte explicite d'opérateur (pause → resume sur un déploiement corrigé),
sous contrainte de compatibilité de journal. Sur Kubernetes, l'operator automatise le cycle :
routage des nouvelles requêtes, drainage, puis scale-to-zero des vieilles versions.

**Limites.** Le pinning des prompts/tool-defs est vrai *par construction* (ils vivent dans
l'artefact déployé) — le billet ne décrit pas de registre de prompts séparé ; pas de
« journal rewriting » ; durée de coexistence des versions non chiffrée.

---

## 3. Kubernetes — cordon/drain + PodDisruptionBudget

**Métadonnées vérifiées.** Pages kubernetes.io : « Safely Drain a Node »
(<https://kubernetes.io/docs/tasks/administer-cluster/safely-drain-node/>), « Disruptions »
(<https://kubernetes.io/docs/concepts/workloads/pods/disruptions/> — sections tronquées au
fetch HTML récupérées depuis la source markdown canonique du repo kubernetes/website),
« Specifying a Disruption Budget for your Application »
(<https://kubernetes.io/docs/tasks/run-application/configure-pdb/>), références
« kubectl drain » et « kubectl cordon ».

**Citations verbatim.**

- « Safe evictions allow the pod's containers to gracefully terminate and will respect the
  PodDisruptionBudgets you have specified. » — Safely Drain a Node.
- « As an application owner, you can create a PodDisruptionBudget (PDB) for each application.
  A PDB limits the number of Pods of a replicated application that are down simultaneously
  from voluntary disruptions. » — Disruptions, § Pod disruption budgets.
- « Involuntary disruptions cannot be prevented by PDBs; however they do count against the
  budget. » — ibid.
- « The eviction request that kubectl submits on your behalf may be temporarily rejected, so
  the tool periodically retries all failed requests until all Pods on the target node are
  terminated, or until a configurable timeout is reached. » — ibid.
- « At this point, if an impatient cluster administrator tries to drain node-2 or node-3, the
  drain command will block, because there are only 2 available pods for the deployment, and
  its PDB requires at least 2. » — Disruptions, § PodDisruptionBudget example.
- « Pod Disruption Budgets support this separation of roles by providing an interface between
  the roles. » — Disruptions, § Separating Cluster Owner and Application Owner Roles.
  *(contre-vérifiée par grep source)*
- « If you try to drain a Node where an unevictable Pod is running, the drain never
  completes. » — configure-pdb.
- Flag `--disable-eviction` : « Force drain to use delete, even if eviction is supported. This
  will bypass checking PodDisruptionBudgets, use with caution. » — référence kubectl drain.

**Lecture à travers la grille.** Le rôle est scindé en deux, et la doc le dit explicitement :
l'opérateur (Cluster Manager) décide *quoi* — vider tel nœud pour un upgrade de kernel — mais
c'est le propriétaire de l'application qui a déclaré *à quel rythme* c'est tolérable, via le
PDB. L'éviction qui violerait le budget n'est ni forcée ni mise en file : elle est **refusée**,
et `kubectl drain` réessaie périodiquement jusqu'à ce que l'application ait reconstitué ses
réplicas ailleurs. L'upgrade de cluster avance donc nœud par nœud, chaque étape gated par la
disponibilité que les charges ont elles-mêmes déclarée — c'est ce qui permet d'automatiser
l'administration sans qu'elle aille trop vite. Le contournement (`--disable-eviction`) existe,
mais comme acte explicite et documenté « use with caution ».

**Limites.** Les sections manquantes du fetch HTML viennent de la branche `main` du repo
kubernetes/website (version dev de la page publiée) ; dates de dernière modification des pages
non vérifiées.

---

## 4. Migrations de schéma online — gh-ost et pt-online-schema-change

**Métadonnées vérifiées.** gh-ost (GitHub, MIT) : README + `doc/cut-over.md` +
`doc/command-line-flags.md` + `doc/interactive-commands.md`, lus en texte brut sur
`raw.githubusercontent.com/github/gh-ost/master/` (branche `master`, contenu au 2026-07-13).
pt-online-schema-change : doc Percona Toolkit
(<https://docs.percona.com/percona-toolkit/pt-online-schema-change.html>, © 2011-2026 Percona
LLC, version d'outil non affichée).

**Citations verbatim.**

- « `gh-ost` is a triggerless online schema migration solution for MySQL. It is testable and
  provides pausability, dynamic control/reconfiguration, auditing, and many operational
  perks. » — README, intro.
- « Instead, `gh-ost` uses the binary log stream to capture table changes, and asynchronously
  applies them onto the _ghost_ table. » — README, § How?.
- « Control over cut-over phase: `gh-ost` can be instructed to postpone what is probably the
  most critical step: the swap of tables, until such time that you're comfortably available.
  No need to worry about ETA being outside office hours. » — README, § Highlights.
- « `gh-ost` solves this by using an atomic, two-step blocking swap: while one connection
  holds the lock, another attempts the atomic `RENAME`. The `RENAME` is guaranteed to not be
  executed prematurely by positioning a sentry table which blocks the `RENAME` operation until
  `gh-ost` is satisfied all is in order. » — doc/cut-over.md.
- « Indicate a file name, such that the final cut-over step does not take place as long as the
  file exists. […] With this flag set, the migration will cut-over upon deletion of the file
  or upon `cut-over` interactive command. » — doc/command-line-flags.md,
  § postpone-cut-over-flag-file. *(contre-vérifiée par grep source)*
- « `unpostpone`: at a time where `gh-ost` is postponing the cut-over phase, instruct `gh-ost`
  to stop postponing and proceed immediately to cut-over. » — doc/interactive-commands.md.
- « If the row copy is complete and the heartbeat lag is less than `max-lag-millis` cutover
  phase of the migration will start. » — doc/command-line-flags.md, § max-lag-millis.
- « True pause: when `gh-ost` throttles, it truly ceases writes on master: no row copies and
  no ongoing events processing. » — README, § Highlights.
- pt-osc : « pt-online-schema-change works by creating an empty copy of the table to alter,
  modifying it as desired, and then copying rows from the original table into the new table. »
  et « it uses an atomic RENAME TABLE operation to simultaneously rename the original and new
  tables » — doc Percona, § DESCRIPTION.
- pt-osc : « Examine SHOW GLOBAL STATUS after every chunk, and pause if any status variables
  are higher than their thresholds. » (`--max-load`) ; « Execution will be paused while the
  file specified by this param exists. » (`--pause-file`) — doc Percona.

**Lecture à travers la grille.** Même patron des deux côtés : table fantôme, backfill par
chunks, propagation continue des écritures (triggers chez pt-osc, binlog chez gh-ost), puis
substitution atomique. La leçon est dans le cut-over de gh-ost : la bascule est
quasi-instantanée mais **différable** (`--postpone-cut-over-flag-file`), et la décision est
**partagée en deux moitiés qui ne se confondent pas** — l'outil établit que c'est *prêt*
(row-copy terminé, lag sous seuil, sentry table qui bloque le RENAME « until gh-ost is
satisfied all is in order »), l'humain déclenche le *moment* (`unpostpone`, suppression du flag
file). L'outil dit « c'est sûr », l'humain dit « maintenant ». Et pendant toute la copie,
l'outil s'efface devant la charge réelle (throttling sur seuils, « true pause »).

**Limites.** Docs gh-ost lues sur `master` (vivantes, pas un tag de release) ; pt-osc n'a pas
d'équivalent strict du postpone-cut-over (son `--pause-file` suspend l'exécution en général,
pas spécifiquement le swap final) ; version exacte de Percona Toolkit non affichée.

---

## 5. Erlang/OTP — hot code swapping (le contre-exemple)

**Métadonnées vérifiées.** Doc officielle erlang.org, version OTP 29.0.3 au moment du fetch :
« Compilation and Code Loading » (<https://www.erlang.org/doc/system/code_loading.html>),
« Release Handling » (<https://www.erlang.org/doc/system/release_handling.html>), « Appup
Cookbook » (<https://www.erlang.org/doc/system/appup_cookbook.html>), « gen_server behaviour »
(<https://www.erlang.org/doc/apps/stdlib/gen_server.html>, stdlib v8.0.2).

**Citations verbatim.**

- « The code of a module can exist in two variants in a system: _current_ and _old_. » —
  code_loading, § Code Replacement.
- « Both old and current code are valid, and can be evaluated concurrently. » — ibid.
- « Old code can still be evaluated because of processes lingering in the old code. » — ibid.
- « If a third instance of the module is loaded, the code server removes (purges) the old code
  and any processes lingering in it are terminated. » — ibid.
- « To change from old code to current code, a process must make a fully qualified function
  call. » — ibid.
- « The release handler suspends, asks for code change, and resumes processes by calling the
  functions `sys:suspend/1,2`, `sys:change_code/4,5`, and `sys:resume/1,2`, respectively. » —
  release_handling, § update.
- « The process must explicitly transform its state using the callback function
  `code_change/3` before switching to the new version of the callback module. Thus,
  synchronized code replacement is used. » — appup_cookbook, § Changing Internal State.
  *(contre-vérifiée par grep source)*
- « This function is called by a `gen_server` process when it is to update its internal state
  during a release upgrade/downgrade » — gen_server, callback code_change/3.
- « If the function returns `{error,Reason}`, the ongoing upgrade fails and rolls back to the
  old release. » — ibid.
- « If a release upgrade/downgrade with `Change = {advanced, Extra}` specified in the
  [`.appup`] file is made when [`Module:code_change/3`] is not implemented, the callback call
  will crash with an `undef` error reason. » — gen_server, note du callback code_change/3.

**Lecture à travers la grille.** Le champion de la migration à chaud confirme la règle au lieu
de l'infirmer. Erlang tient deux versions d'un module simultanément (current/old) et laisse
les process « traîner » dans l'ancienne — mais lors d'un vrai upgrade d'état, c'est **le
process lui-même qui convertit son propre état**, via `code_change/3`, pendant que le release
handler orchestre suspend → change_code → resume. Le savoir de migration vit dans le
travailleur : personne d'autre ne sait transformer son état. Et le prix est réel (la doc est
descriptive, elle ne l'éditorialise pas — c'est l'assemblage des exigences qui le constitue) :
écrire les fonctions de conversion dans les deux sens (upgrade et downgrade), maintenir les
fichiers `.appup`, respecter l'ordre des instructions ; l'oubli crashe (`undef`), l'échec de
conversion fait rollback de tout l'upgrade, et le process trop lent à basculer est tué à la
purge de la 3e génération.

**Limites.** Doc servie en version courante (29.0.3) ; la page `sys` (détail de
`sys:change_code/4,5`) n'a pas été lue ; aucune page ne formule le « coût » — ne pas attribuer
à la doc une éditorialisation qu'elle n'emploie pas.

---

## 6. Blue-green / canary — déployer sans couper le trafic

**Métadonnées vérifiées.** « Blue Green Deployment », **Martin Fowler**, 1er mars 2010
(<https://martinfowler.com/bliki/BlueGreenDeployment.html>) — origine du nom, verbatim de la
page : « Some foggy combination of Daniel Terhorst-North and Jez Humble came up with the
name. » « Canary Release », **Danilo Sato** (pas Fowler — hébergé sur martinfowler.com),
25 juin 2014 (<https://martinfowler.com/bliki/CanaryRelease.html>). Complément mineur :
continuousdelivery.com/implementing/patterns/ (Jez Humble), une seule phrase utile.

**Citations verbatim.**

- « One of the challenges with automating deployment is the cut-over itself, taking software
  from the final stage of testing to live production. » — BlueGreenDeployment, ouverture.
- « The blue-green deployment approach does this by ensuring you have two production
  environments, as identical as possible. » — ibid.
- « Once the software is working in the green environment, you switch the router so that all
  incoming requests go to the green environment - the blue one is now idle. » — ibid.
  *(contre-vérifiée par grep source)*
- « Blue-green deployment also gives you a rapid way to rollback - if anything goes wrong you
  switch the router back to your blue environment. » — ibid.
- « There's still the issue of dealing with missed transactions while the green environment
  was live » — ibid., § rollback.
- « Or you may be able to put the application in read-only mode before cut-over, run it for a
  while in read-only mode, and then switch it to read-write mode. » — ibid.
- « Canary release is a technique to reduce the risk of introducing a new software version in
  production by slowly rolling out the change to a small subset of users before rolling it out
  to the entire infrastructure and making it available to everybody. » — CanaryRelease,
  définition.
- « As you gain more confidence in the new version, you can start releasing it to more servers
  in your infrastructure and routing more users to it. » — ibid.
- « One drawback of using canary releases is that you have to manage multiple versions of your
  software at once. » — ibid.

**Lecture à travers la grille.** La bascule blue-green porte sur le **routage des requêtes
entrantes** — le flux futur — jamais sur le travail en cours. Fowler ne traite le travail en
vol que par ses effets sur les données : « missed transactions », double alimentation des deux
environnements, ou mode read-only avant bascule (suspendre les écritures plutôt que migrer
quoi que ce soit). Le canary est le même geste fractionné et observé : l'élargissement est
décidé par l'opérateur, autorisé par les métriques. L'unité de travail implicite des deux
patterns est la requête courte et routable — ⚠️ **extrapolation de lecture, pas citation** :
aucun des deux textes n'envisage un travail qui durerait des heures ; si c'était le cas, la
bascule au routeur ne suffirait plus (drain de plusieurs heures, ou travail en vol perdu).

**Limites.** L'absence de mention du draining/sessions longues a été vérifiée explicitement
dans l'extraction (réponse « not present »), pas seulement non observée ; l'attribution du nom
blue-green à Terhorst-North/Humble vient de la page Fowler elle-même.

---

## 7. Synthèse transverse — ce que la grille révèle

| Système | Unité de travail en vol | Qui sait que la bascule est possible | La fenêtre |
|---|---|---|---|
| Temporal | workflow (jours/mois) | le **workflow** déclare son behavior (Pinned) dans son code | Continue-as-New, adoption opt-in à la frontière |
| Restate | invocation durable (agent) | la **plateforme** épingle par construction ; personne ne migre en vol | fin d'invocation ; pause→resume explicite sinon |
| Kubernetes | pods répliqués | la **charge** déclare son budget de disruption (PDB) | quand le budget le permet — le drain attend |
| gh-ost / pt-osc | la table sous trafic | l'**outil** déclare « prêt » (sync + lag), l'humain déclenche | le cut-over, différable (postpone/unpostpone) |
| Erlang/OTP | le process avec état | le **process** migre son propre état (`code_change/3`) | suspend → change_code → resume |
| Blue-green / canary | la requête courte | l'**opérateur**, autorisé par les métriques | la bascule au routeur — ne couvre pas le travail long |

Convergence : partout où le travail en vol est **long et porteur d'état**, le savoir « quand
peut-on basculer » vit **du côté du travail** (le workflow qui déclare Pinned, la charge qui
déclare son PDB, l'outil de migration qui déclare l'état de synchronisation, le process Erlang
qui convertit son propre état) — et l'opérateur ne garde que le choix du *moment* parmi les
moments éligibles. Le seul pattern où l'opérateur décide seul (blue-green/canary) est aussi le
seul où le travail en vol est court et jetable. Le contre-exemple Erlang confirme la règle :
même la migration à chaud « par design » exige que le travailleur sache transformer son propre
état — et son prix documenté est précisément ce que D1 (capture 2026-07-13) refuse de payer.

## 8. Méthode de vérification

6 lectures parallèles de première main (agents avec consigne « ne citer que le contenu fetché,
jamais la mémoire » ; l'agent gh-ost a re-téléchargé les sources en texte brut via curl avec
numéros de ligne), puis contre-vérification indépendante par le superviseur de session de
6 citations porteuses (une par source) par grep sur la source brute : 6/6 verbatim — deux
avaient initialement échoué au grep à cause de retours à la ligne dans la source, confirmées
après normalisation des espaces. Réserve générale : l'extraction WebFetch fait transiter le
contenu par un modèle ; les citations destinées à être imprimées telles quelles méritent une
relecture directe de la source au moment de la publication externe (différée).
