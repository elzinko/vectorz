import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_PASSES,
  type PassResult,
  type ReleaseVerdict,
  aggregate,
  renderReleaseReport,
  resolveRelease,
  substitute,
} from '../core/release-gate.js';
import {
  loadReleasePasses,
  readReleaseVerdict,
  releaseConfig,
  writeReleaseVerdict,
} from '../loaders/release-passes.js';

describe('release-gate — cœur pur', () => {
  it('substitue {root} et {version}', () => {
    expect(substitute('ezk --root {root} backlog version check {version}', { root: '/r', version: 'v0.11.0' })).toBe(
      'ezk --root /r backlog version check v0.11.0',
    );
  });

  it('GO seulement si toutes les passes sont GO', () => {
    const go: PassResult = { id: 'a', title: 'A', command: 'x', go: true };
    const no: PassResult = { id: 'b', title: 'B', command: 'y', go: false };
    expect(aggregate([go, go])).toBe('GO');
    expect(aggregate([go, no])).toBe('NO-GO');
    expect(aggregate([])).toBe('GO'); // zéro passe = rien ne bloque
  });

  it('resolveRelease : défaut actif, off seulement sur false/"off"', () => {
    expect(resolveRelease(undefined).gate).toBe(true);
    expect(resolveRelease({}).gate).toBe(true);
    expect(resolveRelease({ gate: true }).gate).toBe(true);
    expect(resolveRelease({ gate: 'nimportequoi' }).gate).toBe(true); // faute de frappe = reste actif
    expect(resolveRelease({ gate: false }).gate).toBe(false);
    expect(resolveRelease({ gate: 'off' }).gate).toBe(false);
  });

  it('le compte rendu NO-GO nomme la passe bloquante', () => {
    const v: ReleaseVerdict = {
      version: 'v0.11.0',
      verdict: 'NO-GO',
      passes: [{ id: 'chasse-aux-bugs', title: 'Chasse', command: 't', go: false, detail: 'régression X' }],
      at: '2026-10-13T00:00:00Z',
    };
    const out = renderReleaseReport(v);
    expect(out).toContain('NO-GO');
    expect(out).toContain('chasse-aux-bugs');
    expect(out).toContain('régression X');
  });

  it('les passes du socle sont dod-mecanique puis chasse-aux-bugs', () => {
    expect(DEFAULT_PASSES.map((p) => p.id)).toEqual(['dod-mecanique', 'chasse-aux-bugs']);
  });
});

describe('release-gate — loader (I/O)', () => {
  let root: string;
  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'ezk-release-'));
  });
  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  it('sans fichier de passes → passes par défaut', () => {
    expect(loadReleasePasses(root).map((p) => p.id)).toEqual(['dod-mecanique', 'chasse-aux-bugs']);
  });

  it('avec .vectorz/release-passes.yml → passes déclarées (composable, +1 passe)', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(
      join(root, '.vectorz', 'release-passes.yml'),
      'passes:\n' +
        '  - id: dod-mecanique\n    title: DoD\n    command: "true"\n' +
        '  - id: design-system\n    title: Revue design-system\n    command: "true"\n',
      'utf8',
    );
    expect(loadReleasePasses(root).map((p) => p.id)).toEqual(['dod-mecanique', 'design-system']);
  });

  it('fichier de passes malformé → erreur claire (jamais de repli silencieux)', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'release-passes.yml'), 'passes:\n  - id: x\n', 'utf8');
    expect(() => loadReleasePasses(root)).toThrow(/invalide/);
  });

  it('release.gate: off coupe la gate ; absent la laisse active', () => {
    expect(releaseConfig(root).gate).toBe(true);
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'config.yml'), 'release:\n  gate: off\n', 'utf8');
    expect(releaseConfig(root).gate).toBe(false);
  });

  it('verdict : écriture puis relecture (round-trip)', () => {
    const v: ReleaseVerdict = {
      version: 'v0.11.0',
      verdict: 'GO',
      passes: [{ id: 'dod-mecanique', title: 'DoD', command: 'true', go: true }],
      at: '2026-10-13T00:00:00Z',
      head: 'abc1234',
    };
    const file = writeReleaseVerdict(root, v);
    expect(existsSync(file)).toBe(true);
    expect(readReleaseVerdict(root, 'v0.11.0')).toEqual(v);
    expect(readReleaseVerdict(root, 'v0.12.0')).toBeUndefined();
  });
});
