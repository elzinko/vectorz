import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resolveStartPort } from '../start.js';

describe('resolveStartPort — priorité --port > daemon.port > défaut (fiche 0032)', () => {
  let dir: string;

  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  it('lit daemon.port de cop1.config.yaml quand --port est absent', () => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-0032-'));
    writeFileSync(join(dir, 'cop1.config.yaml'), 'daemon:\n  port: 5555\n');
    expect(resolveStartPort(undefined, dir)).toBe(5555);
  });

  it('--port explicite prime sur la config', () => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-0032-'));
    writeFileSync(join(dir, 'cop1.config.yaml'), 'daemon:\n  port: 5555\n');
    expect(resolveStartPort('6666', dir)).toBe(6666);
  });

  it('sans config ni option : défaut 4242 inchangé — via les defaults du schéma, sans warn', () => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-0032-'));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveStartPort(undefined, dir)).toBe(4242);
    expect(warn).not.toHaveBeenCalled();
    warn.mockRestore();
  });

  it('config invalide sans --port : warn visible + défaut (ne bloque pas le démarrage)', () => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-0032-'));
    // port < 1024 → violation du schéma (min 1024)
    writeFileSync(join(dir, 'cop1.config.yaml'), 'daemon:\n  port: 99\n');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveStartPort(undefined, dir)).toBe(4242);
    expect(warn).toHaveBeenCalledOnce();
    warn.mockRestore();
  });

  it("--port présent : la config n'est pas lue (une config cassée ne gêne pas)", () => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-0032-'));
    writeFileSync(join(dir, 'cop1.config.yaml'), '{yaml: [cassé');
    expect(resolveStartPort('7777', dir)).toBe(7777);
  });
});
