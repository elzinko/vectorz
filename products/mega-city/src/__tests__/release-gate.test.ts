import { mkdtempSync, rmSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_PASSES,
  type PassResult,
  type PassVerdict,
  type ReleaseVerdict,
  aggregate,
  decidePassVerdict,
  gateRefusal,
  effectivePasses,
  renderReleaseReport,
  resolveRelease,
  skippedTestsResult,
  substitute,
  testsPass,
} from '../core/release-gate.js';
import {
  addProjectPass,
  loadEffectivePasses,
  readPassVerdict,
  readProjectPasses,
  latestReleaseVerdict,
  readReleaseVerdict,
  releaseConfig,
  removeProjectPass,
  verdictPath,
  writePassVerdict,
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

  it('effectivePasses : complète par défaut (socle + tests + projet), avec les sources', () => {
    const project = [{ id: 'deps', title: 'Deps', command: 'x' }];
    const eff = effectivePasses(project, false, null);
    expect(eff.map((p) => p.id)).toEqual(['dod-mecanique', 'chasse-aux-bugs', 'tests', 'deps']);
    expect(eff.map((p) => p.source)).toEqual(['defaut', 'defaut', 'defaut', 'projet']);
    expect(eff.find((p) => p.id === 'tests')?.run).toBe(false); // tests sans commande → sautée
  });

  it('effectivePasses : release.tests présent → la passe tests se joue avec la commande', () => {
    const eff = effectivePasses([], false, 'pnpm test');
    const tests = eff.find((p) => p.id === 'tests');
    expect(tests?.run).toBe(true);
    expect(tests?.command).toBe('pnpm test');
  });

  it('effectivePasses : replace → le projet seul, sans socle ni tests', () => {
    const eff = effectivePasses([{ id: 'a', title: 'A', command: 'x' }], true, 'pnpm test');
    expect(eff.map((p) => p.id)).toEqual(['a']);
    expect(eff[0]?.source).toBe('projet');
  });

  it('effectivePasses : un id projet qui écrase le socle est REFUSÉ (hors replace)', () => {
    expect(() => effectivePasses([{ id: 'dod-mecanique', title: 'X', command: 'x' }], false, null)).toThrow(
      /dod-mecanique/,
    );
    expect(() => effectivePasses([{ id: 'tests', title: 'X', command: 'x' }], false, null)).toThrow(/replace/);
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

  it('decidePassVerdict : aucun verdict → NO-GO, « à poser »', () => {
    const d = decidePassVerdict(undefined, 'abc123');
    expect(d.go).toBe(false);
    expect(d.detail).toMatch(/aucun verdict/);
  });

  it('decidePassVerdict : GO posé sur HEAD → GO', () => {
    const v: PassVerdict = { version: 'v0.24.0', passe: 'chasse-aux-bugs', verdict: 'GO', motif: 'ok', at: 'now', head: 'abc123' };
    expect(decidePassVerdict(v, 'abc123').go).toBe(true);
  });

  it('decidePassVerdict : GO posé sur un AUTRE commit → NO-GO périmé, les deux commits nommés', () => {
    const v: PassVerdict = { version: 'v0.24.0', passe: 'chasse-aux-bugs', verdict: 'GO', motif: 'ok', at: 'now', head: 'old11111' };
    const d = decidePassVerdict(v, 'new22222');
    expect(d.go).toBe(false);
    expect(d.detail).toMatch(/périmé/);
    expect(d.detail).toContain('old11111');
    expect(d.detail).toContain('new22222');
  });

  it('decidePassVerdict : verdict NO-GO → NO-GO avec son motif', () => {
    const v: PassVerdict = { version: 'v0.24.0', passe: 'chasse-aux-bugs', verdict: 'NO-GO', motif: 'régression login', at: 'now', head: 'abc123' };
    const d = decidePassVerdict(v, 'abc123');
    expect(d.go).toBe(false);
    expect(d.detail).toContain('régression login');
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

  it('sans fichier de passes → le socle effectif : dod, chasse, tests (sautée), source defaut', () => {
    const eff = loadEffectivePasses(root);
    expect(eff.map((p) => p.id)).toEqual(['dod-mecanique', 'chasse-aux-bugs', 'tests']);
    expect(eff.every((p) => p.source === 'defaut')).toBe(true);
    expect(eff.find((p) => p.id === 'tests')?.run).toBe(false); // pas de release.tests ici
  });

  it('readProjectPasses : lit les passes du projet et le drapeau replace', () => {
    expect(readProjectPasses(root)).toEqual({ passes: [], replace: false });
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(
      join(root, '.vectorz', 'release-passes.yml'),
      'replace: true\npasses:\n  - id: a\n    title: A\n    command: x\n',
      'utf8',
    );
    const r = readProjectPasses(root);
    expect(r.replace).toBe(true);
    expect(r.passes.map((p) => p.id)).toEqual(['a']);
  });

  it('release-passes.yml sans replace → le projet COMPLÈTE le socle', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(
      join(root, '.vectorz', 'release-passes.yml'),
      'passes:\n  - id: deps-sante\n    title: Santé des dépendances\n    command: "true"\n',
      'utf8',
    );
    const eff = loadEffectivePasses(root);
    expect(eff.map((p) => p.id)).toEqual(['dod-mecanique', 'chasse-aux-bugs', 'tests', 'deps-sante']);
    expect(eff.find((p) => p.id === 'deps-sante')?.source).toBe('projet');
  });

  it('release-passes.yml avec replace: true → le projet REMPLACE le socle', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(
      join(root, '.vectorz', 'release-passes.yml'),
      'replace: true\n' +
        'passes:\n' +
        '  - id: dod-mecanique\n    title: DoD\n    command: "true"\n' +
        '  - id: design-system\n    title: Revue design-system\n    command: "true"\n',
      'utf8',
    );
    const eff = loadEffectivePasses(root);
    expect(eff.map((p) => p.id)).toEqual(['dod-mecanique', 'design-system']); // ni chasse, ni tests
    expect(eff.every((p) => p.source === 'projet')).toBe(true);
  });

  it('fichier de passes malformé → erreur claire (jamais de repli silencieux)', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(join(root, '.vectorz', 'release-passes.yml'), 'passes:\n  - id: x\n', 'utf8');
    expect(() => readProjectPasses(root)).toThrow(/invalide/);
  });

  it('un drapeau replace non-booléen est REFUSÉ (jamais ignoré en silence)', () => {
    mkdirSync(join(root, '.vectorz'), { recursive: true });
    writeFileSync(
      join(root, '.vectorz', 'release-passes.yml'),
      'replace: "yes"\npasses:\n  - id: a\n    title: A\n    command: x\n',
      'utf8',
    );
    expect(() => readProjectPasses(root)).toThrow(/replace/);
  });

  it('addProjectPass : écrit une passe projet relue par readProjectPasses', () => {
    const file = addProjectPass(root, { id: 'deps-sante', title: 'Santé des dépendances', command: 'pnpm audit' });
    expect(existsSync(file)).toBe(true);
    const { passes, replace } = readProjectPasses(root);
    expect(replace).toBe(false);
    expect(passes).toEqual([{ id: 'deps-sante', title: 'Santé des dépendances', command: 'pnpm audit' }]);
  });

  it('addProjectPass : une 2e passe s’ajoute sans écraser la 1re', () => {
    addProjectPass(root, { id: 'a', title: 'A', command: 'x' });
    addProjectPass(root, { id: 'b', title: 'B', command: 'y' });
    expect(readProjectPasses(root).passes.map((p) => p.id)).toEqual(['a', 'b']);
  });

  it('removeProjectPass : retire une passe projet, laisse les autres ; false si absente', () => {
    addProjectPass(root, { id: 'a', title: 'A', command: 'x' });
    addProjectPass(root, { id: 'b', title: 'B', command: 'y' });
    expect(removeProjectPass(root, 'a')).toBe(true);
    expect(readProjectPasses(root).passes.map((p) => p.id)).toEqual(['b']);
    expect(removeProjectPass(root, 'absente')).toBe(false);
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

  it('dernier verdict : le plus récent des verdicts de version, ni les passes ni le design-system ; aucun → undefined', () => {
    expect(latestReleaseVerdict(root)).toBeUndefined();
    const ancien: ReleaseVerdict = { version: 'v0.12.0', verdict: 'GO', passes: [], at: '2026-10-20T00:00:00Z' };
    const recent: ReleaseVerdict = { version: 'v0.11.0', verdict: 'NO-GO', passes: [], at: '2026-10-21T00:00:00Z' };
    writeReleaseVerdict(root, ancien);
    writeReleaseVerdict(root, recent);
    writePassVerdict(root, { version: 'v0.13.0', passe: 'chasse-aux-bugs', verdict: 'GO', motif: 'ok', auteur: 't', at: '2026-10-22T00:00:00Z' });
    expect(latestReleaseVerdict(root)).toEqual(recent);
  });

  it('dernier verdict : un fichier illisible est écarté sans planter, un `at` illisible ne masque pas un verdict daté', () => {
    const sansDate = { version: 'v0.10.0', verdict: 'GO', passes: [], at: 'pas une date' } as ReleaseVerdict;
    const date: ReleaseVerdict = { version: 'v0.9.0', verdict: 'NO-GO', passes: [], at: '2026-10-21T00:00:00Z' };
    writeReleaseVerdict(root, sansDate);
    writeReleaseVerdict(root, date);
    writeFileSync(verdictPath(root, 'v0.8.0'), '{ à moitié écrit', 'utf8');
    expect(latestReleaseVerdict(root)).toEqual(date);
  });

  it('verdict de passe : écriture puis relecture (round-trip)', () => {
    const v: PassVerdict = {
      version: 'v0.24.0',
      passe: 'chasse-aux-bugs',
      verdict: 'GO',
      motif: 'parcours du lot rejoués, aucun bug bloquant',
      auteur: 'Thomas',
      at: '2026-11-15T00:00:00Z',
      head: 'abc1234',
    };
    const file = writePassVerdict(root, v);
    expect(existsSync(file)).toBe(true);
    expect(readPassVerdict(root, 'v0.24.0', 'chasse-aux-bugs')).toEqual(v);
    expect(readPassVerdict(root, 'v0.24.0', 'autre')).toBeUndefined();
  });
});

describe('gateRefusal', () => {
  const verdict = (extra: Partial<ReleaseVerdict>): ReleaseVerdict => ({
    version: 'v0.24.0',
    verdict: 'GO',
    passes: [],
    at: '2026-11-17T10:00:00Z',
    head: 'abcdef012345',
    ...extra,
  });

  it('ne refuse pas un GO établi sur HEAD', () => {
    expect(gateRefusal(verdict({}), 'abcdef012345', 'v0.24.0')).toBeUndefined();
  });

  it('refuse sans verdict, en disant quoi lancer', () => {
    expect(gateRefusal(undefined, 'abcdef012345', 'v0.24.0')).toContain('ezk release v0.24.0');
  });

  it('refuse un verdict périmé (autre commit)', () => {
    expect(gateRefusal(verdict({}), '999999999999', 'v0.24.0')).toContain('périmée');
  });

  it('refuse un NO-GO en nommant les passes bloquantes', () => {
    const nogo = verdict({ verdict: 'NO-GO', passes: [{ id: 'tests', title: 't', command: 'x', go: false }] });
    expect(gateRefusal(nogo, 'abcdef012345', 'v0.24.0')).toContain('tests');
  });
});
