import { EventBus } from '@cop1/shared-kernel';
import { BlockageService, SprintSessionService } from '@cop1/sprint-core';
import { BlocageApiHandler } from '../../blocage-api/application/BlocageApiHandler.js';
import { ConfigLoader } from '../../config/application/ConfigLoader.js';
import { HttpOrchestratorAdapter } from '../../orchestrator/infrastructure/HttpOrchestratorAdapter.js';
import { YamlSprintStatusAdapter } from '../../orchestrator/infrastructure/YamlSprintStatusAdapter.js';
import { AbandonRunUseCase } from '../../supervision/application/AbandonRunUseCase.js';
import { SupervisionService } from '../../supervision/application/SupervisionService.js';
import { EmitterCliAbandonAdapter } from '../../supervision/infrastructure/EmitterCliAbandonAdapter.js';
import { JournalWatcherAdapter } from '../../supervision/infrastructure/JournalWatcherAdapter.js';
import { locateRegistry, resolveWatchRoots } from '../../supervision/infrastructure/registry.js';
import { DEFAULT_PORT } from '../domain/DaemonState.js';
import { checkAuth } from '../infrastructure/AuthChecker.js';
import { HttpServer } from '../infrastructure/HttpServer.js';
import { PidFileManager } from '../infrastructure/PidFileManager.js';

export interface DaemonOptions {
  port?: number;
  projectPath?: string;
  /** Injectable for tests; defaults to a fresh in-process bus. */
  eventBus?: EventBus;
}

export class DaemonService {
  private readonly httpServer: HttpServer;
  private readonly pidManager: PidFileManager;
  private readonly port: number;
  private readonly eventBus: EventBus;
  private supervisionService: SupervisionService | null = null;
  private journalWatcher: JournalWatcherAdapter | null = null;

  constructor(options: DaemonOptions = {}) {
    this.port = options.port ?? DEFAULT_PORT;
    const projectPath = options.projectPath ?? process.cwd();
    this.httpServer = new HttpServer();
    this.pidManager = new PidFileManager(projectPath);

    // B1 (load-bearing): the daemon owns the EventBus and bridges it to SSE, so
    // a run's `orchestrator.*` / `session.*` events stream to `/events` for free.
    this.eventBus = options.eventBus ?? new EventBus();
    this.httpServer.setEventBus(this.eventBus);

    // B2: in-process single-run adapter, sinking tagged events onto the daemon bus.
    this.httpServer.setOrchestratorAdapter(new HttpOrchestratorAdapter(this.eventBus, projectPath));

    this.httpServer.setSprintStatusProvider(() => {
      const reader = new YamlSprintStatusAdapter(projectPath);
      const sessionService = new SprintSessionService(projectPath);

      const statuses = reader.getAllStatuses();
      const stories: Record<string, string> = {};
      for (const [id, status] of statuses) {
        stories[id] = status;
      }

      return { stories, session: sessionService.check() };
    });

    // Wire the auth-check probe (Story A): GET /api/auth/check runs a cheap,
    // single-turn SDK call inheriting the environment's Claude credentials.
    this.httpServer.setAuthChecker(() => checkAuth());

    // fiche 0021 — wire the blockage API: GET /api/blocages +
    // POST /api/blocages/:id/resolve. Shares the daemon's EventBus so that a
    // STORY_UNBLOCKED emitted on resolve bridges to /events like every other event.
    const blockageService = new BlockageService(projectPath, this.eventBus);
    this.httpServer.setBlocageApiHandler(new BlocageApiHandler(blockageService));

    // fiche 0031 (ADR-028) — mode moniteur : lecture live de
    // .supervision/runs/ sur les watch-roots configurés. Chargement one-shot
    // et tolérant de la config (cop1.config.yaml absent ⇒ supervision
    // dormante, watch_roots=[]) : aucun fs.watch surprise sur le cwd tant que
    // le projet n'a pas explicitement opté in.
    this.wireSupervision(projectPath);
  }

  /**
   * Instancie `SupervisionService` + `JournalWatcherAdapter` sur le même
   * `EventBus` que le reste du daemon uniquement si des watch-roots sont
   * disponibles ; sinon reste dormant (aucun watcher démarré).
   *
   * Fiche 0082 — Registre de supervision :
   * - Si `supervision.registry.yaml` est trouvé dans `projectPath`, les
   *   `watch_roots` sont dérivées du registre (fin de la double saisie).
   * - Sinon, retour au comportement v1 : `supervision.watch_roots` depuis YAML.
   * - `presumed_dead_after_min` reste toujours lu depuis YAML si disponible.
   */
  private wireSupervision(projectPath: string): void {
    let watchRoots: string[] = [];
    let presumedDeadAfterMin = 5;

    // Fiche 0082 — dérivation depuis le registre (prioritaire sur YAML).
    // Un fichier présent mais invalide NE doit PAS retomber sur YAML (Codex P1) :
    // on reste sans watchers plutôt que de surveiller une liste périmée.
    let fromRegistry = false;
    try {
      const located = locateRegistry([projectPath]);
      if (located !== null) {
        watchRoots = resolveWatchRoots(located.registry, located.dir);
        fromRegistry = true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(
        `[daemon] supervision.registry.yaml invalide — watchers non démarrés : ${message}`,
      );
      fromRegistry = true;
      watchRoots = [];
    }

    let abandonCommand: string[] = [];

    // Lecture de la config YAML pour presumed_dead_after_min (et watch_roots si pas de registre)
    try {
      // skipRamValidation : le mode moniteur ne consomme que `supervision.*` ;
      // le budget RAM (défaut 48GB > la RAM de la plupart des machines, dont
      // les runners CI à 16GB) est une contrainte d'orchestration qui ne doit
      // pas rendre la supervision silencieusement dormante (cf. fiche 0033).
      const config = new ConfigLoader({ skipRamValidation: true }).load(projectPath);
      if (!fromRegistry) {
        watchRoots = config.supervision?.watch_roots ?? [];
      }
      presumedDeadAfterMin = config.supervision?.presumed_dead_after_min ?? 5;
      abandonCommand = config.supervision?.abandon_command ?? [];
    } catch {
      // cop1.config.yaml absent ou invalide : supervision dormante par
      // défaut, ce n'est jamais une raison de faire échouer le démarrage
      // du daemon (le reste du daemon fonctionne sans config chargée).
      if (!fromRegistry) return;
    }

    if (watchRoots.length === 0) return;

    this.supervisionService = new SupervisionService({
      eventBus: this.eventBus,
      presumedDeadAfterMs: presumedDeadAfterMin * 60_000,
      abandonCapable: abandonCommand.length > 0,
    });
    this.httpServer.setSupervisionProvider(() => this.supervisionService?.getSnapshots() ?? []);

    // ADR-035 D2+D3 : adaptateur d'abandon câblé uniquement si abandon_command configurée
    const abandonPort =
      abandonCommand.length > 0
        ? new EmitterCliAbandonAdapter(abandonCommand)
        : {
            abandon: async () => ({ ok: false as const, reason: 'abandon_command non configurée' }),
          };
    const abandonUseCase = new AbandonRunUseCase({
      getSnapshot: (runDir) =>
        this.supervisionService?.getSnapshots().find((s) => s.runDir === runDir),
      abandonPort,
      abandonCommand,
    });
    this.httpServer.setRunAbandonHandler({
      execute: async (runDir) => {
        const result = await abandonUseCase.execute(runDir);
        if ('runId' in result) {
          return { status: result.status, body: { ok: true, runId: result.runId } };
        }
        return { status: result.status, body: { error: result.error } };
      },
    });

    this.journalWatcher = new JournalWatcherAdapter(watchRoots, (root, runDir) => {
      this.supervisionService?.absorb(root, runDir);
    });
    this.journalWatcher.start();
  }

  async start(): Promise<void> {
    await this.httpServer.start(this.port);
    this.pidManager.write(process.pid);
    this.registerShutdownHandlers();
  }

  async stop(): Promise<void> {
    this.journalWatcher?.stop();
    this.supervisionService?.stop();
    await this.httpServer.stop();
    this.pidManager.delete();
  }

  private registerShutdownHandlers(): void {
    const shutdown = async () => {
      await this.stop();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
  }
}
