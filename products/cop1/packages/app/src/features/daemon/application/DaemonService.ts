import { EventBus } from '@cop1/shared-kernel';
import { BlockageService } from '@cop1/sprint-core';
import { BlocageApiHandler } from '../../blocage-api/application/BlocageApiHandler.js';
import { ConfigLoader } from '../../config/application/ConfigLoader.js';
import { SupervisionService } from '../../supervision/application/SupervisionService.js';
import { JournalWatcherAdapter } from '../../supervision/infrastructure/JournalWatcherAdapter.js';
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

    this.eventBus = options.eventBus ?? new EventBus();
    this.httpServer.setEventBus(this.eventBus);

    this.httpServer.setAuthChecker(() => checkAuth());

    const blockageService = new BlockageService(projectPath, this.eventBus);
    this.httpServer.setBlocageApiHandler(new BlocageApiHandler(blockageService));

    this.wireSupervision(projectPath);
  }

  private wireSupervision(projectPath: string): void {
    let watchRoots: string[] = [];
    let presumedDeadAfterMin = 5;
    try {
      const config = new ConfigLoader({ skipRamValidation: true }).load(projectPath);
      watchRoots = config.supervision?.watch_roots ?? [];
      presumedDeadAfterMin = config.supervision?.presumed_dead_after_min ?? 5;
    } catch {
      return;
    }

    if (watchRoots.length === 0) return;

    this.supervisionService = new SupervisionService({
      eventBus: this.eventBus,
      presumedDeadAfterMs: presumedDeadAfterMin * 60_000,
    });
    this.httpServer.setSupervisionProvider(() => this.supervisionService?.getSnapshots() ?? []);

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
