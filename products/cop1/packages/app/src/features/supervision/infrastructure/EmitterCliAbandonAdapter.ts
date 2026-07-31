/**
 * Adaptateur d'abandon CLI — ADR-035 D2 + D3.
 * Seul endroit qui sait qu'un processus séparé existe.
 * La commande provient TOUJOURS de la config du siège (D3 — jamais du .mcp.json du projet surveillé).
 *
 * Le runner `spawnFn` est injectable pour les tests (jamais de vrai spawn dans les tests unitaires).
 */
import { spawn } from 'node:child_process';
import type { AbandonOutcome, RunAbandonPort } from '../domain/RunAbandonPort.js';

/** Timeout par défaut du spawn d'abandon (30s — commande locale, pas un LLM). */
export const ABANDON_SPAWN_TIMEOUT_MS = 30_000;
const GRACEFUL_SHUTDOWN_MS = 2_000;

export type SpawnFn = (
  command: string,
  args: string[],
  env: NodeJS.ProcessEnv,
) => Promise<{ exitCode: number; stderr: string }>;

const defaultSpawn: SpawnFn = (command, args, env) =>
  new Promise((resolve) => {
    const stderrChunks: Buffer[] = [];
    const child = spawn(command, args, { env, stdio: ['ignore', 'ignore', 'pipe'] });
    let settled = false;
    const settle = (exitCode: number, stderr: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(killTimer);
      resolve({ exitCode, stderr });
    };

    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      killTimer = setTimeout(() => {
        child.kill('SIGKILL');
        settle(1, `abandon_command timeout after ${ABANDON_SPAWN_TIMEOUT_MS}ms`);
      }, GRACEFUL_SHUTDOWN_MS);
    }, ABANDON_SPAWN_TIMEOUT_MS);

    child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    child.on('close', (code) => {
      settle(code ?? 1, Buffer.concat(stderrChunks).toString('utf8').trim());
    });
    child.on('error', (err) => {
      settle(1, err.message);
    });
  });

export class EmitterCliAbandonAdapter implements RunAbandonPort {
  private readonly command: string;
  private readonly baseArgs: string[];
  private readonly spawnFn: SpawnFn;

  /**
   * @param abandonCommand Tableau `[commande, ...args_de_base]` depuis la config du siège.
   *   Ex. : `["npx", "mega-city", "supervision:abandon"]`
   * @param spawnFn Injectable pour tests (défaut : `spawn` natif avec timeout).
   */
  constructor(abandonCommand: string[], spawnFn: SpawnFn = defaultSpawn) {
    const cmd = abandonCommand[0];
    if (cmd === undefined) {
      throw new Error(
        'EmitterCliAbandonAdapter : abandon_command est vide — instanciation incorrecte',
      );
    }
    this.command = cmd;
    this.baseArgs = abandonCommand.slice(1);
    this.spawnFn = spawnFn;
  }

  async abandon(args: { projectRoot: string; expectedRunId: string }): Promise<AbandonOutcome> {
    const fullArgs = [...this.baseArgs, args.projectRoot, args.expectedRunId];
    const { exitCode, stderr } = await this.spawnFn(this.command, fullArgs, process.env);

    if (exitCode !== 0) {
      return {
        ok: false,
        reason: stderr.length > 0 ? stderr : `La commande d'abandon a échoué (code ${exitCode})`,
      };
    }

    return { ok: true, runId: args.expectedRunId };
  }
}
