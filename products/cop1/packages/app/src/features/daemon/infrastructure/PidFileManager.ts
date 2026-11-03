import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { COP1_DIR, LEGACY_PID_FILENAME, pidFilename } from '../domain/DaemonState.js';

/** A daemon of a project folder, as its pid file names it. `port` is null for the legacy file. */
export interface DaemonInstance {
  port: number | null;
  pid: number;
  manager: PidFileManager;
}

const PER_PORT_FILE = /^daemon-([1-9][0-9]{0,4})\.pid$/;

/**
 * One pid file per daemon port (fiche 20261102100505596): two daemons started from the same folder
 * no longer overwrite, then delete, each other's file. `port: null` targets the legacy
 * `daemon.pid`, written before this change, so that `status` and `stop` still find it.
 */
export class PidFileManager {
  private readonly pidPath: string;

  constructor(projectPath: string, port: number | null) {
    this.pidPath = join(
      projectPath,
      COP1_DIR,
      port === null ? LEGACY_PID_FILENAME : pidFilename(port),
    );
  }

  /** Every daemon pid file of the folder, per-port files first by port, then the legacy file. */
  static list(projectPath: string): DaemonInstance[] {
    const dir = join(projectPath, COP1_DIR);
    if (!existsSync(dir)) return [];
    const ports = readdirSync(dir)
      .map((name) => PER_PORT_FILE.exec(name)?.[1])
      .filter((port): port is string => port !== undefined)
      .map(Number)
      .filter((port) => port <= 65535)
      .sort((a, b) => a - b);
    const out: DaemonInstance[] = [];
    for (const port of [...ports, null]) {
      const manager = new PidFileManager(projectPath, port);
      const pid = manager.read();
      if (pid !== null) out.push({ port, pid, manager });
    }
    return out;
  }

  write(pid: number): void {
    const dir = dirname(this.pidPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(this.pidPath, String(pid), 'utf-8');
  }

  read(): number | null {
    if (!existsSync(this.pidPath)) {
      return null;
    }
    const content = readFileSync(this.pidPath, 'utf-8').trim();
    const pid = Number.parseInt(content, 10);
    return Number.isNaN(pid) ? null : pid;
  }

  delete(): void {
    if (existsSync(this.pidPath)) {
      unlinkSync(this.pidPath);
    }
  }

  exists(): boolean {
    return existsSync(this.pidPath);
  }

  isProcessAlive(pid: number): boolean {
    try {
      process.kill(pid, 0);
      return true;
    } catch {
      return false;
    }
  }
}
