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

  it('--port présent : une config cassée ne bloque pas la résolution', () => {
    dir = mkdtempSync(join(tmpdir(), 'cop1-0032-'));
    writeFileSync(join(dir, 'cop1.config.yaml'), '{yaml: [cassé');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    expect(resolveStartPort('7777', dir)).toBe(7777);
    warn.mockRestore();
  });

  describe('fail-fast budget RAM (fiche 0033, volet 1)', () => {
    it('ram_budget_* utilisateur > RAM physique : resolveStartPort JETTE (jamais de timeout muet)', () => {
      dir = mkdtempSync(join(tmpdir(), 'cop1-0033-'));
      writeFileSync(join(dir, 'cop1.config.yaml'), 'resources:\n  ram_budget_night_gb: 999999\n');
      expect(() => resolveStartPort(undefined, dir)).toThrow(/ram_budget_night_gb/);
    });

    it("le message nomme le champ, la valeur et la RAM détectée + l'action", () => {
      dir = mkdtempSync(join(tmpdir(), 'cop1-0033-'));
      writeFileSync(join(dir, 'cop1.config.yaml'), 'resources:\n  ram_budget_night_gb: 999999\n');
      try {
        resolveStartPort(undefined, dir);
        expect.unreachable('resolveStartPort aurait dû jeter');
      } catch (err) {
        const msg = String(err);
        expect(msg).toContain('ram_budget_night_gb');
        expect(msg).toContain('999999');
        expect(msg).toMatch(/total RAM|RAM physique/);
        expect(msg).toContain('cop1.config.yaml');
      }
    });

    it('fail-fast même avec --port explicite (la santé de la config prime)', () => {
      dir = mkdtempSync(join(tmpdir(), 'cop1-0033-'));
      writeFileSync(join(dir, 'cop1.config.yaml'), 'resources:\n  ram_budget_night_gb: 999999\n');
      expect(() => resolveStartPort('7777', dir)).toThrow(/ram_budget_night_gb/);
    });

    it('config vierge : démarre sans erreur (défauts clampés à la machine)', () => {
      dir = mkdtempSync(join(tmpdir(), 'cop1-0033-'));
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(resolveStartPort(undefined, dir)).toBe(4242);
      expect(warn).not.toHaveBeenCalled();
      warn.mockRestore();
    });
  });
});
