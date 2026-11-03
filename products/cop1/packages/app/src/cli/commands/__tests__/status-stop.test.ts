import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PidFileManager } from '../../../features/daemon/infrastructure/PidFileManager.js';
import { statusCommand } from '../status.js';
import { stopCommand } from '../stop.js';

/**
 * fiche 20261102100505596 — several daemons of one folder, one pid file per port. No real process is
 * signalled: `process.kill` is replaced, signal 0 answers « alive » for the pids of `alive`, and a
 * SIGTERM removes the target's pid file, as the daemon does when it stops.
 */
describe('cop1 status and stop — one daemon per port', () => {
  let dir: string;
  let alive: Set<number>;
  let terminated: number[];
  let logs: string[];
  let errors: string[];

  const pidFile = (port: number | null) =>
    join(dir, '.cop1', port === null ? 'daemon.pid' : `daemon-${port}.pid`);

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-pid-'));
    alive = new Set();
    terminated = [];
    logs = [];
    errors = [];
    vi.spyOn(process, 'cwd').mockReturnValue(dir);
    vi.spyOn(console, 'log').mockImplementation((line: string) => {
      logs.push(line);
    });
    vi.spyOn(console, 'error').mockImplementation((line: string) => {
      errors.push(line);
    });
    vi.spyOn(process, 'exit').mockImplementation((code) => {
      throw new Error(`exit ${code}`);
    });
    vi.spyOn(process, 'kill').mockImplementation((pid: number, signal?: string | number) => {
      if (signal === 0) {
        if (!alive.has(pid)) throw new Error('ESRCH');
        return true;
      }
      terminated.push(pid);
      for (const { pid: listed, manager } of PidFileManager.list(dir)) {
        if (listed === pid) manager.delete();
      }
      return true;
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    rmSync(dir, { recursive: true, force: true });
  });

  const daemon = (port: number | null, pid: number, isAlive = true) => {
    new PidFileManager(dir, port).write(pid);
    if (isAlive) alive.add(pid);
  };

  it('status lists every daemon with its port and pid, and removes a dead one', () => {
    daemon(4343, 101);
    daemon(4344, 102);
    daemon(4345, 103, false);
    statusCommand();
    expect(logs).toEqual([
      'running on port 4343 (pid: 101)',
      'running on port 4344 (pid: 102)',
      'stopped on port 4345 (stale PID file removed)',
    ]);
    expect(existsSync(pidFile(4345))).toBe(false);
  });

  it('status still reads a legacy daemon.pid', () => {
    daemon(null, 104);
    statusCommand();
    expect(logs).toEqual(['running on unknown port (legacy daemon.pid) (pid: 104)']);
  });

  it('status says stopped when no daemon runs', () => {
    statusCommand();
    expect(logs).toEqual(['stopped']);
  });

  it('stop without --port refuses to guess between two daemons, and stops none', async () => {
    daemon(4343, 101);
    daemon(4344, 102);
    await expect(stopCommand()).rejects.toThrow('exit 1');
    expect(errors[0]).toContain('port 4343 (pid: 101)');
    expect(errors[0]).toContain('port 4344 (pid: 102)');
    expect(terminated).toEqual([]);
  });

  it('stop --port stops that daemon only', async () => {
    daemon(4343, 101);
    daemon(4344, 102);
    await stopCommand({ port: '4344' });
    expect(terminated).toEqual([102]);
    expect(existsSync(pidFile(4344))).toBe(false);
    expect(new PidFileManager(dir, 4343).read()).toBe(101);
    expect(logs).toContain('cop1 stopped');
  });

  it('stop without --port stops the only live daemon, after removing a dead one', async () => {
    daemon(4343, 101, false);
    daemon(4344, 102);
    await stopCommand();
    expect(terminated).toEqual([102]);
    expect(logs).toContain('stale PID file removed on port 4343');
  });

  it('stop finds a legacy daemon.pid', async () => {
    daemon(null, 104);
    await stopCommand();
    expect(terminated).toEqual([104]);
  });

  it('stop --port on a port nobody holds says so', async () => {
    daemon(4343, 101);
    await stopCommand({ port: '4399' });
    expect(logs).toEqual(['cop1 is not running on port 4399']);
    expect(terminated).toEqual([]);
  });

  it('stop --port refuses a malformed port', async () => {
    await expect(stopCommand({ port: 'abc' })).rejects.toThrow('exit 1');
    expect(errors).toEqual(['Invalid port: abc']);
  });
});
