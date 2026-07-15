import { existsSync, watch as fsWatch, readdirSync, realpathSync, statSync } from 'node:fs';
import type { FSWatcher } from 'node:fs';
import { join, sep } from 'node:path';

const RUNS_SUBDIR = join('.supervision', 'runs');

/** Cap de dossiers de run surveillés en continu (protection EMFILE). */
const MAX_WATCHED_RUN_DIRS = 512;

/**
 * Filet de sécurité : `fs.watch` n'est documenté fiable à 100% sur aucune
 * plateforme (doc Node) — sous forte charge (CI, nombreux processus
 * concurrents) des événements peuvent être manqués. Un rescan périodique
 * léger de `.supervision/runs/` redécouvre ce que `fs.watch` aurait manqué.
 * Un moniteur ne doit jamais devenir silencieusement aveugle.
 */
const RESCAN_INTERVAL_MS = 30_000;

export type RunChangeHandler = (projectRoot: string, runDir: string) => void;

/**
 * Journal semi-hostile (écrit par un LLM tiers) : jamais de `console.*` en
 * dur — un logger injectable permet aux tests d'observer les avertissements
 * et erreurs sans polluer stdout/stderr, tout en gardant `console` comme
 * comportement par défaut en production.
 */
export interface JournalWatcherLogger {
  warn(message: string): void;
  error(message: string, error: unknown): void;
}

const defaultLogger: JournalWatcherLogger = {
  warn: (message) => console.warn(`[JournalWatcherAdapter] ${message}`),
  error: (message, error) => console.error(`[JournalWatcherAdapter] ${message}`, error),
};

interface EventsFileStat {
  mtimeMs: number;
  size: number;
}

export interface JournalWatcherAdapterOptions {
  /** Regroupe les rafales d'écriture avant de notifier (défaut 80ms). */
  debounceMs?: number;
  /** Fréquence du poll de secours tant que `.supervision/runs` n'existe pas (défaut 2000ms). */
  fallbackPollMs?: number;
  /** Cap de dossiers de run surveillés en continu (défaut `MAX_WATCHED_RUN_DIRS` = 512). */
  maxWatchedRunDirs?: number;
  /**
   * Fréquence du rescan de secours de `.supervision/runs/` (défaut
   * `RESCAN_INTERVAL_MS` = 30000ms). Injectable pour les tests (fake timers).
   */
  rescanIntervalMs?: number;
  /** Logger injectable pour les tests ; `console.warn`/`console.error` par défaut. */
  logger?: JournalWatcherLogger;
}

/**
 * `fs.watch` sur `<watch_root>/.supervision/runs/` (fiche 0031 / ADR-028) :
 * scanne les runs déjà présents au démarrage, détecte les nouveaux dossiers
 * de run sans redémarrage, et notifie `onRunChanged` (debounced) à chaque
 * écriture. Robuste si `.supervision` n'existe pas encore : poll léger de
 * secours jusqu'à son apparition, puis bascule sur `fs.watch`.
 *
 * Robustesse face à un journal SEMI-HOSTILE (écrit par un LLM tiers, jamais
 * fiable) :
 * - `onRunChanged` (et tout ce qu'il déclenche, ex. lecture du journal côté
 *   appelant) est toujours invoqué sous try/catch : une erreur y est
 *   journalisée, jamais un throw non rattrapé qui tuerait le daemon.
 * - `runDir` et son `events.jsonl` sont confinés sous `realpath(watch_root)`
 *   avant toute notification : un symlink pointant hors de la racine
 *   surveillée est ignoré et journalisé, jamais suivi.
 * - le nombre de dossiers de run surveillés en continu est plafonné
 *   (`maxWatchedRunDirs`) pour ne jamais épuiser les descripteurs de fichier
 *   (EMFILE) sur un très grand nombre de runs.
 * - un rescan périodique de secours (`rescanIntervalMs`) redécouvre les
 *   dossiers de run que `fs.watch` aurait manqués, et redéclenche une
 *   notification pour un `events.jsonl` dont le mtime/size a changé sans que
 *   l'événement `fs.watch` correspondant n'ait été délivré. Reste POC : pas
 *   de diff fin du contenu, juste « quelque chose a changé ».
 */
export class JournalWatcherAdapter {
  private readonly debounceMs: number;
  private readonly fallbackPollMs: number;
  private readonly maxWatchedRunDirs: number;
  private readonly rescanIntervalMs: number;
  private readonly logger: JournalWatcherLogger;
  private readonly watchers: FSWatcher[] = [];
  private readonly pollTimers: ReturnType<typeof setInterval>[] = [];
  private readonly debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  private readonly projectRootByRunDir = new Map<string, string>();
  private readonly eventsFileStatByRunDir = new Map<string, EventsFileStat>();
  private runDirWatcherCount = 0;
  private maxWatchedRunDirsWarned = false;
  private stopped = false;

  constructor(
    private readonly watchRoots: string[],
    private readonly onRunChanged: RunChangeHandler,
    options: JournalWatcherAdapterOptions = {},
  ) {
    this.debounceMs = options.debounceMs ?? 80;
    this.fallbackPollMs = options.fallbackPollMs ?? 2000;
    this.maxWatchedRunDirs = options.maxWatchedRunDirs ?? MAX_WATCHED_RUN_DIRS;
    this.rescanIntervalMs = options.rescanIntervalMs ?? RESCAN_INTERVAL_MS;
    this.logger = options.logger ?? defaultLogger;
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
    // TOCTOU : le watcher est attaché AVANT le scan initial. Un run créé
    // entre les deux reste ainsi toujours découvert (par le watch s'il
    // arrive après l'attache, par le scan sinon) — jamais dans le trou.
    try {
      const watcher = fsWatch(runsDir, (_eventType, filename) => {
        if (this.stopped || !filename) return;
        const runDir = join(runsDir, filename.toString());
        if (this.isExistingDirectory(runDir)) {
          this.discoverRunDir(projectRoot, runDir);
        }
      });
      this.watchers.push(watcher);
    } catch {
      // dossier supprimé entre l'existsSync et le fs.watch — tolérant (POC).
    }

    for (const entryName of this.listRunDirNames(runsDir)) {
      this.discoverRunDir(projectRoot, join(runsDir, entryName));
    }

    // Filet de sécurité (voir doc de classe) : redécouvre périodiquement ce
    // que `fs.watch` aurait pu manquer, sans jamais court-circuiter le cap
    // EMFILE ni le confinement realpath (réutilise discoverRunDir/scheduleNotify).
    const rescan = setInterval(() => this.rescan(projectRoot, runsDir), this.rescanIntervalMs);
    this.pollTimers.push(rescan);
  }

  private rescan(projectRoot: string, runsDir: string): void {
    if (this.stopped) return;
    for (const entryName of this.listRunDirNames(runsDir)) {
      const runDir = join(runsDir, entryName);
      if (!this.projectRootByRunDir.has(runDir)) {
        // fs.watch a pu manquer la création de ce dossier — on le découvre ici.
        this.discoverRunDir(projectRoot, runDir);
        continue;
      }
      this.detectSilentEventsChange(runDir);
    }
  }

  /**
   * Redéclenche une notification si `events.jsonl` a changé depuis la
   * dernière notification effectivement délivrée (`syncEventsFileStat`),
   * sans qu'un événement `fs.watch` correspondant n'ait été délivré.
   */
  private detectSilentEventsChange(runDir: string): void {
    const stat = this.statEventsFile(runDir);
    if (!stat) return; // events.jsonl pas (encore) écrit — rien à comparer.

    const previous = this.eventsFileStatByRunDir.get(runDir);
    if (previous && previous.mtimeMs === stat.mtimeMs && previous.size === stat.size) {
      return; // rien de nouveau depuis la dernière notification connue.
    }
    this.scheduleNotify(runDir);
  }

  private statEventsFile(runDir: string): EventsFileStat | undefined {
    try {
      const s = statSync(join(runDir, 'events.jsonl'));
      return { mtimeMs: s.mtimeMs, size: s.size };
    } catch {
      return undefined;
    }
  }

  private isExistingDirectory(path: string): boolean {
    try {
      return statSync(path).isDirectory();
    } catch {
      return false;
    }
  }

  private listRunDirNames(runsDir: string): string[] {
    try {
      // `Dirent.isDirectory()` reflète le type de l'ENTRÉE elle-même
      // (d_type POSIX) et NE SUIT PAS les symlinks : un dossier de run
      // symlinké (`entry.isSymbolicLink() === true`) serait sinon exclu du
      // scan, jamais soumis au confinement realpath (finding 5) — juste
      // invisible. On inclut donc aussi les symlinks candidats, puis on
      // confirme via `statSync` (qui, lui, suit les symlinks) que la cible
      // est bien un dossier — `discoverRunDir` se charge ensuite de rejeter
      // celles qui pointent hors du watch_root.
      return readdirSync(runsDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() || entry.isSymbolicLink())
        .map((entry) => entry.name)
        .filter((name) => this.isExistingDirectory(join(runsDir, name)));
    } catch {
      return [];
    }
  }

  private discoverRunDir(projectRoot: string, runDir: string): void {
    if (!this.projectRootByRunDir.has(runDir)) {
      if (!this.isConfinedUnderWatchRoot(projectRoot, runDir)) {
        this.logger.warn(`dossier de run ignoré (hors watch_root, symlink suspect) : "${runDir}"`);
        return;
      }
      this.projectRootByRunDir.set(runDir, projectRoot);
      this.watchRunDir(runDir);
    }
    this.scheduleNotify(runDir);
  }

  private watchRunDir(runDir: string): void {
    if (this.runDirWatcherCount >= this.maxWatchedRunDirs) {
      if (!this.maxWatchedRunDirsWarned) {
        this.maxWatchedRunDirsWarned = true;
        this.logger.warn(
          `limite de ${this.maxWatchedRunDirs} dossiers de run surveillés atteinte — les runs suivants sont découverts mais pas surveillés en continu (protection EMFILE).`,
        );
      }
      return;
    }

    try {
      const watcher = fsWatch(runDir, () => {
        if (this.stopped) return;
        this.scheduleNotify(runDir);
      });
      this.watchers.push(watcher);
      this.runDirWatcherCount += 1;
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
      if (!projectRoot) return;

      if (!this.isEventsFileConfined(projectRoot, runDir)) {
        this.logger.warn(`events.jsonl ignoré (hors watch_root, symlink suspect) : "${runDir}"`);
        return;
      }

      // Mémorise l'état d'events.jsonl "au moment de cette notification" :
      // le rescan de secours (`detectSilentEventsChange`) s'en sert de
      // référence pour savoir si le fichier a encore bougé depuis.
      const stat = this.statEventsFile(runDir);
      if (stat) this.eventsFileStatByRunDir.set(runDir, stat);

      // Journal semi-hostile : `onRunChanged` (et tout ce qu'il déclenche
      // côté appelant, ex. lecture/projection du journal) ne doit jamais
      // faire planter le watcher — une erreur y est journalisée uniquement.
      try {
        this.onRunChanged(projectRoot, runDir);
      } catch (error) {
        this.logger.error(`onRunChanged a levé une erreur pour "${runDir}"`, error);
      }
    }, this.debounceMs);
    this.debounceTimers.set(runDir, timer);
  }

  /** Confine `runDir` sous `realpath(projectRoot)` — protège contre un dossier symlinké hors watch_root. */
  private isConfinedUnderWatchRoot(projectRoot: string, runDir: string): boolean {
    try {
      const rootReal = realpathSync(projectRoot);
      const runDirReal = realpathSync(runDir);
      return this.isUnder(rootReal, runDirReal);
    } catch {
      // lien cassé ou dossier disparu entre-temps — tolérant, on ignore ce cycle.
      return false;
    }
  }

  /** Confine `<runDir>/events.jsonl` sous `realpath(projectRoot)` s'il existe déjà. */
  private isEventsFileConfined(projectRoot: string, runDir: string): boolean {
    const eventsPath = join(runDir, 'events.jsonl');
    if (!existsSync(eventsPath)) return true;

    try {
      const rootReal = realpathSync(projectRoot);
      const eventsReal = realpathSync(eventsPath);
      return this.isUnder(rootReal, eventsReal);
    } catch {
      return false;
    }
  }

  private isUnder(root: string, candidate: string): boolean {
    return candidate === root || candidate.startsWith(root + sep);
  }
}
