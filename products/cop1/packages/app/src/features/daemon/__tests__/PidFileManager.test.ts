import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PidFileManager } from '../infrastructure/PidFileManager.js';

describe('PidFileManager', () => {
  let testDir: string;
  let manager: PidFileManager;

  beforeEach(() => {
    testDir = join(tmpdir(), `cop1-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(testDir, { recursive: true });
    manager = new PidFileManager(testDir, 4343);
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should write and read a PID', () => {
    manager.write(12345);
    expect(manager.read()).toBe(12345);
  });

  it('should return null if PID file does not exist', () => {
    expect(manager.read()).toBeNull();
  });

  it('should delete the PID file', () => {
    manager.write(12345);
    expect(manager.exists()).toBe(true);
    manager.delete();
    expect(manager.exists()).toBe(false);
    expect(manager.read()).toBeNull();
  });

  it('should create .cop1 directory if missing', () => {
    const cop1Dir = join(testDir, '.cop1');
    expect(existsSync(cop1Dir)).toBe(false);
    manager.write(99);
    expect(existsSync(cop1Dir)).toBe(true);
  });

  it('should detect current process as alive', () => {
    expect(manager.isProcessAlive(process.pid)).toBe(true);
  });

  it('should detect non-existent PID as dead', () => {
    // PID 99999999 is almost certainly not running
    expect(manager.isProcessAlive(99999999)).toBe(false);
  });

  it('should handle delete on non-existent file without error', () => {
    expect(() => manager.delete()).not.toThrow();
  });

  // fiche 20261102100505596 — one pid file per port, the legacy file still read
  it('names the pid file after its port', () => {
    manager.write(12345);
    expect(existsSync(join(testDir, '.cop1', 'daemon-4343.pid'))).toBe(true);
    expect(existsSync(join(testDir, '.cop1', 'daemon.pid'))).toBe(false);
  });

  it('two ports never share a file: deleting one keeps the other', () => {
    const other = new PidFileManager(testDir, 4344);
    manager.write(111);
    other.write(222);
    other.delete();
    expect(manager.read()).toBe(111);
    expect(other.read()).toBeNull();
  });

  it('lists the daemons of a folder by port, the legacy file last', () => {
    new PidFileManager(testDir, 5274).write(30);
    manager.write(10);
    new PidFileManager(testDir, null).write(40);
    expect(PidFileManager.list(testDir).map(({ port, pid }) => ({ port, pid }))).toEqual([
      { port: 4343, pid: 10 },
      { port: 5274, pid: 30 },
      { port: null, pid: 40 },
    ]);
  });

  it('ignores files that are not daemon pid files, and unreadable pids', () => {
    mkdirSync(join(testDir, '.cop1'), { recursive: true });
    for (const name of ['daemon.log', 'daemon-abc.pid', 'daemon-0.pid', 'other-4343.pid']) {
      writeFileSync(join(testDir, '.cop1', name), '7');
    }
    writeFileSync(join(testDir, '.cop1', 'daemon-4345.pid'), 'pas un pid');
    expect(PidFileManager.list(testDir)).toEqual([]);
  });

  it('lists nothing when the folder has no .cop1 directory', () => {
    expect(PidFileManager.list(testDir)).toEqual([]);
  });
});
