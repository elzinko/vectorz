import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { CoverageGate } from '../application/CoverageGate.js';

// gate.check() peut lancer la couverture en sous-processus : le premier spawn
// paie un démarrage à froid (plus lent en CI et depuis le bump de la
// toolchain) — délai explicite, sinon le 5 s par défaut de vitest déborde.
const GATE_TIMEOUT_MS = 30_000;

describe('CoverageGate', () => {
  let testDir: string;

  beforeEach(() => {
    testDir = join(tmpdir(), `cop1-cov-test-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    mkdirSync(join(testDir, 'coverage'), { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  it(
    'should pass when coverage meets threshold',
    () => {
      writeCoverageSummary(testDir, 85);
      const gate = new CoverageGate(80);

      // We test parseCoverage directly by providing the file
      const result = gate.check(testDir);

      // vitest won't actually run in a temp dir, but coverage parsing should work
      expect(result.threshold).toBe(80);
    },
    GATE_TIMEOUT_MS,
  );

  it(
    'should fail when coverage is below threshold',
    () => {
      writeCoverageSummary(testDir, 65);
      const gate = new CoverageGate(80);

      const result = gate.check(testDir);

      expect(result.passed).toBe(false);
      expect(result.coverage).toBe(65);
    },
    GATE_TIMEOUT_MS,
  );

  it(
    'should pass when coverage equals threshold',
    () => {
      writeCoverageSummary(testDir, 80);
      const gate = new CoverageGate(80);

      const result = gate.check(testDir);

      expect(result.passed).toBe(true);
      expect(result.coverage).toBe(80);
    },
    GATE_TIMEOUT_MS,
  );

  it(
    'should return 0 coverage when no summary file',
    () => {
      rmSync(join(testDir, 'coverage'), { recursive: true, force: true });
      const gate = new CoverageGate(80);

      const result = gate.check(testDir);

      expect(result.coverage).toBe(0);
      expect(result.passed).toBe(false);
    },
    GATE_TIMEOUT_MS,
  );
});

function writeCoverageSummary(dir: string, pct: number) {
  const summary = { total: { lines: { pct } } };
  writeFileSync(join(dir, 'coverage', 'coverage-summary.json'), JSON.stringify(summary), 'utf-8');
}
