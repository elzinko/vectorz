import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { JournalWatcherAdapter } from '../infrastructure/JournalWatcherAdapter.js';

function waitFor(predicate: () => boolean, timeoutMs = 2000, intervalMs = 20): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const tick = () => {
      if (predicate()) {
        resolve();
        return;
      }
      if (Date.now() - start > timeoutMs) {
        reject(new Error('waitFor timed out'));
        return;
      }
      setTimeout(tick, intervalMs);
    };
    tick();
  });
}

const RUN_STARTED_LINE = JSON.stringify({
  event_id: 'e1',
  run_id: 'watched-run',
  seq: 1,
  ts: new Date().toISOString(),
  contract: 'cop1/supervisability@0.1',
  type: 'run.started',
  payload: { method: { name: 'synthetic', version: '1.0.0' }, seat: 'pilot' },
});

describe('JournalWatcherAdapter (fs réel, pas de mock)', () => {
  let projectRoot: string;
  let adapter: JournalWatcherAdapter | null;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'journal-watcher-'));
    adapter = null;
  });

  afterEach(() => {
    adapter?.stop();
    rmSync(projectRoot, { recursive: true, force: true });
  });

  it('découvre un run déjà présent au démarrage du daemon', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    const runDir = join(runsDir, 'pre-existing-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    const changes: Array<{ projectRoot: string; runDir: string }> = [];
    adapter = new JournalWatcherAdapter([projectRoot], (root, dir) => {
      changes.push({ projectRoot: root, runDir: dir });
    });
    adapter.start();

    await waitFor(() => changes.some((c) => c.runDir === runDir));

    expect(changes.some((c) => c.runDir === runDir && c.projectRoot === projectRoot)).toBe(true);
  });

  it('découvre un run créé pendant que le daemon tourne, sans redémarrage', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const changes: Array<{ projectRoot: string; runDir: string }> = [];
    adapter = new JournalWatcherAdapter([projectRoot], (root, dir) => {
      changes.push({ projectRoot: root, runDir: dir });
    });
    adapter.start();

    const runDir = join(runsDir, 'new-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    await waitFor(() => changes.some((c) => c.runDir === runDir));

    expect(changes.some((c) => c.runDir === runDir)).toBe(true);
  });

  it('détecte les écritures ultérieures dans un run déjà connu (au fil de leur écriture)', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    const runDir = join(runsDir, 'growing-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    const changes: Array<{ projectRoot: string; runDir: string }> = [];
    adapter = new JournalWatcherAdapter([projectRoot], (root, dir) => {
      changes.push({ projectRoot: root, runDir: dir });
    });
    adapter.start();

    await waitFor(() => changes.some((c) => c.runDir === runDir));
    const countAfterDiscovery = changes.length;

    writeFileSync(
      join(runDir, 'events.jsonl'),
      `${RUN_STARTED_LINE}\n${JSON.stringify({
        event_id: 'e2',
        run_id: 'watched-run',
        seq: 2,
        ts: new Date().toISOString(),
        contract: 'cop1/supervisability@0.1',
        type: 'gate.reached',
        payload: { gate_id: 'gate-1', outcome: 'ok', upgrade_ok: false },
      })}\n`,
      { flag: 'a' },
    );

    await waitFor(() => changes.length > countAfterDiscovery);

    expect(changes.length).toBeGreaterThan(countAfterDiscovery);
  });
});
