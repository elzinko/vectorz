import {
  type DaemonInstance,
  PidFileManager,
} from '../../features/daemon/infrastructure/PidFileManager.js';
import { describePort } from './status.js';

/**
 * Stops the daemon of this folder. Several daemons may run from one folder, one per port
 * (fiche 20261102100505596): without `--port`, stop refuses to guess and lists them.
 */
export async function stopCommand(options: { port?: string } = {}): Promise<void> {
  const projectPath = process.cwd();
  let wanted: number | undefined;
  if (options.port !== undefined) {
    wanted = Number(options.port);
    if (!Number.isInteger(wanted) || wanted < 1 || wanted > 65535) {
      console.error(`Invalid port: ${options.port}`);
      process.exit(1);
    }
  }

  const live: DaemonInstance[] = [];
  for (const instance of PidFileManager.list(projectPath)) {
    if (wanted !== undefined && instance.port !== wanted) continue;
    if (instance.manager.isProcessAlive(instance.pid)) {
      live.push(instance);
    } else {
      instance.manager.delete();
      console.log(`stale PID file removed on ${describePort(instance.port)}`);
    }
  }

  if (live.length === 0) {
    console.log(
      wanted === undefined ? 'cop1 is not running' : `cop1 is not running on port ${wanted}`,
    );
    return;
  }
  if (live.length > 1) {
    const where = live.map((i) => `${describePort(i.port)} (pid: ${i.pid})`).join(', ');
    console.error(
      `Several cop1 daemons run from this folder: ${where}. Choose one: cop1 stop --port <port>`,
    );
    process.exit(1);
  }

  // Exactly one live daemon remains here: none and several returned above.
  const [{ pid, manager }] = live as [DaemonInstance];
  console.log(`Stopping cop1 daemon (pid: ${pid})...`);
  process.kill(pid, 'SIGTERM');

  // Wait for PID file to be removed (daemon cleans up on exit)
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (!manager.exists()) {
      console.log('cop1 stopped');
      return;
    }
    await new Promise((r) => setTimeout(r, 100));
  }

  console.error('Daemon did not stop within 10s');
  process.exit(1);
}
