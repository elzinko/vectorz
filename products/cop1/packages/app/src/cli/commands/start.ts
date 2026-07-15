import { spawn } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigLoader } from '../../features/config/application/ConfigLoader.js';
import { DEFAULT_PORT } from '../../features/daemon/domain/DaemonState.js';
import { PidFileManager } from '../../features/daemon/infrastructure/PidFileManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function waitForHealth(port: number, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) return true;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

/**
 * Résout le port du daemon — priorité : `--port` explicite > `daemon.port` de
 * `cop1.config.yaml` (lu depuis le cwd, comme le reste) > défaut 4242 (fiche 0032).
 * Une config invalide n'empêche pas le démarrage : warn visible + défaut
 * (le fail-fast des champs resources.* relève de la fiche 0033).
 */
export function resolveStartPort(optionPort: string | undefined, projectPath: string): number {
  if (optionPort) return Number.parseInt(optionPort, 10);
  try {
    // skipRamValidation : lire un port ne doit pas échouer sur un budget RAM (cf. 0033)
    const config = new ConfigLoader({ skipRamValidation: true }).load(projectPath);
    return config.daemon.port;
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(`cop1.config.yaml invalide (${detail}) — port par défaut ${DEFAULT_PORT} utilisé`);
    return DEFAULT_PORT;
  }
}

export async function startCommand(options: { port?: string }): Promise<void> {
  const projectPath = process.cwd();
  const port = resolveStartPort(options.port, projectPath);
  const pidManager = new PidFileManager(projectPath);

  const existingPid = pidManager.read();
  if (existingPid !== null && pidManager.isProcessAlive(existingPid)) {
    console.error(`cop1 is already running (pid: ${existingPid})`);
    process.exit(1);
  }

  // Clean stale PID file
  if (existingPid !== null) {
    pidManager.delete();
  }

  const daemonEntry = join(__dirname, '..', 'daemon-entry.js');
  const child = spawn(process.execPath, [daemonEntry, '--port', String(port)], {
    detached: true,
    stdio: 'ignore',
    env: { ...process.env, COP1_PROJECT_PATH: projectPath },
  });

  child.unref();

  if (!child.pid) {
    console.error('Failed to start daemon');
    process.exit(1);
  }

  console.log(`Starting cop1 daemon (pid: ${child.pid}, port: ${port})...`);

  const healthy = await waitForHealth(port, 30_000);
  if (!healthy) {
    console.error('Daemon failed to start within 30s');
    process.exit(1);
  }

  console.log(`cop1 started (pid: ${child.pid})`);
}
