import { PidFileManager } from '../../features/daemon/infrastructure/PidFileManager.js';

/** Where an instance listens, for a status line. */
export function describePort(port: number | null): string {
  return port === null ? 'unknown port (legacy daemon.pid)' : `port ${port}`;
}

/** One line per daemon of this folder (fiche 20261102100505596); a dead one's file is removed. */
export function statusCommand(): void {
  const instances = PidFileManager.list(process.cwd());
  if (instances.length === 0) {
    console.log('stopped');
    return;
  }

  for (const { port, pid, manager } of instances) {
    if (!manager.isProcessAlive(pid)) {
      manager.delete();
      console.log(`stopped on ${describePort(port)} (stale PID file removed)`);
      continue;
    }
    console.log(`running on ${describePort(port)} (pid: ${pid})`);
  }
}
