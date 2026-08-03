/**
 * Adaptateur d'ancrage CLI — fiche 0063 (même pattern ADR-035 D2/D3).
 * Commandes TOUJOURS depuis la config siège.
 */
import { spawn } from 'node:child_process';
import type { AnchorSpawnOutcome, ProjectAnchorPort } from '../domain/ProjectAnchorPort.js';

export const ANCHOR_SPAWN_TIMEOUT_MS = 60_000;
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
    let killTimer: ReturnType<typeof setTimeout> | undefined;
    const settle = (exitCode: number, stderr: string) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      clearTimeout(killTimer);
      resolve({ exitCode, stderr });
    };

    const timeout = setTimeout(() => {
      child.kill('SIGTERM');
      killTimer = setTimeout(() => {
        child.kill('SIGKILL');
        settle(1, `anchor command timeout after ${ANCHOR_SPAWN_TIMEOUT_MS}ms`);
      }, GRACEFUL_SHUTDOWN_MS);
    }, ANCHOR_SPAWN_TIMEOUT_MS);

    child.stderr?.on('data', (chunk: Buffer) => stderrChunks.push(chunk));
    child.on('close', (code) => {
      settle(code ?? 1, Buffer.concat(stderrChunks).toString('utf8').trim());
    });
    child.on('error', (err) => {
      settle(1, err.message);
    });
  });

async function runCommand(
  command: string[],
  extraArgs: string[],
  spawnFn: SpawnFn,
): Promise<AnchorSpawnOutcome> {
  const cmd = command[0];
  if (cmd === undefined) {
    return { ok: false, reason: 'commande d’ancrage vide' };
  }
  const { exitCode, stderr } = await spawnFn(cmd, [...command.slice(1), ...extraArgs], process.env);
  if (exitCode !== 0) {
    return {
      ok: false,
      reason: stderr.length > 0 ? stderr : `commande échouée (code ${exitCode})`,
    };
  }
  return { ok: true };
}

export class EmitterCliAnchorAdapter implements ProjectAnchorPort {
  constructor(
    private readonly bindCommand: string[],
    private readonly linkCommand: string[],
    private readonly registryAddCommand: string[],
    private readonly spawnFn: SpawnFn = defaultSpawn,
  ) {}

  bindMethod(projectRoot: string): Promise<AnchorSpawnOutcome> {
    return runCommand(this.bindCommand, [projectRoot], this.spawnFn);
  }

  linkEmitter(projectRoot: string): Promise<AnchorSpawnOutcome> {
    return runCommand(this.linkCommand, [projectRoot], this.spawnFn);
  }

  addToRegistry(args: {
    id: string;
    projectRoot: string;
    method: string;
  }): Promise<AnchorSpawnOutcome> {
    return runCommand(
      this.registryAddCommand,
      [args.id, args.projectRoot, args.method],
      this.spawnFn,
    );
  }
}
