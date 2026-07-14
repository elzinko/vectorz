import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JournalWatcherAdapter } from '../infrastructure/JournalWatcherAdapter.js';

// Filet de sécurité pour ces tests contre le vrai `fs.watch` : sous forte
// charge (pleine suite en parallèle), `fs.watch` peut manquer/retarder ses
// événements (doc Node) — un rescanIntervalMs court rend la découverte
// déterministe sans dépendre de la fiabilité brute de fs.watch.
const RESCAN_BACKSTOP_MS = 200;

function waitFor(predicate: () => boolean, timeoutMs = 20000, intervalMs = 20): Promise<void> {
  return vi.waitFor(
    () => {
      if (!predicate()) throw new Error('condition not met yet');
    },
    { timeout: timeoutMs, interval: intervalMs },
  );
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
    adapter = new JournalWatcherAdapter(
      [projectRoot],
      (root, dir) => {
        changes.push({ projectRoot: root, runDir: dir });
      },
      { rescanIntervalMs: RESCAN_BACKSTOP_MS },
    );
    adapter.start();

    await waitFor(() => changes.some((c) => c.runDir === runDir));

    expect(changes.some((c) => c.runDir === runDir && c.projectRoot === projectRoot)).toBe(true);
  }, 30000);

  it('découvre un run créé pendant que le daemon tourne, sans redémarrage', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const changes: Array<{ projectRoot: string; runDir: string }> = [];
    adapter = new JournalWatcherAdapter(
      [projectRoot],
      (root, dir) => {
        changes.push({ projectRoot: root, runDir: dir });
      },
      { rescanIntervalMs: RESCAN_BACKSTOP_MS },
    );
    adapter.start();

    const runDir = join(runsDir, 'new-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    await waitFor(() => changes.some((c) => c.runDir === runDir));

    expect(changes.some((c) => c.runDir === runDir)).toBe(true);
  }, 30000);

  it('détecte les écritures ultérieures dans un run déjà connu (au fil de leur écriture)', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    const runDir = join(runsDir, 'growing-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    const changes: Array<{ projectRoot: string; runDir: string }> = [];
    adapter = new JournalWatcherAdapter(
      [projectRoot],
      (root, dir) => {
        changes.push({ projectRoot: root, runDir: dir });
      },
      { rescanIntervalMs: RESCAN_BACKSTOP_MS },
    );
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
  }, 30000);

  it("une erreur levée par onRunChanged n'interrompt pas le watcher (pas de crash, juste journalisée)", async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const errors: unknown[] = [];
    let calls = 0;
    adapter = new JournalWatcherAdapter(
      [projectRoot],
      () => {
        calls += 1;
        if (calls === 1) throw new Error('boom');
      },
      {
        logger: { warn: () => {}, error: (_message, error) => errors.push(error) },
        rescanIntervalMs: RESCAN_BACKSTOP_MS,
      },
    );
    adapter.start();

    const firstRunDir = join(runsDir, 'run-a');
    mkdirSync(firstRunDir, { recursive: true });
    writeFileSync(join(firstRunDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    await waitFor(() => calls >= 1);
    expect(errors).toHaveLength(1);

    const secondRunDir = join(runsDir, 'run-b');
    mkdirSync(secondRunDir, { recursive: true });
    writeFileSync(join(secondRunDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    await waitFor(() => calls >= 2);
  }, 30000);

  it('ignore les fichiers déposés directement dans runs/ (seuls les dossiers sont surveillés)', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      rescanIntervalMs: RESCAN_BACKSTOP_MS,
    });
    adapter.start();

    writeFileSync(join(runsDir, 'not-a-run-dir.txt'), 'contenu quelconque');

    const legitRunDir = join(runsDir, 'legit-run');
    mkdirSync(legitRunDir, { recursive: true });
    writeFileSync(join(legitRunDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    await waitFor(() => changes.includes(legitRunDir));

    expect(changes).not.toContain(join(runsDir, 'not-a-run-dir.txt'));
  }, 30000);

  it('cap le nombre de dossiers de run surveillés en continu (protection EMFILE)', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });
    const CAP = 2;
    for (let i = 0; i < CAP + 1; i++) {
      const dir = join(runsDir, `run-${i}`);
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);
    }

    const warnings: string[] = [];
    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      maxWatchedRunDirs: CAP,
      logger: { warn: (message) => warnings.push(message), error: () => {} },
      // Pas de rescanIntervalMs court ici : ce test vérifie que le cap tient
      // dans la fenêtre d'observation (600ms) sans le filet de rescan (par
      // défaut 30s, hors de cette fenêtre) — voir JournalWatcherAdapter.rescan.test.ts
      // pour la preuve déterministe (fake timers) que le rescan finit par
      // rattraper les dossiers hors cap.
    });
    adapter.start();

    // Les CAP+1 dossiers sont tous découverts au scan initial (pas de cap sur la découverte).
    await waitFor(() => new Set(changes).size >= CAP + 1);
    expect(warnings.length).toBeGreaterThan(0);

    changes.length = 0;
    for (let i = 0; i < CAP + 1; i++) {
      writeFileSync(join(runsDir, `run-${i}`, 'events.jsonl'), `${RUN_STARTED_LINE}\n`, {
        flag: 'a',
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Au plus CAP dossiers restent surveillés en continu au-delà de la découverte initiale.
    expect(new Set(changes).size).toBeLessThanOrEqual(CAP);
  }, 30000);

  it('ignore un dossier de run symlinké hors du watch_root (fuite via symlink)', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const outsideDir = mkdtempSync(join(tmpdir(), 'journal-watcher-outside-'));
    writeFileSync(join(outsideDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);
    const leakDir = join(runsDir, 'leak');
    symlinkSync(outsideDir, leakDir, 'dir');

    const legitRunDir = join(runsDir, 'legit-run');
    mkdirSync(legitRunDir, { recursive: true });
    writeFileSync(join(legitRunDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    const warnings: string[] = [];
    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      logger: { warn: (message) => warnings.push(message), error: () => {} },
      rescanIntervalMs: RESCAN_BACKSTOP_MS,
    });
    try {
      adapter.start();
      await waitFor(() => changes.includes(legitRunDir));
      await waitFor(() => warnings.some((w) => w.includes(leakDir)));

      expect(changes).not.toContain(leakDir);
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  }, 30000);

  it('ignore un events.jsonl symlinké hors du watch_root, même si le dossier de run est légitime', async () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    const runDir = join(runsDir, 'sneaky-run');
    mkdirSync(runDir, { recursive: true });

    const outsideDir = mkdtempSync(join(tmpdir(), 'journal-watcher-outside-'));
    const outsideFile = join(outsideDir, 'secret.jsonl');
    writeFileSync(outsideFile, `${RUN_STARTED_LINE}\n`);
    symlinkSync(outsideFile, join(runDir, 'events.jsonl'));

    const warnings: string[] = [];
    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      logger: { warn: (message) => warnings.push(message), error: () => {} },
      rescanIntervalMs: RESCAN_BACKSTOP_MS,
    });
    try {
      adapter.start();
      await waitFor(() => warnings.some((w) => w.includes(runDir)));

      expect(changes).not.toContain(runDir);
    } finally {
      rmSync(outsideDir, { recursive: true, force: true });
    }
  }, 30000);
});
