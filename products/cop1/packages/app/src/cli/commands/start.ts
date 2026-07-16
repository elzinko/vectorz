import { spawn } from 'node:child_process';
import { closeSync, mkdirSync, openSync, readFileSync, writeSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ConfigLoader } from '../../features/config/application/ConfigLoader.js';
import { ConfigValidationError } from '../../features/config/domain/ConfigValidationError.js';
import { DEFAULT_PORT } from '../../features/daemon/domain/DaemonState.js';
import { PidFileManager } from '../../features/daemon/infrastructure/PidFileManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

type StartupOutcome = 'healthy' | 'died' | 'timeout';

async function waitForHealthOrDeath(
  port: number,
  timeoutMs: number,
  childPid: number,
  pidManager: PidFileManager,
): Promise<StartupOutcome> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    // Fiche 0033 volet 1 — plus de timeout muet ni de faux succès : le /health porte le
    // pid du daemon qui répond ; un démarrage n'est sain que si c'est NOTRE child. Un
    // /health d'un autre pid = un AUTRE daemon occupe le port (EADDRINUSE dans le log).
    try {
      const res = await fetch(`http://127.0.0.1:${port}/health`);
      if (res.ok) {
        const body = (await res.json()) as { pid?: number };
        if (body.pid === childPid) return 'healthy';
      }
    } catch {
      // not ready yet
    }
    if (!pidManager.isProcessAlive(childPid)) return 'died';
    await new Promise((r) => setTimeout(r, 200));
  }
  return 'timeout';
}

function tailFile(path: string, lines: number): string {
  try {
    const content = readFileSync(path, 'utf-8').trimEnd();
    return content.split('\n').slice(-lines).join('\n');
  } catch {
    return '(log illisible ou vide)';
  }
}

/**
 * Résout le port du daemon — priorité : `--port` explicite > `daemon.port` de
 * `cop1.config.yaml` (lu depuis le cwd, comme le reste) > défaut 4242 (fiche 0032).
 * La config est validée STRICTEMENT (budget RAM inclus, fiche 0033) : TOUTE erreur sur
 * `resources.ram_budget_*` (dépassement de la RAM machine, mais aussi violation du
 * schéma sur ces champs) JETTE — fail-fast, jamais de timeout muet — même avec
 * `--port`. Toute autre config invalide n'empêche pas le démarrage : warn visible
 * + repli (le daemon tolère, la supervision retombe sur ses défauts).
 */
export function resolveStartPort(optionPort: string | undefined, projectPath: string): number {
  let configPort: number | null = null;
  try {
    // Validation stricte : les défauts RAM sont clampés à la machine (jamais fautifs) ;
    // seules les valeurs utilisateur peuvent excéder — et doivent échouer ICI, pas en
    // timeout après le spawn.
    configPort = new ConfigLoader().load(projectPath).daemon.port;
  } catch (err) {
    if (err instanceof ConfigValidationError && err.field.startsWith('resources.ram_budget')) {
      throw err; // fail-fast 0033 — startCommand affiche la cause et sort en échec
    }
    const detail = err instanceof Error ? err.message : String(err);
    console.warn(
      `cop1.config.yaml invalide (${detail}) — ${
        optionPort ? 'option --port utilisée' : `port par défaut ${DEFAULT_PORT} utilisé`
      }`,
    );
  }
  if (optionPort) return Number.parseInt(optionPort, 10);
  return configPort ?? DEFAULT_PORT;
}

export async function startCommand(options: { port?: string }): Promise<void> {
  const projectPath = process.cwd();

  let port: number;
  try {
    port = resolveStartPort(options.port, projectPath);
  } catch (err) {
    // Fail-fast 0033 : budget RAM impossible — on échoue en < 2 s avec la cause,
    // au lieu d'un timeout de 30 s sans message.
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
  }

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

  // Fiche 0033 volet 1 — stdout/stderr du child vont dans un log au lieu d'être
  // jetés : en cas d'échec de démarrage, la cause est lisible.
  const logPath = join(projectPath, '.cop1', 'daemon.log');
  mkdirSync(dirname(logPath), { recursive: true });
  const logFd = openSync(logPath, 'a');
  // Marqueur de run : borne le diagnostic (le tail ne peut pas être confondu avec un
  // run précédent) tout en gardant l'historique.
  writeSync(logFd, `\n--- cop1 start ${new Date().toISOString()} port ${port} ---\n`);

  const daemonEntry = join(__dirname, '..', 'daemon-entry.js');
  const child = spawn(process.execPath, [daemonEntry, '--port', String(port)], {
    detached: true,
    stdio: ['ignore', logFd, logFd],
    env: { ...process.env, COP1_PROJECT_PATH: projectPath },
  });
  closeSync(logFd);

  child.unref();

  if (!child.pid) {
    console.error('Failed to start daemon');
    process.exit(1);
  }

  console.log(`Starting cop1 daemon (pid: ${child.pid}, port: ${port})...`);

  const outcome = await waitForHealthOrDeath(port, 30_000, child.pid, pidManager);
  if (outcome !== 'healthy') {
    const cause =
      outcome === 'died'
        ? 'Daemon process died during startup'
        : 'Daemon failed to become healthy within 30s';
    console.error(`${cause} — dernières lignes du log (${logPath}) :`);
    console.error(tailFile(logPath, 15));
    process.exit(1);
  }

  console.log(`cop1 started (pid: ${child.pid})`);
}
