/**
 * Oracle `analyze --expect` (fiche 0169) : compare un journal déjà résumé par
 * `analyzeSession`/`summarizeRun` à une séquence attendue déclarative.
 */
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { describe, expect, it } from 'vitest';
import { summarizeRun } from '../analyze.js';
import { Journal } from '../journal.js';
import { loadScenario, matchRunToScenario, type Scenario } from '../expect.js';

const fixturesDir = path.join(path.dirname(new URL(import.meta.url).pathname), 'fixtures');

function tmpProject(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'mega-city-expect-'));
}

describe('matchRunToScenario (fiche 0169)', () => {
  it('conforme : run started + heartbeats + finished(success) satisfait le scénario complet', () => {
    const root = tmpProject();
    const runId = 'run-ok';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'ezk-sprint', version: '1.0.0' } });
    journal.append('heartbeat', { note: 'a' });
    journal.append('heartbeat', { note: 'b' });
    journal.append('gate.reached', { gate_id: 'demo-gate-1', outcome: 'ok' });
    journal.append('gate.resumed', { gate_event_id: 'x' });
    journal.append('run.finished', { status: 'success' });

    const run = summarizeRun(root, runId);
    const scenario: Scenario = {
      steps: [
        { type: 'run.started' },
        { type: 'heartbeat', min: 1 },
        { type: 'gate.reached', gate_id: 'demo-gate-1' },
        { type: 'gate.resumed' },
        { type: 'run.finished', status: 'success' },
      ],
    };

    const result = matchRunToScenario(run, scenario);
    expect(result.ok).toBe(true);
    expect(result.mismatches).toEqual([]);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('divergent : run orphelin (fixture « un seul run.started ») ne satisfait pas la séquence complète', () => {
    // Fixture figeant le cas réel 0105/0168 : le run s'arrête après run.started, jamais de run.finished.
    const root = tmpProject();
    const runId = 'orphan-run';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    fs.mkdirSync(runDir, { recursive: true });
    fs.copyFileSync(
      path.join(fixturesDir, 'orphan-run-started-only.jsonl'),
      path.join(runDir, 'events.jsonl'),
    );

    const run = summarizeRun(root, runId);
    const scenario: Scenario = {
      steps: [
        { type: 'run.started' },
        { type: 'heartbeat', min: 1 },
        { type: 'run.finished', status: 'success' },
      ],
    };

    const result = matchRunToScenario(run, scenario);
    expect(result.ok).toBe(false);
    expect(result.mismatches.length).toBeGreaterThan(0);
    expect(result.mismatches[0]).toMatch(/heartbeat/);
    expect(result.mismatches[0]).toMatch(/fin du run/i);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('divergent : contrainte de champ non respectée (gate_id différent)', () => {
    const root = tmpProject();
    const runId = 'run-wrong-gate';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'm', version: '1' } });
    journal.append('gate.reached', { gate_id: 'autre-gate', outcome: 'ok' });
    journal.append('run.finished', { status: 'success' });

    const run = summarizeRun(root, runId);
    const scenario: Scenario = {
      steps: [
        { type: 'run.started' },
        { type: 'gate.reached', gate_id: 'demo-gate-1' },
        { type: 'run.finished', status: 'success' },
      ],
    };

    const result = matchRunToScenario(run, scenario);
    expect(result.ok).toBe(false);
    expect(result.mismatches.some((m) => m.includes('gate_id'))).toBe(true);

    fs.rmSync(root, { recursive: true, force: true });
  });

  it('divergent : type d\'event différent à la position attendue, message lisible', () => {
    const root = tmpProject();
    const runId = 'run-wrong-type';
    const runDir = path.join(root, '.supervision', 'runs', runId);
    const journal = new Journal(runDir, runId);
    journal.append('run.started', { method: { name: 'm', version: '1' } });
    journal.append('run.finished', { status: 'success' });

    const run = summarizeRun(root, runId);
    const scenario: Scenario = {
      steps: [
        { type: 'run.started' },
        { type: 'gate.reached', gate_id: 'demo-gate-1' },
        { type: 'run.finished', status: 'success' },
      ],
    };

    const result = matchRunToScenario(run, scenario);
    expect(result.ok).toBe(false);
    expect(result.mismatches[0]).toMatch(/gate\.reached/);
    expect(result.mismatches[0]).toMatch(/run\.finished/);

    fs.rmSync(root, { recursive: true, force: true });
  });
});

describe('loadScenario (fiche 0169)', () => {
  it('charge un scénario JSON valide', () => {
    const root = tmpProject();
    const file = path.join(root, 'scenario.json');
    fs.writeFileSync(
      file,
      JSON.stringify({
        name: 'demo',
        steps: [{ type: 'run.started' }, { type: 'run.finished', status: 'success' }],
      }),
    );
    const scenario = loadScenario(file);
    expect(scenario.name).toBe('demo');
    expect(scenario.steps).toHaveLength(2);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('refuse un scénario sans steps (tableau non vide) avec un message clair', () => {
    const root = tmpProject();
    const file = path.join(root, 'scenario.json');
    fs.writeFileSync(file, JSON.stringify({ steps: [] }));
    expect(() => loadScenario(file)).toThrow(/steps/i);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('refuse un step sans champ type avec un message clair', () => {
    const root = tmpProject();
    const file = path.join(root, 'scenario.json');
    fs.writeFileSync(file, JSON.stringify({ steps: [{ gate_id: 'x' }] }));
    expect(() => loadScenario(file)).toThrow(/type/i);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('refuse un JSON invalide avec un message clair', () => {
    const root = tmpProject();
    const file = path.join(root, 'scenario.json');
    fs.writeFileSync(file, '{ not json');
    expect(() => loadScenario(file)).toThrow();
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('refuse un fichier introuvable avec un message clair (pas de ENOENT brut)', () => {
    const root = tmpProject();
    const file = path.join(root, 'absent.json');
    expect(() => loadScenario(file)).toThrow(/introuvable ou illisible/i);
    fs.rmSync(root, { recursive: true, force: true });
  });

  it('refuse un step avec min invalide (négatif) avec un message clair', () => {
    const root = tmpProject();
    const file = path.join(root, 'scenario.json');
    fs.writeFileSync(file, JSON.stringify({ steps: [{ type: 'heartbeat', min: -1 }] }));
    expect(() => loadScenario(file)).toThrow(/min/i);
    fs.rmSync(root, { recursive: true, force: true });
  });
});
