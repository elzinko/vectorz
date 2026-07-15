# ADR-026 — Couture d'exécuteur agent-agnostique : renommer le seam de session + StubExecutor

Statut : **Proposé** (2026-07-14) — issu d'une session `/architecture`, cadre la fiche **0020** (AgentSessionPort / prouver l'indépendance à l'agent).
**Révisé par :** [ADR-029](ADR-029-emancipation-bmad-politique-archivage.md) (2026-07-15) —
le non-but « le dossier `bmad-orchestration/` est gardé » devient « gardé **jusqu'à E4** »
(émancipation BMAD : adaptateur retiré en E4, après le gate E3 « run pilote vert sur fiches
natives »). Le reste (rename, factory, StubExecutor) tient et devient le lot E1.
*(Bandeau posé par la fiche 0035, 2026-07-15.)*
**Opérationnalise :** [ADR-022](ADR-022-control-plane-ontology.md) — brique **(2) AgentSessionPort** (executor) ; ADR-022 acte déjà le renommage `BMADSessionPort → AgentSessionPort` (Décision, §Réalité du code l.93 & Q4) et désigne la fiche 0020 comme 1ᵉʳ enabler (« risque existentiel n°1 »). Le présent ADR en fixe le *comment*.
Voir aussi : ADR-012 (introduction du port de session), ADR-014 (vision superviseur), ADR-021 (frontière mega-city), ADR-025 (monorepo co-dev — n'affecte pas ce seam).

## Contexte

Le control plane cop1 est déjà ~85 % agnostique à l'agent : boucle orchestrateur, budget (ADR-017),
gates DoD (ADR-020), worktrees (ADR-018), EventBus — rien ne connaît Claude. Le couplage Claude est
**concentré derrière un seul seam** : le port de session `BMADSessionPort`
(`packages/sprint-core/.../domain/ports/BMADSessionPort.ts`), interface propre à 2 méthodes
(`startSession`, `continueSession`) déjà agent-neutre dans sa forme, mais **mal nommée** (elle nomme la
*méthode* BMAD alors qu'elle est le seam d'**exécution**).

Tant qu'aucun exécuteur **non-Claude** n'a piloté un épic de bout en bout, la thèse produit
« cop1 ≠ surcouche Claude » n'est **pas prouvée** — risque existentiel n°1. Un adaptateur non-Claude
existe déjà (`InMemorySessionAdapter`, cantonné aux tests) : il faut le **promouvoir en exécuteur de
1re classe** et rendre la frontière **vérifiable**. POC d'abord (StubExecutor ; Ollama différé).

## Décision

1. **Renommer le seam, pas la méthode.** `BMADSessionPort → AgentSessionPort`, `BMADSessionContext →
   AgentSessionContext`. `SessionHandle` / `SessionTurnResult` / `QuestionHandler` restent (déjà
   neutres). Périmètre **strict** : le port de session et ses DTO. **Hors périmètre** : le dossier
   `bmad-orchestration/` et le port superviseur (`AgentSdkSupervisorAdapter` a déjà son pendant
   `InMemorySupervisorAdapter` → l'indépendance superviseur n'est pas sur le chemin critique).
2. **Pas d'`ExecutorPort` supplémentaire (YAGNI).** Le port 2-méthodes renommé **est** l'abstraction
   d'exécuteur ; la DIP est déjà satisfaite. Une couche fine de plus n'a aucun second consommateur —
   ce serait une abstraction non justifiée (défaut).
3. **Sélection d'exécuteur : une factory, une env.** Env canonique **`COP1_EXECUTOR`** (`sdk` défaut |
   `resume` | `stub` ; `ollama` plus tard), avec **`COP1_BMAD_ADAPTER` lu en alias déprécié** (compat
   ascendante + warn). La logique de sélection, aujourd'hui **copiée-collée** dans `sprint-run.ts` et
   `orchestrator.ts`, est extraite en **une factory partagée** (`createAgentSessionAdapter(env)`) —
   corrige la violation DRY/SRP (un seul endroit choisit l'exécuteur).
4. **StubExecutor = `InMemorySessionAdapter` promu.** On le renomme/généralise en `StubExecutor` à
   **réponses scriptées** (un seul adaptateur non-Claude, pas deux), sélectionnable via `stub`. Il doit
   piloter un **épic-jouet de bout en bout** — budget qui s'incrémente (`tokensUsed`), gates DoD qui se
   déclenchent, events SSE, escalade, worktrees — **zéro ligne de Claude**. C'est le critère de preuve.
5. **Frontière « aucun import SDK hors executor adapters », rendue vérifiable.** Un *executor adapter*
   = une classe qui **implémente `AgentSessionPort`** (`AgentSdkSessionAdapter`,
   `ClaudeResumeSessionAdapter`, `ClaudeCliAdapter`). Le critère porte **sur ce seam uniquement**. Sont
   des concerns **distincts, légitimement SDK-couplés et hors-scope** : `AuthChecker` (auth daemon),
   `toolCatalog` + `SupervisorMcpServer` (surface **superviseur**, brique 1). On **ne les déplace pas**
   (YAGNI). On matérialise le critère par une **allowlist explicite** (test/règle de frontière) des
   fichiers autorisés à importer `@anthropic-ai/claude-agent-sdk`.

## Options considérées

| Option | Verdict |
|---|---|
| **A.** Extraire un `ExecutorPort` fin en plus du port renommé | ❌ Abstraction sans 2e consommateur — YAGNI |
| **B.** Nouvelle env `COP1_EXECUTOR` **sans** alias (breaking) | ❌ Casse l'existant sans gain ; alias trivial |
| **C.** Créer un `StubExecutor` neuf **à côté** d'`InMemorySessionAdapter` | ❌ Deux adaptateurs non-Claude redondants |
| **D.** Renommer aussi le dossier `bmad-orchestration/` + port superviseur | ❌ Gonfle le blast radius ; conflate méthode & exécution (voir Non-buts) |
| **Retenu** | Renommer le seul port de session + factory + promouvoir le stub + allowlist |

## Conséquences

- ✅ La thèse « agent-agnostique » devient **exécutable et prouvée** par un run stub end-to-end ; le
  couplage Claude est réduit à un ensemble de fichiers **nommés et testés** (allowlist).
- ✅ DIP/SRP renforcés : un seul point de sélection d'exécuteur ; nom du port = son rôle réel.
- ⚠️ **Blast radius du renommage** (contenu) : ~7 sources non-test (port, `index.ts` re-export,
  `BMADSessionStep`, `SupervisorService`, les 3 adaptateurs, `toolCatalog`), ~7 tests, +2 entrypoints
  CLI + `PipelineStepFactory`. Mécanique (rename de symbole), à faire d'un bloc, **zéro changement de
  comportement**.
- ⚠️ **Non-buts (explicite)** : ce renommage concerne l'**exécution**. Le couplage *méthode* BMAD
  (process-driver, dossier `bmad-orchestration/`) est un **sujet distinct** — non traité ici. De même,
  prouver l'indépendance du **superviseur** (déplacer `toolCatalog`/`SupervisorMcpServer` hors SDK) est
  un ADR séparé si un jour requis.
- 🔁 **Futur (différé)** : exécuteur **Ollama** (`OllamaAdapter` existe déjà dans `llm-intelligence`) =
  valeur `ollama` de `COP1_EXECUTOR`, une fois le stub vert.
- 🚦 Aucune régression de gate : le stub passe par la **même** boucle orchestrateur et les mêmes gates
  que le SDK — c'est précisément ce qu'il valide.
