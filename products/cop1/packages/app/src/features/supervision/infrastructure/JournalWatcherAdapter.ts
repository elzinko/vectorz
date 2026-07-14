import { existsSync, watch as fsWatch, readdirSync } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { join } from 'node:path';

const RUNS_SUBDIR = join('.supervision', 'runs');

export type RunChangeHandler = (projectRoot: string, runDir: string) => void;

export interface JournalWatcherAdapterOptions {
  /** Regroupe les rafales d'écriture avant de notifier (défaut 80ms). */
  debounceMs?: number;
  /** Fréquence du poll de secours tant que `.supervision/runs` n'existe pas (défaut 2000ms). */
  fallbackPollMs?: number;
}

/**
 * `fs.watch` sur `<watch_root>/.supervision/runs/` (fiche 0031 / ADR-028) :
 * scanne les runs déjà présents au démarrage, détecte les nouveaux dossiers
 * de run sans redémarrage, et notifie `onRunChanged` (debounced) à chaque
 * écriture. Robuste si `.supervision` n'existe pas encore : poll léger de
 * secours jusqu'à son apparition, puis bascule sur `fs.watch`.
 */
export class JournalWatcherAdapter {
  private readonly debounceMs: number;
  private readonly fallbackPollMs: number;
  private readonly watchers: FSWatcher[] = [];
  private readonly pollTimers: ReturnType<typeof setInterval>[] = [];
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly projectRootByRunDir = new Map<string, string>();
  private readonly knownRunDirs = new Set<string>();
  private stopped = false;

  constructor(
    private readonly watchRoots: string[],
    private readonly onRunChanged: RunChangeHandler,
    options: JournalWatcherAdapterOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? 80;
    this.fallbackPollMs = options.fallbackPollMs ?? 2000;
  }

  start(): void {
    for (const root of this.watchRoots) {
      this.watchProjectRoot(root);
    }
  }

  stop(): void {
    this.stopped = true;
    for (const watcher of this.watchers) watcher.close();
    this.watchers.length = 0;
    for (const poll of this.pollTimers) clearInterval(poll);
    this.pollTimers.length = 0;
    for (const timer of this.debounceTimers.values()) clearTimeout(timer);
    this.debounceTimers.clear();
  }

  private watchProjectRoot(projectRoot: string): void {
    const runsDir = join(projectRoot, RUNS_SUBDIR);
    if (existsSync(runsDir)) {
      this.attachRunsDirWatcher(projectRoot, runsDir);
      return;
    }

    // `.supervision/runs` n'existe pas encore (session pas encore démarrée
    // côté émetteur) : poll léger jusqu'à son apparition, fallback tolérant.
    const poll = setInterval(() => {
      if (this.stopped) return;
      if (existsSync(runsDir)) {
        clearInterval(poll);
        this.attachRunsDirWatcher(projectRoot, runsDir);
      }
    }, this.fallbackPollMs);
    this.pollTimers.push(poll);
  }

  private attachRunsDirWatcher(projectRoot: string, runsDir: string): void {
    for (const entryName of this.listRunDirNames(runsDir)) {
      this.discoverRunDir(projectRoot, join(runsDir, entryName));
    }

    try {
      const watcher = fsWatch(runsDir, (_eventType, filename) => {
        if (this.stopped || !filename) return;
        const runDir = join(runsDir, filename.toString());
        if (existsSync(runDir)) {
          this.discoverRunDir(projectRoot, runDir);
        }
      });
      this.watchers.push(watcher);
    } catch {
      // dossier supprimé entre l'existsSync et le fs.watch — tolérant (POC).
    }
  }

  private listRunDirNames(runsDir: string): string[] {
    try {
      return readdirSync(runsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
    } catch {
      return [];
    }
  }

  private discoverRunDir(projectRoot: string, runDir: string): void {
    if (!this.knownRunDirs.has(runDir)) {
      this.knownRunDirs.add(runDir);
      this.projectRootByRunDir.set(runDir, projectRoot);
      this.watchRunDir(runDir);
    }
    this.scheduleNotify(runDir);
  }

  private watchRunDir(runDir: string): void {
    try {
      const watcher = fsWatch(runDir, () => {
        if (this.stopped) return;
        this.scheduleNotify(runDir);
      });
      this.watchers.push(watcher);
    } catch {
      // le dossier de run a pu disparaître entre-temps — tolérant (POC).
    }
  }

  private scheduleNotify(runDir: string): void {
    const existing = this.debounceTimers.get(runDir);
    if (existing) clearTimeout(existing);

    const timer = setTimeout(() => {
      this.debounceTimers.delete(runDir);
      const projectRoot = this.projectRootByRunDir.get(runDir);
      if (projectRoot) this.onRunChanged(projectRoot, runDir);
    }, this.debounceMs);
    this.debounceTimers.set(runDir, timer);
  }
}
