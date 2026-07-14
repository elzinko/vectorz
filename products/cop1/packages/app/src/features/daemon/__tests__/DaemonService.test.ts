import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DaemonService } from '../application/DaemonService.js';
import { PidFileManager } from '../infrastructure/PidFileManager.js';

describe('DaemonService', () => {
  let testDir: string;
  let daemon: DaemonService;
  const TEST_PORT = 14243;

  beforeEach(() => {
    testDir = join(
      tmpdir(),
      `cop1-daemon-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
    mkdirSync(testDir, { recursive: true });
    daemon = new DaemonService({ port: TEST_PORT, projectPath: testDir });
  });

  afterEach(async () => {
    await daemon.stop();
    rmSync(testDir, { recursive: true, force: true });
  });

  it('should start and create PID file', async () => {
    await daemon.start();

    const pidManager = new PidFileManager(testDir);
    const pid = pidManager.read();
    expect(pid).toBe(process.pid);
  });

  it('should respond to health check after start', async () => {
    await daemon.start();

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/health`);
    expect(res.status).toBe(200);

    const data = (await res.json()) as { status: string };
    expect(data.status).toBe('ok');
  });

  it('wires GET /api/blocages from the composition root (fiche 0021)', async () => {
    await daemon.start();

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/blocages`);
    // A 200 (not 404) proves the daemon constructed the BlockageService +
    // BlocageApiHandler and set it on the HttpServer.
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('should clean up PID file on stop', async () => {
    await daemon.start();

    const pidManager = new PidFileManager(testDir);
    expect(pidManager.exists()).toBe(true);

    await daemon.stop();
    expect(pidManager.exists()).toBe(false);
  });

  it('should not throw when stopping without starting', async () => {
    await expect(daemon.stop()).resolves.toBeUndefined();
  });

  it('supervision reste dormante quand cop1.config.yaml est absent (watch_roots=[])', async () => {
    await daemon.start();

    const res = await fetch(`http://127.0.0.1:${TEST_PORT}/api/supervision/runs`);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([]);
  });

  it('découvre un run existant via GET /api/supervision/runs quand supervision.watch_roots est configuré (fiche 0031)', async () => {
    writeFileSync(
      join(testDir, 'cop1.config.yaml'),
      [
        'budget:',
        '  sprint_max_tokens: 1000000',
        '  alert_thresholds: [50, 80, 95]',
        '  auto_pause: true',
        'supervision:',
        `  watch_roots: ["${testDir.replace(/\\/g, '/')}"]`,
        '  presumed_dead_after_min: 5',
        '',
      ].join('\n'),
    );
    const runsDir = join(testDir, '.supervision', 'runs', 'run-a');
    mkdirSync(runsDir, { recursive: true });
    writeFileSync(
      join(runsDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: 'run-a',
        seq: 1,
        ts: new Date().toISOString(),
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'synthetic', version: '1.0.0' }, seat: 'pilot' },
      })}\n`,
    );

    // La config doit exister AVANT la construction du daemon : le chargement
    // est one-shot dans le constructeur (pas de hot-reload des watch-roots, YAGNI).
    const wired = new DaemonService({ port: 14245, projectPath: testDir });
    try {
      await wired.start();

      const found = await waitForCondition(async () => {
        const res = await fetch('http://127.0.0.1:14245/api/supervision/runs');
        const data = (await res.json()) as Array<{ runId: string }>;
        return data.some((snapshot) => snapshot.runId === 'run-a');
      });
      expect(found).toBe(true);
    } finally {
      await wired.stop();
    }
  });

  it('bridges its own EventBus to /events SSE (load-bearing wiring, B1)', async () => {
    const eventBus = new EventBus();
    const wired = new DaemonService({ port: 14244, projectPath: testDir, eventBus });
    try {
      await wired.start();

      const res = await fetch('http://127.0.0.1:14244/events');
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      if (reader) {
        await reader.read(); // :ok

        eventBus.emit('orchestrator.run.started', { epicId: 'EA1' });

        const { value } = await reader.read();
        const text = decoder.decode(value);
        expect(text).toContain('orchestrator.run.started');

        reader.cancel();
      }
    } finally {
      await wired.stop();
    }
  });
});

async function waitForCondition(
  predicate: () => Promise<boolean>,
  timeoutMs = 2000,
  intervalMs = 30,
): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await predicate()) return true;
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  return false;
}
