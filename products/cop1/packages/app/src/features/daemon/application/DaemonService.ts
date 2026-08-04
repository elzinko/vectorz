import { isAbsolute, resolve } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { BlockageService } from '@cop1/sprint-core';
import { BlocageApiHandler } from '../../blocage-api/application/BlocageApiHandler.js';
import { ConfigLoader } from '../../config/application/ConfigLoader.js';
import { AbandonRunUseCase } from '../../supervision/application/AbandonRunUseCase.js';
import { AnchorProjectUseCase } from '../../supervision/application/AnchorProjectUseCase.js';
import { RunHistoryService } from '../../supervision/application/RunHistoryService.js';
import { SupervisionService } from '../../supervision/application/SupervisionService.js';
import { EmitterCliAbandonAdapter } from '../../supervision/infrastructure/EmitterCliAbandonAdapter.js';
import { EmitterCliAnchorAdapter } from '../../supervision/infrastructure/EmitterCliAnchorAdapter.js';
import { JournalWatcherAdapter } from '../../supervision/infrastructure/JournalWatcherAdapter.js';
import { locateRegistry, resolveWatchRoots } from '../../supervision/infrastructure/registry.js';
import { DEFAULT_PORT } from '../domain/DaemonState.js';
import { checkAuth } from '../infrastructure/AuthChecker.js';
import { HttpServer, type SupervisionProjectDto } from '../infrastructure/HttpServer.js';
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
  private runHistoryService: RunHistoryService | null = null;
  private journalWatcher: JournalWatcherAdapter | null = null;

  constructor(options: DaemonOptions = {}) {
    this.port = options.port ?? DEFAULT_PORT;
    const projectPath = options.projectPath ?? process.cwd();
    this.httpServer = new HttpServer();
    this.pidManager = new PidFileManager(projectPath);

    this.eventBus = options.eventBus ?? new EventBus();
    this.httpServer.setEventBus(this.eventBus);

    this.httpServer.setAuthChecker(() => checkAuth());

    const blockageService = new BlockageService(projectPath, this.eventBus);
    this.httpServer.setBlocageApiHandler(new BlocageApiHandler(blockageService));

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
   *
   * Fiche 0063 — l'ancrage (POST) et la liste projets (GET) restent câblés même
   * sans watchers, pour pouvoir ajouter un premier projet depuis le Moniteur.
   */
  private wireSupervision(projectPath: string): void {
    let watchRoots: string[] = [];
    let presumedDeadAfterMin = 5;
    let fromRegistry = false;
    let abandonCommand: string[] = [];
    let linkCommand: string[] = [];
    let registryAddCommand: string[] = [];
    let bindCommand: string[] = [];
    let tokenBudget = {};

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

    // fiche 0062/0063 — relecture à chaque GET (après registry-add sans restart)
    this.httpServer.setProjectsProvider(() => this.readRegistryProjects(projectPath));

    try {
      const config = new ConfigLoader({ skipRamValidation: true }).load(projectPath);
      if (!fromRegistry) {
        watchRoots = config.supervision?.watch_roots ?? [];
      }
      presumedDeadAfterMin = config.supervision?.presumed_dead_after_min ?? 5;
      abandonCommand = config.supervision?.abandon_command ?? [];
      linkCommand = config.supervision?.link_command ?? [];
      registryAddCommand = config.supervision?.registry_add_command ?? [];
      bindCommand = config.supervision?.bind_command ?? [];
      tokenBudget = {
        sprintMaxTokens: config.budget?.sprint_max_tokens,
        maxUsdPerSession: config.budget?.max_usd_per_session,
      };
    } catch {
      this.wireAnchorHandler(bindCommand, linkCommand, registryAddCommand);
      if (!fromRegistry) return;
    }

    this.wireAnchorHandler(bindCommand, linkCommand, registryAddCommand);

    if (watchRoots.length === 0) return;

    this.supervisionService = new SupervisionService({
      eventBus: this.eventBus,
      presumedDeadAfterMs: presumedDeadAfterMin * 60_000,
      abandonCapable: abandonCommand.length > 0,
      tokenBudget,
    });
    this.runHistoryService = new RunHistoryService({ watchRoots, tokenBudget });
    this.httpServer.setSupervisionProvider(() => this.supervisionService?.getSnapshots() ?? []);
    this.httpServer.setHistoryProvider(({ limit, projectRoot }) =>
      this.runHistoryService?.list(projectRoot, limit) ?? [],
    );

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

  private readRegistryProjects(projectPath: string): SupervisionProjectDto[] {
    try {
      const located = locateRegistry([projectPath]);
      if (located === null) return [];
      return located.registry.projects.map((p) => ({
        id: p.id,
        path: p.path,
        method: p.method,
        projectRoot: isAbsolute(p.path) ? p.path : resolve(located.dir, p.path),
      }));
    } catch {
      return [];
    }
  }

  private wireAnchorHandler(
    bindCommand: string[],
    linkCommand: string[],
    registryAddCommand: string[],
  ): void {
    const port = new EmitterCliAnchorAdapter(bindCommand, linkCommand, registryAddCommand);
    const useCase = new AnchorProjectUseCase({
      port,
      bindConfigured: bindCommand.length > 0,
      linkConfigured: linkCommand.length > 0,
      registryAddConfigured: registryAddCommand.length > 0,
    });
    this.httpServer.setProjectAnchorHandler({
      execute: async (body) => {
        const result = await useCase.execute(
          (body && typeof body === 'object' ? body : {}) as Record<string, unknown>,
        );
        if (result.status === 200) {
          return {
            status: 200,
            body: {
              ok: true,
              mode: result.mode,
              projectRoot: result.projectRoot,
              id: result.id,
              daemonRestartRequired: result.daemonRestartRequired,
            },
          };
        }
        return { status: result.status, body: { error: result.error } };
      },
    });
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
