import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_REFERENCE,
  type DesignSystemVerdict,
  decideDesignSystem,
  resolveDesignSystem,
} from '../core/design-system-review.js';
import {
  designSystemConfig,
  loadReleasePasses,
  readDesignSystemVerdict,
  writeDesignSystemVerdict,
} from '../loaders/release-passes.js';

describe('resolveDesignSystem — le chemin du référentiel', () => {
  it('retombe sur le défaut .rules/design-system.md', () => {
    expect(resolveDesignSystem(undefined).reference).toBe(DEFAULT_REFERENCE);
    expect(resolveDesignSystem({}).reference).toBe(DEFAULT_REFERENCE);
    expect(resolveDesignSystem({ design_system: {} }).reference).toBe(DEFAULT_REFERENCE);
    expect(resolveDesignSystem({ design_system: { reference: '   ' } }).reference).toBe(DEFAULT_REFERENCE);
  });

  it('honore un chemin configuré (release.design_system.reference)', () => {
    expect(resolveDesignSystem({ design_system: { reference: 'docs/ui/charte.md' } }).reference).toBe('docs/ui/charte.md');
  });
});

describe('decideDesignSystem — la décision de la passe', () => {
  const base = { version: 'v0.24.0', reference: DEFAULT_REFERENCE };

  it('référentiel absent → SKIP (GO, exit 0), sans bloquer', () => {
    const out = decideDesignSystem({ ...base, referencePresent: false });
    expect(out.status).toBe('skip');
    expect(out.exitCode).toBe(0);
    expect(out.report).toContain('sautée');
  });

  it('référentiel présent, aucun verdict → PENDING (NO-GO, exit 1)', () => {
    const out = decideDesignSystem({ ...base, referencePresent: true });
    expect(out.status).toBe('pending');
    expect(out.exitCode).toBe(1);
    expect(out.report).toContain('en attente');
  });

  it('verdict GO → GO (exit 0)', () => {
    const verdict: DesignSystemVerdict = { version: 'v0.24.0', verdict: 'GO', gaps: [], at: '2026-10-27T00:00:00.000Z' };
    const out = decideDesignSystem({ ...base, referencePresent: true, verdict });
    expect(out.status).toBe('go');
    expect(out.exitCode).toBe(0);
  });

  it('verdict NO-GO → NO-GO (exit 1) en nommant les écarts', () => {
    const verdict: DesignSystemVerdict = {
      version: 'v0.24.0',
      verdict: 'NO-GO',
      gaps: ['bouton primaire hors palette (#f00 au lieu du token --accent)', 'espacement 7px hors échelle (4/8/16)'],
      at: '2026-10-27T00:00:00.000Z',
    };
    const out = decideDesignSystem({ ...base, referencePresent: true, verdict });
    expect(out.status).toBe('no-go');
    expect(out.exitCode).toBe(1);
    expect(out.report).toContain('hors palette');
    expect(out.report).toContain('hors échelle');
  });

  it('verdict NO-GO sans écart → reste NO-GO (exit 1), le signale', () => {
    const verdict: DesignSystemVerdict = { version: 'v0.24.0', verdict: 'NO-GO', gaps: [], at: '2026-10-27T00:00:00.000Z' };
    const out = decideDesignSystem({ ...base, referencePresent: true, verdict });
    expect(out.exitCode).toBe(1);
    expect(out.report).toContain('sans écart nommé');
  });
});

describe('loader design-system — config + verdict + composition', () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'ds-review-'));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  it('designSystemConfig lit release.design_system.reference depuis .vectorz/config.yml', () => {
    const cfgDir = join(dir, '.vectorz');
    mkdirSync(cfgDir, { recursive: true });
    writeFileSync(join(cfgDir, 'config.yml'), 'release:\n  design_system:\n    reference: docs/charte.md\n');
    expect(designSystemConfig(dir).reference).toBe('docs/charte.md');
  });

  it('designSystemConfig retombe sur le défaut sans config', () => {
    expect(designSystemConfig(dir).reference).toBe(DEFAULT_REFERENCE);
  });

  it('écrit puis relit un verdict design-system (roundtrip)', () => {
    const verdict: DesignSystemVerdict = {
      version: 'v0.24.0',
      verdict: 'NO-GO',
      gaps: ['header non conforme'],
      at: '2026-10-27T00:00:00.000Z',
      head: 'abc1234',
    };
    const file = writeDesignSystemVerdict(dir, verdict);
    expect(file).toContain('v0.24.0.design-system.json');
    expect(readDesignSystemVerdict(dir, 'v0.24.0')).toEqual(verdict);
    expect(readDesignSystemVerdict(dir, 'v0.99.0')).toBeUndefined();
  });

  it('composition : la passe design-system se déclare en donnée, sans toucher au skill', () => {
    const cfgDir = join(dir, '.vectorz');
    mkdirSync(cfgDir, { recursive: true });
    writeFileSync(
      join(cfgDir, 'release-passes.yml'),
      [
        'passes:',
        '  - id: dod-mecanique',
        '    title: DoD mécanique',
        '    command: ezk --root {root} backlog version check {version}',
        '  - id: design-system',
        '    title: Revue design-system',
        '    command: ezk --root {root} design check {version}',
        '',
      ].join('\n'),
    );
    const passes = loadReleasePasses(dir);
    const ds = passes.find((p) => p.id === 'design-system');
    expect(ds).toBeDefined();
    expect(ds?.command).toBe('ezk --root {root} design check {version}');
  });
});
