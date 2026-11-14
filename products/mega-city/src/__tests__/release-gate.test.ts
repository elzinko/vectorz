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
  skippedTestsResult,
  substitute,
  testsPass,
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

  it('resolveRelease.tests : absent → null, chaîne → commande, vide → null', () => {
    expect(resolveRelease(undefined).tests).toBeNull();
    expect(resolveRelease({}).tests).toBeNull();
    expect(resolveRelease({ tests: 'pnpm --dir products/mega-city gate' }).tests).toBe(
      'pnpm --dir products/mega-city gate',
    );
    expect(resolveRelease({ tests: '   ' }).tests).toBeNull();
    expect(resolveRelease({ tests: null }).tests).toBeNull();
  });

  it('resolveRelease.tests : une valeur non-chaîne est REFUSÉE, en nommant la clé et la valeur', () => {
    expect(() => resolveRelease({ tests: 42 })).toThrow(/release\.tests/);
    expect(() => resolveRelease({ tests: 42 })).toThrow(/42/);
    expect(() => resolveRelease({ tests: true })).toThrow(/release\.tests/);
    expect(() => resolveRelease({ tests: ['pnpm', 'test'] })).toThrow(/release\.tests/);
  });

  it('la passe tests : commande → passe à jouer ; absente → null (sera sautée)', () => {
    expect(testsPass(null)).toBeNull();
    expect(testsPass('pnpm test')).toEqual({ id: 'tests', title: expect.any(String), command: 'pnpm test' });
  });

  it('skippedTestsResult : sautée, ni GO muet ni NO-GO', () => {
    const r = skippedTestsResult();
    expect(r.id).toBe('tests');
    expect(r.skipped).toBe(true);
    expect(r.go).toBe(true);
    expect(r.detail).toMatch(/release\.tests/);
  });

  it('agrégation à trois états : une passe sautée ne bloque pas, une NO-GO bloque', () => {
    const go: PassResult = { id: 'a', title: 'A', command: 'x', go: true };
    const skip: PassResult = skippedTestsResult();
    const no: PassResult = { id: 'b', title: 'B', command: 'y', go: false };
    expect(aggregate([go, skip])).toBe('GO'); // le skip ne bloque pas
    expect(aggregate([skip])).toBe('GO');
    expect(aggregate([go, skip, no])).toBe('NO-GO'); // un NO-GO bloque malgré le skip
  });

  it('le compte rendu dit « sautée » pour une passe skip, sans la compter NO-GO', () => {
    const v: ReleaseVerdict = {
      version: 'v0.24.0',
      verdict: 'GO',
      passes: [skippedTestsResult()],
      at: '2026-11-15T00:00:00Z',
    };
    const out = renderReleaseReport(v);
    expect(out).toContain('SKIP');
    expect(out).toContain('tests');
    expect(out).toContain('release.tests');
    expect(out).not.toContain('NO-GO');
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

  it('sans fichier de passes → l’OBJET DEFAULT_PASSES lui-même (le bin y branche la passe tests du socle)', () => {
    // `bin/ezk-release.ts` n'ajoute la passe « tests » que quand `loadReleasePasses` a renvoyé le
    // socle, détecté par `passes === DEFAULT_PASSES`. Si un jour ce loader rend une COPIE, la passe
    // tests disparaîtrait en silence : ce test l'épingle pour que la régression soit visible.
    expect(loadReleasePasses(root)).toBe(DEFAULT_PASSES);
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
