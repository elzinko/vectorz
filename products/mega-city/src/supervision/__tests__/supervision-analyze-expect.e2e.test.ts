/**
 * E2E de `supervision:analyze --expect <scenario>` (fiche 0169) : le code retour
 * process doit être exploitable en CI (0 conforme / non-nul divergent).
 */
import { execFileSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Journal } from '../journal.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const megaCityDir = path.resolve(__dirname, '../../..');
const analyzeEntry = path.join(megaCityDir, 'bin', 'supervision-analyze.ts');
const tsxBin = path.join(megaCityDir, 'node_modules', '.bin', 'tsx');

let projectRoot: string;

function runAnalyze(args: string[]): { status: number; stdout: string; stderr: string } {
  try {
    const stdout = execFileSync(tsxBin, [analyzeEntry, projectRoot, ...args], { encoding: 'utf8' });
    return { status: 0, stdout, stderr: '' };
  } catch (error) {
    const e = error as { status: number; stdout: string; stderr: string };
    return { status: e.status ?? 1, stdout: e.stdout ?? '', stderr: e.stderr ?? '' };
  }
}

function writeScenario(steps: unknown[]): string {
  const file = path.join(projectRoot, 'scenario.json');
  fs.writeFileSync(file, JSON.stringify({ steps }, null, 2));
  return file;
}

beforeEach(() => {
  projectRoot = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-analyze-expect-e2e-')));
});

afterEach(() => {
  fs.rmSync(projectRoot, { recursive: true, force: true });
});

describe('supervision:analyze --expect — E2E code retour CI', () => {
  it('exit 0 quand le journal est conforme au scénario', () => {
    const runId = 'run-ok';
    const runDir = path.join(projectRoot, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'm', version: '1' } });
    journal.append('heartbeat', { note: 'x' });
    journal.append('run.finished', { status: 'success' });

    const scenarioFile = writeScenario([
      { type: 'run.started' },
      { type: 'heartbeat', min: 1 },
      { type: 'run.finished', status: 'success' },
    ]);

    const result = runAnalyze(['--run', runId, '--expect', scenarioFile]);
    expect(result.status).toBe(0);
  });

  it('exit non-nul quand le journal diverge (run orphelin, run.finished attendu absent)', () => {
    const runId = 'run-orphan';
    const runDir = path.join(projectRoot, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'm', version: '1' } });

    const scenarioFile = writeScenario([
      { type: 'run.started' },
      { type: 'heartbeat', min: 1 },
      { type: 'run.finished', status: 'success' },
    ]);

    const result = runAnalyze(['--run', runId, '--expect', scenarioFile]);
    expect(result.status).not.toBe(0);
    expect(result.stdout + result.stderr).toMatch(/heartbeat/);
  });

  it("exit 2 (erreur d'usage) quand le fichier scénario est introuvable — distinct du 1 « divergent »", () => {
    const runId = 'run-x';
    const runDir = path.join(projectRoot, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'm', version: '1' } });

    const result = runAnalyze(['--run', runId, '--expect', path.join(projectRoot, 'absent.json')]);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/introuvable/i);
  });

  it('exit 2 quand --run pointe un run inexistant (pas un faux « divergent »)', () => {
    const scenarioFile = writeScenario([{ type: 'run.started' }]);
    const result = runAnalyze(['--run', 'run-fantome', '--expect', scenarioFile]);
    expect(result.status).toBe(2);
    expect(result.stderr).toMatch(/introuvable/i);
  });

  it("exit 2 quand --expect est passé sans fichier (pas de faux-vert en mode rapport)", () => {
    const result = runAnalyze(['--expect']);
    expect(result.status).toBe(2);
  });
});
