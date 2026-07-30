import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { REGISTRY_FILENAME } from '../../supervision/infrastructure/registry.js';
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
        // Budget RAM volontairement > RAM physique de toute machine : le
        // câblage supervision ne doit PAS dépendre de la validation RAM
        // (défaut 48GB > les 16GB des runners CI — cause du rouge historique
        // sur main, même famille d'échec silencieux que la fiche 0033).
        'resources:',
        '  ram_budget_night_gb: 99999',
        '  ram_budget_day_gb: 99999',
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

      // La découverte est normalement quasi immédiate (scan initial +
      // debounce ~80ms), et `vi.waitFor` court-circuite dès succès : ce budget
      // n'est PAS le temps attendu, c'est de la marge contre la famine CPU d'un
      // runner CI chargé, où timers et polling dérivent bien au-delà de 2s
      // (flake observé à ~2074ms, pile au mur de l'ancien budget). 10s de marge,
      // happy-path toujours ~100ms.
      await vi.waitFor(
        async () => {
          const res = await fetch('http://127.0.0.1:14245/api/supervision/runs');
          const data = (await res.json()) as Array<{ runId: string }>;
          expect(data.some((snapshot) => snapshot.runId === 'run-a')).toBe(true);
        },
        { timeout: 10000, interval: 30 },
      );
    } finally {
      await wired.stop();
    }
  });

  it('dérive watch_roots depuis supervision.registry.yaml quand présent (fiche 0082)', async () => {
    // Créer le registre avec le testDir comme racine du projet
    writeFileSync(
      join(testDir, REGISTRY_FILENAME),
      ['projects:', '  - id: test-project', '    path: .', '    method: mega-city'].join('\n'),
    );

    // Créer un run dans le répertoire supervisé (le testDir lui-même, chemin ".")
    const runsDir = join(testDir, '.supervision', 'runs', 'run-from-registry');
    mkdirSync(runsDir, { recursive: true });
    writeFileSync(
      join(runsDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: 'run-from-registry',
        seq: 1,
        ts: new Date().toISOString(),
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'mega-city', version: '1.0.0' }, seat: 'pilot' },
      })}\n`,
    );

    // Le daemon doit découvrir ce run grâce au registre (sans cop1.config.yaml)
    const registryDaemon = new DaemonService({ port: 14247, projectPath: testDir });
    try {
      await registryDaemon.start();

      await vi.waitFor(
        async () => {
          const res = await fetch('http://127.0.0.1:14247/api/supervision/runs');
          const data = (await res.json()) as Array<{ runId: string }>;
          expect(data.some((snapshot) => snapshot.runId === 'run-from-registry')).toBe(true);
        },
        { timeout: 10000, interval: 30 },
      );
    } finally {
      await registryDaemon.stop();
    }
  });

  it('sans registre et sans config YAML → supervision dormante (non-régression v1)', async () => {
    // Ni supervision.registry.yaml ni cop1.config.yaml → supervision dormante
    const d = new DaemonService({ port: 14248, projectPath: testDir });
    try {
      await d.start();
      const res = await fetch('http://127.0.0.1:14248/api/supervision/runs');
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual([]);
    } finally {
      await d.stop();
    }
  });

  it('registre invalide → pas de fallback YAML watch_roots (fiche 0082 / Codex)', async () => {
    writeFileSync(join(testDir, REGISTRY_FILENAME), 'projects: not-an-array\n');
    writeFileSync(
      join(testDir, 'cop1.config.yaml'),
      [
        'budget:',
        '  sprint_max_tokens: 1000000',
        '  alert_thresholds: [50, 80, 95]',
        '  auto_pause: true',
        'resources:',
        '  ram_budget_night_gb: 99999',
        '  ram_budget_day_gb: 99999',
        'supervision:',
        `  watch_roots: ["${testDir.replace(/\\/g, '/')}"]`,
        '  presumed_dead_after_min: 5',
        '',
      ].join('\n'),
    );
    const runsDir = join(testDir, '.supervision', 'runs', 'run-stale');
    mkdirSync(runsDir, { recursive: true });
    writeFileSync(
      join(runsDir, 'events.jsonl'),
      `${JSON.stringify({
        event_id: 'e1',
        run_id: 'run-stale',
        seq: 1,
        ts: new Date().toISOString(),
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'mega-city', version: '1.0.0' }, seat: 'pilot' },
      })}\n`,
    );

    const d = new DaemonService({ port: 14249, projectPath: testDir });
    try {
      await d.start();
      const res = await fetch('http://127.0.0.1:14249/api/supervision/runs');
      expect(res.status).toBe(200);
      // Registre invalide ⇒ pas de watchers, même si YAML listait une racine
      expect(await res.json()).toEqual([]);
    } finally {
      await d.stop();
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
