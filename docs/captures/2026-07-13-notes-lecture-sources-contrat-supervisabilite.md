# Notes de lecture première main — sources du contrat de supervisabilité (2026-07-13)

Statut : phase 1 de la fiche [0025](../../features/done/0025-article-contrat-supervisabilite.md).
Lecture de première main des 4 sources les plus proches du
[balayage prior-art](./2026-07-13-prior-art-contrat-supervisabilite.md) + contrôle des 2
affirmations tierces. Toutes les citations ci-dessous ont été vérifiées dans le contenu
réellement téléchargé (spec, HTML arXiv, proto) — pas de mémoire de modèle, pas de source
secondaire non recoupée. Les corrections induites ont été appliquées au doc prior-art
(voir §7).

---

## 1. Rel(AI)Build — arXiv 2606.26924

**Métadonnées vérifiées.** Titre exact : *A Deterministic Control Plane for LLM Coding
Agents*. Auteur unique : Padmaraj Madatha (Happiest Minds Technologies, AIP Centre of
Excellence). Préprint v1 du 25 juin 2026, cs.SE/cs.AI/cs.CR, 45 pages ; artefacts sur Zenodo
(DOI 10.5281/zenodo.20780913). « Rel(AI)Build » est le nom de l'implémentation de référence
(Node.js), pas du titre. Sources lues : [abs](https://arxiv.org/abs/2606.26924),
[HTML v1 intégral](https://arxiv.org/html/2606.26924v1).

**Point manqué par le balayage** : la moitié du papier est une **étude de prévalence**
(10 008 dépôts GitHub, 6 145 fichiers de config d'agents ; 10,1 % de configs dupliquées
SHA-256 exactes inter-dépôts) et un volet supply-chain (SBOM d'agents, lockfile HMAC). Le
lifecycle stage-gaté n'est qu'un mécanisme sur cinq.

**Vérification des affirmations du balayage :**

| Affirmation | Verdict | Preuve (verbatim) |
|---|---|---|
| Phases stage-gatées, progression refusée par défaut, receipts nommés | ✅ confirmée (nuance de vocabulaire) | « a deterministic state machine enforces invariants and blocks on violation » (§4.5) ; « Ending a phase can require named receipts (DELEGATION GATE FAILURE), preventing an orchestrator from silently bypassing specialist delegation » (§4.5). ⚠️ le papier réserve « fail-closed » aux permissions/install (§4.2), pas aux gates de phase |
| Au-dessus de harnesses non modifiés (Cursor, Claude Code) | ✅ confirmée | « We propose a deterministic control plane above the harness (not replacing it) » (abstract) ; « the harness and model are unmodified » (Fig. 2). 7 cibles IDE, via hooks natifs (PreToolUse, beforeShellExecution) ; §4.6 admet que 4/7 cibles « have little or no runtime permission enforcement » |
| Cap d'itérations puis escalade HITL | ✅ confirmée | « a hard 3-iteration cap on auto-fix loops » ; « capped at three iterations before escalating to a human » (§4.5) ; cap par entrée de phase, configurable `PACK_MAX_ITERATIONS` (1–5) ; 4 gates HITL (spec, design, pre-release, merge) |
| Audit log hash-chaîné | ✅ confirmée | « Append-only, hash-chained audit log … each line carrying a SHA-256 hash of its own content » (§4.1). Limite admise (§8) : clé HMAC locale — « any process running as the same user can read the key and forge a valid stamp » |
| Revendiqué neutre scrum/kanban | ❌ **FAUSSE** | « scrum », « kanban », « agile » : zéro occurrence dans le papier. Son « tool-agnostic » = agnostique au *harness*, pas à la méthode ; le lifecycle « maps Cooper's stage-gate model [Cooper, 1990] onto software-engineering artifact boundaries » (§4.5). → corrigé dans le prior-art |
| 8 phases imposées, pas de method port | ✅ confirmée (précision) | « Because these checks are hard-coded in the control plane, they cannot be bypassed via persuasive LLM prompting » (§4.5) ; aucune déclaration de phases par la méthode. ⚠️ précision : « eight-phase decomposition » mais 7 phases actives {0,1,3,4,5,7,8} + 2 slots réservés — incohérence interne du papier |
| Pas de budget tokens / pas de schéma d'événements versionné / escalades non typées / migration effleurée | ✅ confirmée (nuance) | zéro occurrence de « budget » ; log JSONL `{timestamp, action, user, cwd, details}` sans version ; nuance : des **codes d'échec de gate nommés** existent (PHASE ORDER VIOLATION, HITL_REJECTED…) mais pas de taxonomie d'*escalade* (une seule destination : pause + humain + même log) ; côté version, seul geste : slots de phase réservés « without renumbering deployed systems » |

**Citations retenues pour l'article :**
- « A non-deterministic component cannot serve as a trustworthy control for another
  non-deterministic component. » (§1.2, la phrase-thèse)
- « relying on that agent to faithfully call trace-update is an honor-system component inside
  an otherwise deterministic control plane. » (§4.5, trust boundary)

**Lecture critique.** Travail d'abord centré gouvernance de la *configuration* (supply chain
des définitions d'agents, permissions pre-execution, portage multi-IDE), validé par tests de
conformance sur violations injectées (« they carry no information about field effectiveness
or developer outcomes », §6.2 — honnêteté remarquable). Processus fixe hérité de Cooper, pas
de méthode pluggable, pas de budget, pas de concurrence multi-runs.

---

## 2. Agent Protocol (LangChain) + LangGraph interrupt + Agent Inbox

**Métadonnées vérifiées.** Repo [langchain-ai/agent-protocol](https://github.com/langchain-ai/agent-protocol)
(MIT, 634 ⭐, dernier push 2026-06-18, releases PyPI `langchain-protocol` jusqu'à 0.0.18 du
2026-06-18 — projet actif, cadence ~mensuelle). Structure : `openapi.json` (spec REST),
`streaming/protocol.cddl` (1262 lignes) + bindings TS/Py générés. Doc interrupt canonique :
[docs.langchain.com/oss/python/langgraph/interrupts](https://docs.langchain.com/oss/python/langgraph/interrupts).
[Agent Inbox](https://github.com/langchain-ai/agent-inbox) : 1030 ⭐, maintenance passive
(derniers commits = dependabot). ⚠️ Trois numéros de version coexistent : OpenAPI `0.1.6`,
CDDL `Status: DRAFT / Version: 0.0.13` (jamais bumpé depuis le commit initial du 2026-04-28),
paquet `0.0.18`.

**Vérification des affirmations du balayage :**

| Affirmation | Verdict | Preuve (verbatim) |
|---|---|---|
| `interrupt()` = stop indéfini persisté, reprise uniquement externe | ✅ confirmée | « When an interrupt is triggered, LangGraph saves the graph state using its persistence layer and waits indefinitely until you resume execution. » (doc interrupts, intro) ; reprise par `Command(resume=...)`. ⚠️ nuance : « the runtime restarts the entire node from the beginning—it does not resume from the exact line where interrupt was called » — reprise par re-exécution idempotente, pas par continuation |
| Spec « CDDL versionnée » | ⚠️ **NUANCÉE** | le cœur du protocole est **OpenAPI** (« the OpenAPI spec in the `openapi.json` file … is the single source of truth for the protocol », CONTRIBUTING.md) ; le CDDL ne couvre que le sous-protocole *streaming*, s'intitule « LangGraph Agent Streaming Protocol », est marqué DRAFT et son champ Version n'est pas maintenu. Pas de politique formelle de breaking change (« Consumers should ignore unknown fields … instead of failing closed », streaming/README) → corrigé dans le prior-art |
| Événements `lifecycle.interrupted`, `input.requested/respond` | ⚠️ **NUANCÉE** | `input.requested` : **exact** (CDDL l.1045-1058, avec `interruptId` corrélant `input.respond`) ; `lifecycle.interrupted` : **n'existe pas sous ce nom** — événement `method: "lifecycle"` portant `event: "interrupted"` (une valeur d'`AgentStatus`) → corrigé dans le prior-art |
| Agent Inbox = superviseur aveugle au graphe sur schéma d'interrupt typé | ✅ confirmée (schéma exact) | schéma `HumanInterrupt { action_request: ActionRequest; config: HumanInterruptConfig }`, réponse `HumanResponse = { type: "accept" \| "ignore" \| "response" \| "edit" }` (README agent-inbox). Aveugle aux internes du graphe, mais couplé à un déploiement LangGraph |
| `UsageInfo` tokens récemment entré | ✅ confirmée (précision) | `MessageFinishData = { event: "message-finish", ? usage: UsageInfo }` (CDDL l.855-890) ; présent dès le commit initial du CDDL (2026-04-28), breakdowns détaillés le 2026-06-12. Zéro occurrence de « usage » dans l'OpenAPI REST — tokens uniquement côté streaming, par message, optionnel |
| Fail-safe opt-in (sans `interrupt()`, le graphe court jusqu'au bout) | ✅ confirmée (implicite) | tout le mécanisme est déclenché par l'appel explicite (« Interrupts work by calling the `interrupt()` function at any point in your graph nodes ») ; aucun arrêt par défaut nulle part ; chemin nominal du README : `pending → success` sans approbation |
| Pas d'escalade typée / reprise après changement de code indéfinie / pas de budget-kill / mono-vendeur | ✅ 3 confirmées + 1 nuancée | un seul canal `"input"`, payload « Opaque interrupt value from runtime; application-defined shape » ; zéro hit sur `escalat\|severity` ; reprise : « Matching is strictly index-based » + interdiction de réordonner — pas de migration de graphe ; ⚠️ **kill existe côté REST** : `POST /runs/{run_id}/cancel` (`action ∈ {interrupt, rollback}`) — mais rien côté streaming et zéro budget ; gouvernance : org langchain-ai, pas de fondation (« LangGraph Platform implements a superset of this protocol ») → nuance kill corrigée dans le prior-art |

**Citations retenues pour l'article :** « …waits indefinitely until you resume execution. »
(doc interrupts) ; « payload: any ; Opaque interrupt value from runtime; application-defined
shape » (CDDL).

**Lecture critique.** Le CDDL s'auto-intitule « LangGraph Agent Streaming Protocol » et
documente qu'il « wraps LangGraph's interrupt() » — la prétention framework-agnostic du README
est en tension avec un modèle sémantique calqué sur le runtime LangGraph. Versionnement
immature (DRAFT, 0.x, trois numéros divergents). Le vide reste net : un canal d'interrupt
opaque unique, pas de taxonomie d'escalade, pas de contrat budget, reprise par rejeu
index-based fragile au moindre changement de code.

---

## 3. A2A v1.0 (Linux Foundation)

**Métadonnées vérifiées.** Release `v1.0.0` du **2026-03-12** ; version courante `v1.0.1`
(2026-05-28, patch sans impact protocolaire). Projet open source **Linux Foundation**,
« contributed by Google » (repo créé 2025-03-25, Apache 2.0) ; TSC avec AWS, Cisco, Google,
IBM Research, Microsoft, Salesforce, SAP, ServiceNow. Le fichier `spec/a2a.proto` est « the
single authoritative normative definition » (§1.4). Sources lues :
[spec](https://a2a-protocol.org/latest/specification/),
[a2a.proto](https://raw.githubusercontent.com/a2aproject/A2A/main/specification/a2a.proto),
[topics/extensions](https://a2a-protocol.org/latest/topics/extensions/),
[releases](https://github.com/a2aproject/A2A/releases).

**Vérification des affirmations du balayage :**

| Affirmation | Verdict | Preuve (verbatim) |
|---|---|---|
| Header `A2A-Version`, URIs d'extension versionnées, breaking ⇒ nouvelle URI | ✅ confirmée (précision) | « Header field name: A2A-Version » (§14.2.1) ; « Clients MUST send the `A2A-Version` header with each request » (§3.6.1) ; « A new URI **MUST** be created for breaking changes to an extension » (§4.6.3). ⚠️ la version *dans* l'URI est SHOULD, la nouvelle-URI-sur-breaking est MUST — ne pas présenter les deux comme MUST |
| Lifecycle de task typé + événements ordonnés | ✅ confirmée | enum `TaskState`, 9 valeurs (`SUBMITTED`, `WORKING`, `COMPLETED`, `FAILED`, `CANCELED`, `INPUT_REQUIRED`, `REJECTED`, `AUTH_REQUIRED`…) ; `TaskStatusUpdateEvent` / `TaskArtifactUpdateEvent` (§4.2) ; « All implementations MUST deliver events in the order they were generated. Events MUST NOT be reordered during transmission, regardless of protocol binding. » (§3.5). ⚠️ v1.0 = `TASK_STATE_*` en SCREAMING_SNAKE_CASE ; `input-required` en kebab-case = nomenclature v0.x |
| Agents opaques | ✅ confirmée | « Opaque Execution: Agents collaborate based on declared capabilities and exchanged information, without needing to share their internal thoughts, plans, or tool implementations. » (§1.2) |
| Extensions `required: true` | ✅ confirmée | champ `required` sur `AgentExtension` ; « If true, the client must understand and comply with the extension's requirements. » (proto) ; erreur dédiée `ExtensionSupportRequiredError` (§3.3.2) — refuser l'extension = renoncer au service |
| Polarité : l'agent décide de s'arrêter ; filer jusqu'à `completed` est conforme | ✅ confirmée | « **Agents can request additional input** mid-processing by transitioning a task to the `input-required` state » (§6.3) ; « Indicates that **the agent requires** additional user input » (proto) ; aucune obligation d'arrêt dans le texte normatif ; l'approbation humaine n'apparaît qu'en exemple facultatif (§7.6, « an agent **may** require authorization ») |
| Agent Card = skills, pas gates | ✅ confirmée | « Skills represent the abilities of an agent. It is largely a descriptive concept » (proto, `AgentCard`) ; aucune notion d'étape, gate, ordre ou workflow |
| Un seul canal d'interruption, pas de taxonomie, rien sur l'adoption de version | ⚠️ **NUANCÉE** | il y a **deux** états d'interruption typés : `INPUT_REQUIRED` **et** `AUTH_REQUIRED` (§3.1.1) ; §7.6 « In-Task Authorization » couvre l'escalade d'autorisation, chaînable (« This enables forming a chain of Tasks in TASK_STATE_AUTH_REQUIRED », §7.6.2). Reste exact : aucune occurrence de « budget », « escalat* », rien sur la version d'un *process* en cours de run (seul le *protocole* est négocié par requête). → nuance reportée dans le prior-art |

**Citations retenues pour l'article :** « Opaque Execution … » (§1.2) ; « A new URI MUST be
created for breaking changes to an extension. » (§4.6.3).

**Lecture critique.** A2A v1.0 normalise rigoureusement le *transport* de la supervision
(états interrompus typés, événements strictement ordonnés, extensions négociées avec erreur
dédiée) mais laisse la *politique* hors périmètre : c'est l'agent qui décide de s'interrompre,
rien n'oblige jamais un arrêt. Le couple `required: true` + nouvelle-URI-par-breaking est
exactement le point d'ancrage où un profil « supervisabilité » tiers peut se greffer. §7.6
(auth chaînable) est le prior art le plus proche de notre escalade — limité à l'authz.

---

## 4. Faramesh — arXiv 2601.17744

**Métadonnées vérifiées.** Titre exact : *Faramesh: A Protocol-Agnostic Execution Control
Plane for Autonomous Agent Systems*. Auteur unique : Amjad Fatmi (« The Faramesh Labs, New
York, USA » — travail indépendant sans financement institutionnel, Faramesh = l'implémentation
de référence de l'auteur). Preprint v1 du **25 janvier 2026**, cs.AI/cs.CR/cs.DC, 40 pages,
non peer-reviewed. L'ID du balayage est correct. Sources lues :
[abs](https://arxiv.org/abs/2601.17744), HTML v1 intégral.

**Vérification des affirmations du balayage :**

| Affirmation | Verdict | Preuve (verbatim) |
|---|---|---|
| Fail-safe / stop-par-défaut agnostique | ✅ confirmée | deny-by-default : « Exec(A) ⟺ B(A,P,S) = PERMIT. No action instance may produce an external effect unless this predicate holds. » (§5.1) ; fail-closed : « any failure in the authorization process results in denial or deferral of the proposed action » (§5) ; agnosticisme : « The AAB is non-bypassable by construction and is independent of agent framework, protocol, or model implementation. » (§5). Terminologie du papier : « fail-closed », pas « fail-safe » |
| Au grain ACTION, pas au grain étape-de-méthode | ✅ confirmée — et mieux : **anti-but revendiqué** | unité gouvernée = l'instance d'action canonicalisée (Actor, Target, Operation, Resource, Parameters, Blast Radius, Context — §6.3) ; le grain plan/étapes est **exclu par construction** : « Governing cognition would require either (i) admitting agent-internal state into the TCB or (ii) enforcing transactional control over reasoning steps, both of which violate the autonomy and composability assumptions » (§13.1, Non-Goal + Lemma 13.1) |
| Mécanisme | précisé | policy decision point + artefact de décision cryptographique validé par l'exécuteur (« Tool executors must reject any execution request lacking a valid PERMIT decision artifact », §8.7) ; **pas un proxy** (« the governor is not in the data plane », §8.8) ; 4 modes : Inline Blocking, Deferred Approval, Shadow Mode, Auto-Promotion (§5.6) ; provenance append-only hash-chaînée (§9) |
| Déclaration d'étapes / taxonomie d'escalade / adoption de version en cours de run | ✅ absents (confirmé) | escalade : « The AAB does not prescribe approval interfaces, escalation paths, or user experience. These concerns are orthogonal to enforcement semantics. » (§7.4) ; budget = prédicat de police par action (« rate limits, cumulative spend ceilings », §7.3), pas taxonomie d'escalade ; version de policy gelée par decision record pour l'audit (§7.6/9.2), rien sur l'adoption négociée d'une version de méthode en cours de run |

**Citations retenues pour l'article :**
- « Autonomous agents violate this assumption by collapsing proposal and execution into a
  single step. » (§1.1)
- « blocking may be optional, but decision capture is not. » (§11.3)

**Lecture critique.** L'anti-thèse exacte et complémentaire de la couche visée par cop1 : il
verrouille le *bas* (chaque action à effet de bord) et démontre formellement qu'il *refuse* de
monter au niveau plan/méthode. Le prior-art tient : même le papier le plus proche laisse
volontairement vacant le grain « étape de méthode / gate de workflow ». Réserve de poids :
preprint d'auteur unique affilié au produit décrit — à citer comme signal de tendance, pas
comme référence établie.

---

## 5. Affirmation tierce : Forrester, mars 2026

**Source retrouvée.** Blog public Forrester (pas un rapport payant) : *« Agent Control Planes
Still Need A Robust Standards Stack »*, **Leslie Joseph** (VP Principal Analyst), **20 mars
2026** —
[forrester.com/blogs/agent-control-planes-still-need-a-robust-standards-stack](https://www.forrester.com/blogs/agent-control-planes-still-need-a-robust-standards-stack/).
Contexte : Forrester a formalisé la catégorie « agent control plane » (3e plan de son
architecture agentique d'entreprise : **build / orchestrate / control**) et annoncé une
évaluation du marché.

**Verdict : AUTHENTIQUE** (formulation quasi exacte — « Don't Exist », pas « do not exist »).
Intitulé exact de section : **« Barrier 3: Cross-Plane Governance Schemas Don't Exist »**.
Verbatim d'ouverture : « Even if OpenTelemetry stabilizes its genAI conventions and the
industry converges on a portable agent identity standard, a third layer of standards remains
absent: the schemas that define how the build, orchestrate, and control planes exchange
governance-relevant information about agent state, policy, and lifecycle. »

**Correction appliquée au prior-art** : attribuer à Leslie Joseph, blog du 20 mars 2026
(public), citer l'intitulé exact.

---

## 6. Affirmation tierce : survey arXiv 2504.16736

**Métadonnées vérifiées.** *« A Survey of AI Agent Protocols »*, Yingxuan Yang et al.
(Shanghai Jiao Tong et al.), v1 23 avril 2025 → v3 21 juin 2025 —
[abs](https://arxiv.org/abs/2504.16736), [HTML v3](https://arxiv.org/html/2504.16736v3).

**Taxonomie exacte (§3, verbatim)** : « On the first dimension—object orientation—protocols
are divided into context-oriented and inter-agent types; on the second dimension—application
scenario—they are further categorized as general-purpose or domain-specific. » Grille 2×2 :
context-oriented (MCP, agents.json) × inter-agent (ANP, A2A, AITP, Agent Protocol, LOKA…),
general-purpose × domain-specific ; sous-catégorie « Human–Agent Interaction Protocols »
(§3.2.2.1).

**Verdict : CONFIRMÉ** — aucune catégorie « protocole superviseur↔méthode ». Recherche ciblée
dans le HTML v3 : zéro occurrence de « supervisor », « oversight », « gate », « control
plane ». Le plus proche : « A2A … supports long-running asynchronous workflows, including
scenarios involving multi-turn human-in-the-loop interactions » (§3.2.1) — HITL au niveau
tâche, pas gates de méthode.

**Nuance de cadrage honnête** (reportée au prior-art) : le survey se limite par construction
aux protocoles de *communication* ; l'absence de la catégorie y est réelle et vérifiée, mais
reflète aussi le périmètre du survey. L'argument tient : le concept n'apparaît pas dans la
première cartographie systématique du domaine.

---

## 7. Corrections appliquées au doc prior-art

Le verdict global du balayage **tient** après lecture de première main : chaque brique existe
isolément, la composition n'existe nulle part, et la polarité stop-par-défaut au grain méthode
n'est l'exigence contractuelle de personne. Corrections de détail appliquées :

1. **§1.1 LangGraph/Agent Protocol** — « spec CDDL versionnée » corrigé (cœur = OpenAPI ;
   CDDL = streaming seulement, DRAFT, version non maintenue) ; `lifecycle.interrupted` corrigé
   (événement `lifecycle` + statut `interrupted`) ; « pas de primitives budget/kill » nuancé
   (kill REST `POST /runs/{run_id}/cancel` existe ; budget : rien).
2. **§1.2 A2A** — « un seul canal d'interruption générique » corrigé : deux états
   d'interruption typés (`INPUT_REQUIRED`, `AUTH_REQUIRED`) + §7.6 In-Task Authorization
   chaînable — le prior art le plus proche de notre escalade d'autorité, limité à l'authz.
   Précision versioning : URI-versionnée = SHOULD, nouvelle-URI-sur-breaking = MUST.
3. **§1.3 Rel(AI)Build** — « revendiqué neutre scrum/kanban » **supprimé** (faux : zéro
   occurrence de ces mots ; le lifecycle est ancré Cooper stage-gate 1990 ; « tool-agnostic »
   = harness-agnostic) ; « fail-closed » re-attribué (permissions/install, pas gates de
   phase) ; « 8 phases » précisé (7 actives + 2 slots réservés).
4. **§2 validation tierce** — Forrester attribué précisément : blog public de Leslie Joseph,
   20 mars 2026, intitulé exact « Barrier 3: Cross-Plane Governance Schemas Don't Exist » ;
   survey 2504.16736 confirmé, avec la nuance de périmètre (survey limité aux protocoles de
   communication).
5. **Mentions** — Faramesh renforcé (grain action = anti-but prouvé, Lemma 13.1) + réserve
   de statut (preprint d'auteur unique affilié).

**Méthode de vérification.** 5 lectures parallèles de première main (agents avec consigne
« ne citer que le contenu fetché, jamais la mémoire »), puis contre-vérification indépendante
par le superviseur de session de 4 citations porteuses (Forrester Barrier 3, thèse
Rel(AI)Build, Opaque Execution A2A, wait-indefinitely LangGraph) — 4/4 verbatim, dont une
retrouvée par grep de la source markdown brute après un faux négatif du spot-check tronqué.
