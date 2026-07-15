import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { JournalWatcherAdapter } from '../infrastructure/JournalWatcherAdapter.js';

// `fs.watch` neutralisé pour tout ce fichier (retourne un watcher muet, qui
// ne délivre jamais d'événement) : simule le cas documenté par Node où
// `fs.watch` peut manquer des changements sous forte charge (CI, nombreux
// processus concurrents). Isole ainsi la preuve que c'est bien le rescan
// périodique de secours qui permet la découverte — pas un hasard de timing
// avec le vrai `fs.watch` (voir JournalWatcherAdapter.test.ts pour les tests
// contre le vrai `fs.watch`, non mocké).
vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    watch: vi.fn(() => ({ close: () => {} })),
  };
});

const RUN_STARTED_LINE = JSON.stringify({
  event_id: 'e1',
  run_id: 'watched-run',
  seq: 1,
  ts: new Date().toISOString(),
  contract: 'cop1/supervisability@0.1',
  type: 'run.started',
  payload: { method: { name: 'synthetic', version: '1.0.0' }, seat: 'pilot' },
});

describe('JournalWatcherAdapter — filet de rescan périodique (fake timers, fs.watch neutralisé)', () => {
  let projectRoot: string;
  let adapter: JournalWatcherAdapter | null;

  beforeEach(() => {
    projectRoot = mkdtempSync(join(tmpdir(), 'journal-watcher-rescan-'));
    adapter = null;
    vi.useFakeTimers();
  });

  afterEach(() => {
    adapter?.stop();
    vi.useRealTimers();
    rmSync(projectRoot, { recursive: true, force: true });
  });

  it('redécouvre un dossier de run manqué par fs.watch via le rescan périodique', () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      rescanIntervalMs: 1000,
      debounceMs: 10,
    });
    adapter.start();

    const runDir = join(runsDir, 'missed-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    // fs.watch est muet (mocké) : sans le rescan, ce run ne serait jamais découvert.
    expect(changes).not.toContain(runDir);

    vi.advanceTimersByTime(1000); // tick du rescan
    vi.advanceTimersByTime(10); // laisse le debounce qu'il déclenche s'écouler
    expect(changes).toContain(runDir);
  });

  it('redéclenche une notification quand events.jsonl change silencieusement (mtime/size), sans événement fs.watch délivré', () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    const runDir = join(runsDir, 'silent-run');
    mkdirSync(runDir, { recursive: true });
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      rescanIntervalMs: 1000,
      debounceMs: 10,
    });
    adapter.start();

    // Scan initial (synchrone) : le run est découvert une première fois dès
    // que le debounce s'écoule.
    vi.advanceTimersByTime(10);
    expect(changes).toEqual([runDir]);

    // Écriture "silencieuse" : fs.watch (mocké muet) ne la signale jamais.
    // Seul le rescan, en comparant mtime/size, doit la détecter.
    writeFileSync(join(runDir, 'events.jsonl'), `${RUN_STARTED_LINE}\nextra\n`, { flag: 'a' });

    vi.advanceTimersByTime(1000); // tick du rescan
    vi.advanceTimersByTime(10); // laisse le debounce qu'il déclenche s'écouler

    expect(changes.filter((dir) => dir === runDir).length).toBeGreaterThan(1);
  });

  it('respecte le cap MAX_WATCHED_RUN_DIRS et le confinement realpath même via le rescan', () => {
    const runsDir = join(projectRoot, '.supervision', 'runs');
    mkdirSync(runsDir, { recursive: true });

    const warnings: string[] = [];
    const changes: string[] = [];
    adapter = new JournalWatcherAdapter([projectRoot], (_root, dir) => changes.push(dir), {
      rescanIntervalMs: 1000,
      debounceMs: 10,
      maxWatchedRunDirs: 1,
      logger: { warn: (message) => warnings.push(message), error: () => {} },
    });
    adapter.start();

    const runDirA = join(runsDir, 'run-a');
    const runDirB = join(runsDir, 'run-b');
    mkdirSync(runDirA, { recursive: true });
    writeFileSync(join(runDirA, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);
    mkdirSync(runDirB, { recursive: true });
    writeFileSync(join(runDirB, 'events.jsonl'), `${RUN_STARTED_LINE}\n`);

    vi.advanceTimersByTime(1000); // tick du rescan
    vi.advanceTimersByTime(10); // laisse le debounce qu'il déclenche s'écouler
    // Les deux sont découverts au moins une fois (le rescan ne bloque jamais
    // la découverte), mais le cap est bien atteint et journalisé.
    expect(new Set(changes)).toEqual(new Set([runDirA, runDirB]));
    expect(warnings.some((w) => w.includes('limite'))).toBe(true);
  });
});
