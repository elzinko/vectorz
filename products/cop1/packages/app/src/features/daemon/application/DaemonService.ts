import { basename, isAbsolute, resolve } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { BlockageService } from '@cop1/sprint-core';
import { BlocageApiHandler } from '../../blocage-api/application/BlocageApiHandler.js';
import { type BoardProjectInput, composeBoardData } from '../../board/boardProvider.js';
import { EzkConfigSource } from '../../board/ezkConfigSource.js';
import { execEzkRunner } from '../../board/ezkExec.js';
import { EzkHelpSource } from '../../board/ezkHelpSource.js';
import { EzkLawSource } from '../../board/ezkLawSource.js';
import { EzkRecipesSource } from '../../board/ezkRecipesSource.js';
import { EzkPlanSource } from '../../board/ezkPlanSource.js';
import { EzkGraphSource } from '../../board/ezkGraphSource.js';
import { EzkNowSource } from '../../board/ezkNowSource.js';
import { EzkRetroCapturesSource } from '../../board/ezkRetroCapturesSource.js';
import { EzkProcessShowSource } from '../../board/ezkProcessShowSource.js';
import { EzkProcessSource } from '../../board/ezkProcessSource.js';
import { writeVerdictThroughEzk } from '../../board/verdictWriter.js';
import { ConfigLoader } from '../../config/application/ConfigLoader.js';
import { AbandonRunUseCase } from '../../supervision/application/AbandonRunUseCase.js';
import { AnchorProjectUseCase } from '../../supervision/application/AnchorProjectUseCase.js';
import { RunHistoryService } from '../../supervision/application/RunHistoryService.js';
import { SupervisionService } from '../../supervision/application/SupervisionService.js';
import { DynamicWatchRoots } from '../../supervision/infrastructure/DynamicWatchRoots.js';
import { EmitterCliAbandonAdapter } from '../../supervision/infrastructure/EmitterCliAbandonAdapter.js';
import { EmitterCliAnchorAdapter } from '../../supervision/infrastructure/EmitterCliAnchorAdapter.js';
import { locateRegistry, resolveWatchRoots } from '../../supervision/infrastructure/registry.js';
import { DEFAULT_PORT } from '../domain/DaemonState.js';
import { checkAuth } from '../infrastructure/AuthChecker.js';
import { HttpServer, type SupervisionProjectDto } from '../infrastructure/HttpServer.js';
import { PidFileManager } from '../infrastructure/PidFileManager.js';

export interface DaemonOptions {
  port?: number;
  /** Port de la page web de mission control : son Origin peut écrire (fiche 20261102165708468). */
  webPort?: number;
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
  private journalWatcher: DynamicWatchRoots | null = null;
  /** ADR-086 : commande qui lance la méthode (`supervision.ezk_command`), défaut `ezk`. */
  private ezkCommand: string[] = ['ezk'];
  private ezkPlanSource: EzkPlanSource | null = null;
  private ezkConfigSource: EzkConfigSource | null = null;
  private ezkProcessSource: EzkProcessSource | null = null;
  private ezkLawSource: EzkLawSource | null = null;
  private ezkHelpSource: EzkHelpSource | null = null;
  private ezkRecipesSource: EzkRecipesSource | null = null;
  private ezkProcessShowSource: EzkProcessShowSource | null = null;
  private ezkRetroCapturesSource: EzkRetroCapturesSource | null = null;
  private ezkGraphSource: EzkGraphSource | null = null;
  private ezkNowSource: EzkNowSource | null = null;

  constructor(options: DaemonOptions = {}) {
    this.port = options.port ?? DEFAULT_PORT;
    const projectPath = options.projectPath ?? process.cwd();
    this.httpServer = new HttpServer();
    if (options.webPort !== undefined) this.httpServer.setWebPort(options.webPort);
    this.pidManager = new PidFileManager(projectPath, this.port);

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
    this.httpServer.setBoardProvider(() =>
      composeBoardData(this.boardProjects(projectPath), {
        plan: this.planSource(),
        config: this.configSource(),
        process: this.processSource(),
      }),
    );
    // fiche 20261102151630248 — le pouce de revue : le daemon lance `ezk review verdict`, puis
    // relit le plan du projet tout de suite. La commande `ezk` est lue dans la config au moment de
    // l'appel, pas ici : la config se charge juste après.
    this.httpServer.setVerdictHandler({
      execute: (body) =>
        writeVerdictThroughEzk(body, {
          projects: () => this.boardProjects(projectPath),
          run: execEzkRunner(this.ezkCommand),
          onWritten: (root) => this.planSource().invalidate(root),
        }),
    });
    // fiche 20261128093846629 — l'annuaire (`ezk help --json`) : servi depuis la mémoire, relu en arrière-plan.
    this.httpServer.setHelpHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.helpSource().get(root);
        if (snap.state === 'ok') return { status: 200, body: { state: 'ok', help: snap.help } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });
    // fiche 20260826222044335 — la loi : servie depuis la mémoire, relue en arrière-plan.
    this.httpServer.setLawHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.lawSource().get(root);
        if (snap.state === 'ok') return { status: 200, body: { state: 'ok', law: snap.law } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });
    // fiche 20261104090518109 — les recettes : servies depuis la mémoire, relues en arrière-plan.
    this.httpServer.setRecipesHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.recipesSource().get(root);
        if (snap.state === 'ok') return { status: 200, body: { state: 'ok', recipes: snap.recipes } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });
    // fiche 20261110191135802 — les étapes fines : servies depuis la mémoire, relues en arrière-plan.
    this.httpServer.setProcessShowHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.processShowSource().get(root);
        if (snap.state === 'ok')
          return { status: 200, body: { state: 'ok', process: snap.process } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });
    // fiche 20260826072532537 — les rétros capturées : servies depuis la mémoire, relues en arrière-plan.
    this.httpServer.setRetrosHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.retroCapturesSource().get(root);
        if (snap.state === 'ok') return { status: 200, body: { state: 'ok', retros: snap.retros } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });
    // fiche 20261126170000112 — les alertes de la cloche : servies depuis la mémoire, relues en arrière-plan.
    this.httpServer.setNowHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.nowSource().get(root);
        if (snap.state === 'ok') return { status: 200, body: { state: 'ok', now: snap.now } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });
    // fiche 20261117114544792 — le graphe de la méthode, même motif que les étapes fines.
    this.httpServer.setGraphHandler({
      read: (projet) => {
        const root = this.boardProjects(projectPath).find((p) => p.name === projet)?.root;
        if (!root) return { status: 404, body: { error: `projet inconnu : ${projet}` } };
        const snap = this.graphSource().get(root);
        if (snap.state === 'ok') return { status: 200, body: { state: 'ok', graph: snap.graph } };
        if (snap.state === 'unavailable')
          return { status: 200, body: { state: 'unavailable', reason: snap.reason } };
        return { status: 200, body: { state: 'loading' } };
      },
    });

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
      this.ezkCommand = config.supervision?.ezk_command ?? ['ezk'];
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
    this.httpServer.setHistoryProvider(
      ({ limit, projectRoot }) => this.runHistoryService?.list(projectRoot, limit) ?? [],
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

    // Surveillance dynamique (ADR-079 §D9) : un adaptateur par racine, ré-énumérée
    // périodiquement — un worktree qui apparaît/disparaît est suivi/retiré sans redémarrage.
    this.journalWatcher = new DynamicWatchRoots(watchRoots, (root, runDir) => {
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

  /**
   * Les projets servis au board (part plan) : le MÊME registre que `readRegistryProjects`
   * (`name = id du projet`, `root = sa racine`). Repli sur le projet courant si aucun registre
   * n'est trouvé, pour qu'un daemon mono-projet serve quand même son plan.
   */
  /** La source de plan, créée au premier besoin avec la commande lue dans la config. */
  private planSource(): EzkPlanSource {
    this.ezkPlanSource ??= new EzkPlanSource({ command: this.ezkCommand });
    return this.ezkPlanSource;
  }

  /** La source de config (`ezk config show --json`), créée au premier besoin comme celle du plan. */
  private configSource(): EzkConfigSource {
    this.ezkConfigSource ??= new EzkConfigSource({ command: this.ezkCommand });
    return this.ezkConfigSource;
  }

  /** La source du process (`ezk board process --json`), créée au premier besoin comme les deux autres. */
  private processSource(): EzkProcessSource {
    this.ezkProcessSource ??= new EzkProcessSource({ command: this.ezkCommand });
    return this.ezkProcessSource;
  }

  /** La source de la loi (`ezk law show --json`), créée au premier besoin comme les autres. */
  private lawSource(): EzkLawSource {
    this.ezkLawSource ??= new EzkLawSource({ command: this.ezkCommand });
    return this.ezkLawSource;
  }

  /** La source de l'annuaire (`ezk help --json`), créée au premier besoin comme les autres. */
  private helpSource(): EzkHelpSource {
    this.ezkHelpSource ??= new EzkHelpSource({ command: this.ezkCommand });
    return this.ezkHelpSource;
  }

  /** La source des recettes (`ezk recipes --json`), créée au premier besoin comme les autres. */
  private recipesSource(): EzkRecipesSource {
    this.ezkRecipesSource ??= new EzkRecipesSource({ command: this.ezkCommand });
    return this.ezkRecipesSource;
  }

  /** La source des étapes fines (`ezk process show --json`), créée au premier besoin comme les autres. */
  private graphSource(): EzkGraphSource {
    this.ezkGraphSource ??= new EzkGraphSource({ command: this.ezkCommand });
    return this.ezkGraphSource;
  }

  /** La source des alertes de la cloche (`ezk now --json`), créée au premier besoin. */
  private nowSource(): EzkNowSource {
    this.ezkNowSource ??= new EzkNowSource({ command: this.ezkCommand });
    return this.ezkNowSource;
  }

  /** La source des rétros capturées (`ezk retro captures --json`), créée au premier besoin. */
  private retroCapturesSource(): EzkRetroCapturesSource {
    this.ezkRetroCapturesSource ??= new EzkRetroCapturesSource({ command: this.ezkCommand });
    return this.ezkRetroCapturesSource;
  }

  private processShowSource(): EzkProcessShowSource {
    this.ezkProcessShowSource ??= new EzkProcessShowSource({ command: this.ezkCommand });
    return this.ezkProcessShowSource;
  }

  private boardProjects(projectPath: string): BoardProjectInput[] {
    try {
      const located = locateRegistry([projectPath]);
      if (located !== null && located.registry.projects.length > 0) {
        return located.registry.projects.map((p) => ({
          name: p.id,
          root: isAbsolute(p.path) ? p.path : resolve(located.dir, p.path),
        }));
      }
    } catch {
      // pas de registre lisible → repli ci-dessous
    }
    return [{ name: basename(projectPath), root: projectPath }];
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
