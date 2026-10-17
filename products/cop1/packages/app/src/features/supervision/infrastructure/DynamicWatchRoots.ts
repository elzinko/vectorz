import {
  JournalWatcherAdapter,
  type JournalWatcherAdapterOptions,
  type RunChangeHandler,
} from './JournalWatcherAdapter.js';
import { enumerateWorktrees } from './WorktreeEnumerator.js';

/** Unité de surveillance d'UNE racine (un `JournalWatcherAdapter` par défaut). */
export interface WatcherUnit {
  start(): void;
  stop(): void;
}

export interface DynamicWatchRootsOptions extends JournalWatcherAdapterOptions {
  /** Période de ré-énumération des worktrees (défaut 10 000 ms). Injectable pour les tests. */
  resyncIntervalMs?: number;
  /** Énumérateur de worktrees — injectable pour les tests ; `enumerateWorktrees` par défaut. */
  enumerate?: (baseRoot: string) => string[];
  /** Fabrique de watcher — injectable pour les tests ; un `JournalWatcherAdapter` par racine par défaut. */
  createWatcher?: (
    root: string,
    onRunChanged: RunChangeHandler,
    options: JournalWatcherAdapterOptions,
  ) => WatcherUnit;
}

const DEFAULT_RESYNC_INTERVAL_MS = 10_000;

/**
 * Surveillance DYNAMIQUE des racines (fiche 20261015082118368, ADR-079 §D9).
 *
 * Le `JournalWatcherAdapter` prend ses racines une fois, au démarrage — les
 * worktrees qui naissent/meurent en cours de session lui restent invisibles.
 * Ce coordinateur COMPOSE un adaptateur PAR racine et ré-énumère périodiquement
 * les worktrees de chaque racine de base : une racine qui apparaît fait démarrer
 * son adaptateur ; une racine qui disparaît fait STOPPER le sien (il ferme tous
 * ses watchers et timers — aucun orphelin). Rien n'est refondu dans le watcher
 * délicat : on s'appuie sur son `stop()` déjà complet.
 */
export class DynamicWatchRoots {
  private readonly resyncIntervalMs: number;
  private readonly enumerate: (baseRoot: string) => string[];
  private readonly createWatcher: NonNullable<DynamicWatchRootsOptions['createWatcher']>;
  private readonly watcherOptions: JournalWatcherAdapterOptions;
  private readonly units = new Map<string, WatcherUnit>();
  private resyncTimer: ReturnType<typeof setInterval> | undefined;
  private stopped = false;

  constructor(
    private readonly baseRoots: string[],
    private readonly onRunChanged: RunChangeHandler,
    options: DynamicWatchRootsOptions = {},
  ) {
    const { resyncIntervalMs, enumerate, createWatcher, ...watcherOptions } = options;
    this.resyncIntervalMs = resyncIntervalMs ?? DEFAULT_RESYNC_INTERVAL_MS;
    this.enumerate = enumerate ?? enumerateWorktrees;
    this.createWatcher =
      createWatcher ?? ((root, cb, opts) => new JournalWatcherAdapter([root], cb, opts));
    this.watcherOptions = watcherOptions;
  }

  start(): void {
    this.sync();
    this.resyncTimer = setInterval(() => this.sync(), this.resyncIntervalMs);
  }

  stop(): void {
    this.stopped = true;
    if (this.resyncTimer !== undefined) clearInterval(this.resyncTimer);
    this.resyncTimer = undefined;
    for (const unit of this.units.values()) unit.stop();
    this.units.clear();
  }

  /** Les racines actuellement surveillées (observabilité / tests). */
  watchedRoots(): string[] {
    return [...this.units.keys()];
  }

  /** Union des worktrees de toutes les racines de base, dédoublonnée. */
  private desiredRoots(): Set<string> {
    const roots = new Set<string>();
    for (const base of this.baseRoots) {
      for (const root of this.enumerate(base)) roots.add(root);
    }
    return roots;
  }

  /** Démarre les adaptateurs manquants, stoppe ceux dont la racine a disparu. */
  private sync(): void {
    if (this.stopped) return;
    const desired = this.desiredRoots();

    for (const root of desired) {
      if (!this.units.has(root)) {
        const unit = this.createWatcher(root, this.onRunChanged, this.watcherOptions);
        this.units.set(root, unit);
        unit.start();
      }
    }

    for (const [root, unit] of this.units) {
      if (!desired.has(root)) {
        unit.stop(); // ferme watchers + timers de cette racine — aucun orphelin.
        this.units.delete(root);
      }
    }
  }
}
