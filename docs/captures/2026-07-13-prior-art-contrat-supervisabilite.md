# Prior art — Le « contrat de supervisabilité » existe-t-il déjà ? (balayage 2026-07-13)

Statut : résultat d'un balayage multi-agents (10 angles, 11 agents, ~817k tokens, recherche web).
Compagnon de [2026-07-13-contrat-methode-et-versions.md](./2026-07-13-contrat-methode-et-versions.md) (§5 Q2).
⚠️ Les références (arXiv, specs) viennent de recherches web agentiques : **avant d'écrire l'article,
lire de première main les 3-4 sources les plus proches** (Rel(AI)Build, Agent Protocol LangChain,
A2A v1.0, Faramesh).

Angles balayés : A2A (Google/LF) · LangGraph/Agent Protocol · AutoGen/CrewAI/OpenAI SDK ·
protocoles 2025-26 (ACP, AGNTCY, ANP, AG-UI) · exécution durable (Temporal/Restate/Inngest) ·
BPMN/Camunda external tasks · académique (FIPA, institutions électroniques, surveys) ·
observabilité (OTel GenAI) · produits (Devin, OpenHands, Claude Code, Cursor, Copilot) ·
recherche du concept exact.

Grille de comparaison = les 5 clauses du contrat (cf. capture §3) :
(a) déclaration d'étapes/gates par la méthode · (b) stop-par-défaut au gate, « continue » explicite
du superviseur · (c) schéma d'événements versionné · (d) escalade à deux étages (métier interne /
régalien remonté) · (e) adoption de version aux gates uniquement.

---

**Réponse globale : non.** Les 10 analyses convergent : chaque brique (a)-(e) existe isolément,
souvent dans des lignées disjointes, mais aucun standard, protocole, framework ou papier n'assemble
le contrat complet — et surtout, personne n'a la polarité fail-safe (b) comme exigence contractuelle
au grain « méthode ».

## 1. Classement des 5 plus proches voisins

**1. LangGraph Platform + Agent Protocol (LangChain) + Agent Inbox — ~6/10, le voisin industriel le plus proche.**
- ✅ (b) : sémantique exacte de `interrupt()` / `Command(resume=...)` — stop indéfini, reprise
  uniquement sur commande externe. ✅ (a) partiel : events `lifecycle.interrupted`,
  `input.requested/respond`, spec CDDL versionnée. ✅ Agent Inbox prouve qu'un superviseur-produit
  **aveugle au graphe** est viable dès qu'un schéma d'interrupt typé est imposé. ✅ `UsageInfo`
  tokens vient d'entrer dans le protocole.
- ❌ Fail-safe **opt-in** (un graphe sans interrupt court jusqu'au bout) ; ❌ (d) aucune taxonomie
  d'escalade — tout bulle dans le même canal ; ❌ (e) reprendre un thread après changement de code
  = comportement indéfini ; ❌ pas de primitives budget/kill contractuelles ; gouvernance mono-vendeur.

**2. A2A v1.0 (Linux Foundation) — ~4/10, mais le meilleur véhicule/substrat.**
- ✅ (c) : le versioning le plus propre du marché (header `A2A-Version`, URIs d'extension
  versionnées, breaking change ⇒ nouvelle URI). ✅ Lifecycle de task typé +
  `TaskStatusUpdateEvent`/`TaskArtifactUpdateEvent` ordonnés = le seam d'event-stream.
  ✅ Agents opaques = valide « superviseur aveugle au métier ». ✅ Mécanisme d'extensions
  (`required: true`) = la voie standard pour porter le contrat cop1 sans forker.
- ❌ (b) **polarité inverse** : c'est l'agent qui décide de passer en `input-required` ; un agent
  qui file jusqu'à `completed` ne viole pas la spec. ❌ (a) l'Agent Card déclare des *skills*,
  pas des *gates*. ❌ (d) un seul canal d'interruption générique. ❌ (e) absent.

**3. Papier Rel(AI)Build, « A Deterministic Control Plane for LLM Coding Agents » (arXiv 2606.26924, juin 2026) — ~5/10, le cousin conceptuel le plus proche.**
- ✅ (b) au bon grain : phases stage-gatées **fail-closed** (progression refusée par défaut,
  « receipts » nommés exigés), au-dessus de harnesses non modifiés (Cursor, Claude Code) ;
  cap d'itérations puis escalade HITL ; audit log hash-chaîné ; revendiqué neutre scrum/kanban.
- ❌ (a) inversé : les 8 phases sont **imposées par le control plane**, la méthode ne déclare pas
  les siennes (pas de Method port pluggable) ; ❌ pas de budget tokens, ❌ pas de schéma
  d'événements versionné, ❌ (d) tout finit dans le même log, ❌ (e) effleuré. C'est un papier,
  pas un standard.

**4. Temporal (Worker Versioning + Signals + Nexus) — ~4/10 global, mais (e) résolu à l'échelle.**
- ✅ (e) mot pour mot : workflows **Pinned** à leur version de départ, upgrade uniquement à
  Continue-as-New (frontière) ; Restate ajoute le détail à copier : le snapshot versionné inclut
  **prompts + tool-defs + config**, pas que le code. ✅ Signal/Update/Query = bon design du canal
  superviseur→run ; Nexus = précédent de contrat entre mondes isolés.
- ❌ Tout est au niveau *code d'orchestration dans le moteur*, pas contrat envers une méthode
  opaque ; (b) via signaux = opt-in ; couche 1 (durabilité), pas couche 2 (supervision method-blind).

**5. BPMN/Camunda external tasks (+ CMMN) — ~5/10, le squelette structurel historique.**
- ✅ (d) quasi-match : la dualité **BPMN error** (métier, traité dans le modèle) vs **incident**
  (opérationnel, remonte à l'humain, process gelé) est exactement la séparation à deux étages ;
  external task = exécution aveugle en pull avec lock/timeout. ✅ (e) par défaut : version binding
  (une instance finit sur sa version).
- ❌ Polarité inverse de (b) (le token avance par défaut) ; ❌ le moteur POSSÈDE le modèle —
  c'est l'anti-cop1 (chez cop1 la méthode s'auto-orchestre et n'expose que ses frontières) ;
  incidents non typés (pas de budget) ; pré-LLM.

*Mentions : MI9 (arXiv 2508.03858, gouvernance runtime mais posture détective/containment =
polarité inverse), institutions électroniques AMELI (2004, spec déclarée + middleware
domain-independent — le précédent intellectuel le plus profond pour l'aveuglement), AG-UI
(vocabulaire `STEP_*` versionné mais observationnel), Faramesh (arXiv 2601.17744, fail-safe
agnostique mais au grain action), OpenHands (confirmation-mode fail-safe au grain tool call),
Devin (budget `max_acu_limit` + `blocked` mais polarité inverse).*

## 2. Le gap — ce que personne ne couvre

**Le gap n'est pas « rien n'existe », c'est « la composition + trois inversions n'existent nulle part ».**

- **(c) est commoditisé (~70-90 %)** — versioning A2A, CloudEvents, AsyncAPI, OTel GenAI semconv.
  Zéro originalité à revendiquer : de l'hygiène, à réutiliser.
- **(a) partiel (~40-60 % en pièces)** : les events de fin d'étape existent (AG-UI, A2A artifacts,
  OTel) ; manque partout : la **déclaration a priori des gates par la méthode** comme manifeste
  machine-readable, et le **rapport structuré de gate comme unité contractuelle**.
- **(b) — LE trou, unanime sur les 10 analyses** : la mécanique stop/continue existe partout mais
  **toujours opt-in ou à l'initiative de l'agent**. Personne ne fait du stop-par-défaut une
  **exigence de conformité vérifiable** (gate franchi sans « continue » = violation détectable dans
  l'event-stream). C'est du default-deny appliqué au contrat de workflow — connu en sécurité,
  jamais standardisé ici.
- **(d) — quasi-vierge (~10-40 %)** : BPMN error-vs-incident est le seul précédent formel ; aucun
  standard agent ne type la frontière « le manager interne absorbe le métier, seul le régalien
  (budget/blocage/autorité) remonte ». Aucun événement `budget.*` standard n'existe nulle part.
- **(e) — vierge dans le monde agentique** : Temporal/Restate l'ont résolu pour du code de
  workflow ; personne ne l'a transposé en **clause de contrat** pour une méthode opaque.

Validation tierce : Forrester (mars 2026) écrit que les « cross-plane governance schemas »
n'existent pas ; le survey arXiv 2504.16736 n'a pas la catégorie « protocole superviseur↔méthode »
dans sa taxonomie.

**Nuance honnête : la fenêtre se referme.** Rel(AI)Build et Faramesh (janv./juin 2026) tournent
autour, le GenAI SIG d'OTel travaille sur tasks/teams/artifacts, la catégorie « agent control
plane » explose commercialement (Microsoft Agent 365, Forrester wave). Le versant *descriptif* du
contrat sera commoditisé ; seul le versant *prescriptif* (autorité) reste défendable.

## 3. Verdict article

**Oui, le créneau est libre — à condition de prendre le bon angle.**

- **Angle défendable** : *« Les control planes gardent les actions ; personne ne garde les
  méthodes. »* Tous les acteurs existants font du policy-sur-actions (allow/deny par tool call).
  Le contrat cop1 opère au grain **gate de méthode**, avec trois inventions nommables :
  (1) la polarité fail-safe contractuelle et *vérifiable*, (2) la taxonomie d'escalade à deux
  étages, (3) le pinning de méthode aux frontières de gate.
- **Angles déjà pris, à éviter** : « agent control plane » (surchargé), « supervised autonomy »,
  « execution contracts », gouvernance action-level, observabilité (OTel).
- **Posture technique crédibilisante** : présenter le contrat comme un **profil au-dessus de
  l'existant** — lifecycle/versioning à la A2A (voire extension A2A `required: true`), enveloppe
  CloudEvents, vocabulaire tokens OTel `gen_ai.*`, sémantique BPMN error/escalation pour (d),
  sémantique Temporal Pinned pour (e) — plutôt qu'un protocole ex nihilo. Lignée citable :
  CNP 1980 → FIPA-ACL → institutions électroniques (AMELI 2004) → BPM/XES → Temporal →
  A2A/MI9/Rel(AI)Build 2025-26.
- mega-city comme première implémentation de référence = exactement le format
  « spec + reference implementation » qui rend un tel article crédible.

## 4. Nommage (candidats)

1. **Supervisability Contract** (fr : *contrat de supervisabilité*) — sobre, dit exactement ce
   que c'est. Premier choix de la synthèse.
2. **Method Gate Protocol (MGP)** — met le grain (méthode) et le mécanisme (gate) dans le nom.
3. **HALT** — *Halt At gates, Loosen on Token* — nomme la polarité fail-safe, mémorable
   (« the HALT contract »).
4. **Contrat de pilotabilité** — version française directe, bonne pour les ADRs internes.
5. **Gate-Level Supervision Contract (GLSC)** — explicite le contraste avec le tool-level.
6. **Stop-Default Method Interface** — le plus littéral sur l'inversion de polarité ;
   sous-titre plutôt que nom.

## 5. Squelette v0 du contrat

```
MANIFESTE (déclaré par la méthode avant le run — inspiré Agent Card A2A + OASF)
  contract: "supervisability/v1"        # URI versionnée, breaking change ⇒ nouvelle URI
  method: {name, version}               # version PINNÉE pour tout le run (à la Temporal/Restate :
                                        #   inclut prompts + skills + rules, pas que le code)
  gates: [{id, after?, report_schema}]  # topologie minimale + schéma du rapport de chaque gate

ÉTATS DU RUN (machine à états possédée par le CONTROL PLANE, pas par la méthode)
  created → running → at_gate(gate_id) → running → … → completed | failed | killed

ÉVÉNEMENTS méthode → control plane (enveloppe CloudEvents, ordonnés, append-only)
  gate.reached {gate_id, report}        # OBLIGATOIRE ; la méthode S'ARRÊTE ici (fail-safe)
  escalation  {type: budget|blocked|authority, detail}   # seul le régalien traverse ;
                                        #   l'escalade métier reste interne (rôle manager)
  usage       {tokens_in/out}           # heartbeat périodique (vocabulaire OTel gen_ai.*)
  run.finished {status, final_report}

COMMANDES control plane → méthode (l'UNIQUE canal de progression — à la Temporal Signal)
  continue {gate_id, adopt_version?}    # absence de continue = la méthode reste arrêtée ;
                                        #   adopt_version : upgrade UNIQUEMENT ici (frontière de gate)
  abort    {reason}                     # kill-switch (budget, autorité)

INVARIANT VÉRIFIABLE : dans l'event-stream, toute activité après un gate.reached
sans continue correspondant = violation du contrat (détectable, auditable).
```

**Emprunts** : lifecycle + versioning A2A · external tasks Camunda (pull + aveuglement + dualité
error/incident pour (d)) · Temporal Signals + Pinned/Continue-as-New (canal de commande + (e)) ·
Restate (snapshot de version incluant prompts/skills) · LangGraph interrupt (sémantique du stop) ·
OTel GenAI (télémétrie tokens).
**Inventions cop1** : le stop-par-défaut comme invariant vérifiable, la partition régalien/métier
du canal d'escalade, `adopt_version` confiné au `continue`.

## Scores par angle (0-10 = à quel point l'existant couvre le concept complet)

| Angle | Score | Verdict en une ligne |
|---|---:|---|
| LangGraph/Agent Protocol | 6 | Voisin le plus proche ; fail-safe opt-in, pas d'escalade typée ni de migration aux gates |
| BPMN/Camunda | 5 | Squelette structurel (aveuglement, error/incident) mais polarité inverse et pré-LLM |
| Académique | 5 | Toutes les briques depuis 20 ans, jamais la composition ni la polarité fail-safe |
| Produits (Devin/OpenHands…) | 5 | Briques éparses ; le plus proche (Rel(AI)Build) hardcode ses phases |
| A2A | 4 | Meilleur véhicule (extensions), mais autorité inversée |
| Protocoles (ACP/AGNTCY/AG-UI) | 4 | Fragments ; les 3 axes différenciants non couverts |
| Exécution durable | 4 | (e) résolu à l'échelle, mais couche 1, pas contrat de méthode |
| Frameworks (AutoGen/CrewAI) | 4 | Tout est interne au framework, rien d'inter-produits |
| Observabilité | 4 | Descriptif en voie de standardisation ; prescriptif inexistant |
| Concept exact | 4 | Personne ne l'a nommé ; Forrester confirme l'absence — créneau libre |
