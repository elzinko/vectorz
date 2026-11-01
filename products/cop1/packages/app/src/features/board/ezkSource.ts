/**
 * ezkSource — BORD I/O commun aux lectures de la méthode (ADR-086). Le daemon ne lit ni les fiches
 * ni la config : il demande à la méthode, par la commande `ezk`, comme il appelle déjà `git`.
 *
 * Règle : JAMAIS d'attente pendant une requête. Une source garde, par projet, la dernière réponse.
 * `get()` répond tout de suite avec cet état ; si la réponse a plus de `ttlMs` (ou n'existe pas) et
 * qu'aucun rafraîchissement ne tourne pour ce projet, il en lance un en arrière-plan.
 *
 * Chaque lecture (le plan, la config) est une source à part : l'échec de l'une ne cache pas l'autre.
 */
import { execFile } from 'node:child_process';
import { EzkContractError } from './ezkPlanTranslator.js';

/** Lance `ezk` avec ces arguments (déjà préfixés de `--root <projet>`) et rend sa sortie standard. */
export type EzkRunner = (args: string[]) => Promise<string>;

/** L'état d'une lecture : en chargement, reçue (avec sa date), ou indisponible (avec la raison). */
export type SourceSnapshot<T> =
  | { state: 'loading' }
  | ({ state: 'ok'; at: number } & T)
  | { state: 'unavailable'; reason: string };

export interface EzkSourceOptions {
  /** La commande qui lance la méthode (`supervision.ezk_command`), ex. `["ezk"]`. */
  command: readonly string[];
  /** Exécuteur injectable — défaut : `execFile` asynchrone. */
  run?: EzkRunner;
  now?: () => number;
  /** Âge au-delà duquel un rafraîchissement repart (défaut 30 s). */
  ttlMs?: number;
}

/** Ce qu'une source demande à la méthode pour un projet, et comment elle le traduit. */
export type EzkFetch<T> = (root: string, run: EzkRunner) => Promise<T>;

const DEFAULT_TTL_MS = 30_000;
const EXEC_TIMEOUT_MS = 30_000;
const MAX_OUTPUT_BYTES = 32 * 1024 * 1024; // le détail des fiches fait ~250 Ko

interface Entry<T> {
  snapshot: SourceSnapshot<T>;
  lastAttemptAt: number;
  refreshing: boolean;
}

function execRunner(command: readonly string[]): EzkRunner {
  const [program, ...baseArgs] = command;
  return (args) =>
    new Promise((resolve, reject) => {
      if (program === undefined) {
        reject(new Error('commande ezk vide'));
        return;
      }
      execFile(
        program,
        [...baseArgs, ...args],
        { encoding: 'utf8', timeout: EXEC_TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES },
        (error, stdout) => (error ? reject(error) : resolve(stdout)),
      );
    });
}

/** Une raison lisible par le PO pour un échec d'exécution ou de lecture. */
function describeFailure(error: unknown, command: readonly string[]): string {
  if (error instanceof EzkContractError) return error.message;
  if (error instanceof SyntaxError) return 'réponse d’ezk illisible (JSON invalide)';
  const failure = error as {
    code?: unknown;
    killed?: unknown;
    stderr?: unknown;
    message?: unknown;
  };
  if (failure.code === 'ENOENT') return `commande ezk introuvable (« ${command.join(' ')} »)`;
  if (failure.killed === true) return 'ezk a mis trop longtemps à répondre (délai dépassé)';
  const detail = String(failure.stderr ?? '')
    .split('\n')[0]
    ?.trim();
  const suffix = detail ? ` : ${detail}` : '';
  if (typeof failure.code === 'number') return `ezk a échoué (code ${failure.code})${suffix}`;
  return `ezk a échoué : ${String(failure.message ?? error)}`;
}

export class EzkSource<T> {
  private readonly entries = new Map<string, Entry<T>>();
  private readonly run: EzkRunner;
  private readonly now: () => number;
  private readonly ttlMs: number;
  private readonly command: readonly string[];

  constructor(
    options: EzkSourceOptions,
    private readonly fetch: EzkFetch<T>,
  ) {
    this.command = options.command;
    this.run = options.run ?? execRunner(options.command);
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
  }

  /** L'état courant de la lecture pour ce projet — immédiat. Déclenche un rafraîchissement si besoin. */
  get(root: string): SourceSnapshot<T> {
    let entry = this.entries.get(root);
    if (!entry) {
      entry = { snapshot: { state: 'loading' }, lastAttemptAt: 0, refreshing: false };
      this.entries.set(root, entry);
    }
    const stale = this.now() - entry.lastAttemptAt > this.ttlMs;
    if (!entry.refreshing && (stale || entry.lastAttemptAt === 0)) void this.refresh(root, entry);
    return entry.snapshot;
  }

  private async refresh(root: string, entry: Entry<T>): Promise<void> {
    entry.refreshing = true;
    entry.lastAttemptAt = this.now();
    try {
      const value = await this.fetch(root, this.run);
      entry.snapshot = { state: 'ok', at: this.now(), ...value };
    } catch (error) {
      entry.snapshot = { state: 'unavailable', reason: describeFailure(error, this.command) };
    } finally {
      entry.refreshing = false;
    }
  }
}
