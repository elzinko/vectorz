import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupervisionService } from '../application/SupervisionService.js';

const PRESUMED_DEAD_AFTER_MIN = 5;
const PRESUMED_DEAD_AFTER_MS = PRESUMED_DEAD_AFTER_MIN * 60_000;

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

function isoMinutesFromNow(minutes: number): string {
  return new Date(Date.now() + minutes * 60_000).toISOString();
}

function writeRun(runDir: string, lines: string[]): void {
  writeFileSync(join(runDir, 'events.jsonl'), `${lines.join('\n')}\n`);
}

function runStarted(runId: string, seq: number, ts: string): string {
  return JSON.stringify({
    event_id: `e${seq}`,
    run_id: runId,
    seq,
    ts,
    contract: 'cop1/supervisability@0.1',
    type: 'run.started',
    payload: { method: { name: 'synthetic', version: '1.0.0' }, seat: 'pilot' },
  });
}

function gateReached(runId: string, seq: number, ts: string, gateId: string): string {
  return JSON.stringify({
    event_id: `e${seq}`,
    run_id: runId,
    seq,
    ts,
    contract: 'cop1/supervisability@0.1',
    type: 'gate.reached',
    payload: { gate_id: gateId, outcome: 'ok', upgrade_ok: false },
  });
}

describe('SupervisionService', () => {
  let testDir: string;
  let eventBus: EventBus;
  let service: SupervisionService;

  beforeEach(() => {
    testDir = mkdtempSync(join(tmpdir(), 'supervision-service-'));
    eventBus = new EventBus();
    service = new SupervisionService({
      eventBus,
      presumedDeadAfterMs: PRESUMED_DEAD_AFTER_MS,
    });
    vi.useFakeTimers();
  });

  afterEach(() => {
    service.stop();
    vi.useRealTimers();
    rmSync(testDir, { recursive: true, force: true });
  });

  it("absorbe un run et l'expose via getSnapshots()", () => {
    writeRun(testDir, [runStarted('run-1', 1, new Date().toISOString())]);

    const snapshot = service.absorb(testDir, testDir);

    expect(snapshot.runId).toBe('run-1');
    expect(snapshot.state).toBe('running');
    expect(snapshot.liveness).toBe('alive');
    expect(snapshot.emissionClass).toBe('B');
    expect(service.getSnapshots()).toEqual([snapshot]);
  });

  it('émet supervision.run.updated avec le snapshot entier en payload', () => {
    writeRun(testDir, [runStarted('run-1', 1, new Date().toISOString())]);
    const received: unknown[] = [];
    eventBus.on('supervision.run.updated', (payload) => received.push(payload));

    const snapshot = service.absorb(testDir, testDir);

    expect(received).toEqual([snapshot]);
  });

  it("renseigne lastAbsorbedAt (horloge serveur) à l'absorption, distinct du ts déclaré", () => {
    const declaredTs = isoMinutesAgo(42);
    writeRun(testDir, [runStarted('run-1', 1, declaredTs)]);
    const absorbedAt = new Date();
    vi.setSystemTime(absorbedAt);

    const snapshot = service.absorb(testDir, testDir);

    expect(snapshot.lastAbsorbedAt).toBe(absorbedAt.toISOString());
    // Le ts déclaré reste dans le snapshot à titre informatif, mais diffère.
    expect(snapshot.lastEventTs).toBe(declaredTs);
  });

  it('déclenche presumed_dead après le seuil écoulé depuis lastAbsorbedAt (état "running")', () => {
    writeRun(testDir, [runStarted('run-1', 1, new Date().toISOString())]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MS);

    const [snapshot] = service.getSnapshots();
    expect(snapshot?.state).toBe('running');
    expect(snapshot?.liveness).toBe('presumed_dead');
  });

  it('ADR-035 — abandonCapable survit à la transition SSE presumed_dead', () => {
    service.stop();
    service = new SupervisionService({
      eventBus,
      presumedDeadAfterMs: PRESUMED_DEAD_AFTER_MS,
      abandonCapable: true,
    });
    writeRun(testDir, [runStarted('run-1', 1, new Date().toISOString())]);

    const absorbed = service.absorb(testDir, testDir);
    expect(absorbed.abandonCapable).toBe(true);
    expect(absorbed.liveness).toBe('alive');

    const emitted: unknown[] = [];
    eventBus.on('supervision.run.updated', (payload) => {
      emitted.push(payload);
    });

    vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MS);

    const dead = service.getSnapshots()[0];
    expect(dead?.liveness).toBe('presumed_dead');
    expect(dead?.abandonCapable).toBe(true);
    const last = emitted[emitted.length - 1] as { abandonCapable?: boolean; liveness?: string };
    expect(last.liveness).toBe('presumed_dead');
    expect(last.abandonCapable).toBe(true);
  });

  it("un ts déclaré illisible n'arme pas un timer NaN (pas de presumed_dead immédiat)", () => {
    writeRun(testDir, [runStarted('run-1', 1, 'ceci-nest-pas-une-date')]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(0);

    expect(service.getSnapshots()[0]?.liveness).toBe('alive');

    vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MS);
    expect(service.getSnapshots()[0]?.liveness).toBe('presumed_dead');
  });

  it('un ts déclaré dans le futur ne repousse pas la détection de presumed_dead', () => {
    writeRun(testDir, [runStarted('run-1', 1, isoMinutesFromNow(60 * 24 * 30))]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MS - 1);
    expect(service.getSnapshots()[0]?.liveness).toBe('alive');

    vi.advanceTimersByTime(1);
    expect(service.getSnapshots()[0]?.liveness).toBe('presumed_dead');
  });

  it('un silence prolongé en état "at_gate" ne déclenche jamais presumed_dead', () => {
    writeRun(testDir, [
      runStarted('run-1', 1, isoMinutesAgo(PRESUMED_DEAD_AFTER_MIN + 10)),
      gateReached('run-1', 2, isoMinutesAgo(PRESUMED_DEAD_AFTER_MIN + 1), 'gate-1'),
    ]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(10 * 60_000);

    const [snapshot] = service.getSnapshots();
    expect(snapshot?.state).toBe('at_gate');
    expect(snapshot?.liveness).toBe('alive');
  });

  it("deux runs déclarant le même run_id (journal semi-hostile) dans des runDir distincts ne s'écrasent pas", () => {
    const runDirA = mkdtempSync(join(tmpdir(), 'supervision-service-dup-a-'));
    const runDirB = mkdtempSync(join(tmpdir(), 'supervision-service-dup-b-'));
    try {
      writeRun(runDirA, [runStarted('collision-id', 1, new Date().toISOString())]);
      writeRun(runDirB, [runStarted('collision-id', 1, new Date().toISOString())]);

      service.absorb(runDirA, runDirA);
      service.absorb(runDirB, runDirB);

      const snapshots = service.getSnapshots();
      expect(snapshots).toHaveLength(2);
      const runDirs = snapshots.map((s) => s.runDir).sort();
      expect(runDirs).toEqual([runDirA, runDirB].sort());
      // runId reste un champ d'affichage : les deux peuvent le partager.
      expect(snapshots.every((s) => s.runId === 'collision-id')).toBe(true);
    } finally {
      rmSync(runDirA, { recursive: true, force: true });
      rmSync(runDirB, { recursive: true, force: true });
    }
  });

  it("le timer presumed_dead d'un run ne perturbe pas un autre run déclarant le même run_id (cross-talk)", () => {
    const runDirA = mkdtempSync(join(tmpdir(), 'supervision-service-dup-a-'));
    const runDirB = mkdtempSync(join(tmpdir(), 'supervision-service-dup-b-'));
    try {
      writeRun(runDirA, [runStarted('collision-id', 1, new Date().toISOString())]);
      service.absorb(runDirA, runDirA);

      // B absorbé plus tard : son horloge d'absorption est postérieure, donc
      // son timer doit rester armé plus longtemps que celui de A.
      vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MS - 1000);
      writeRun(runDirB, [runStarted('collision-id', 1, new Date().toISOString())]);
      service.absorb(runDirB, runDirB);

      // A atteint son seuil : seul A doit passer presumed_dead.
      vi.advanceTimersByTime(1000);
      const byDir = (dir: string) => service.getSnapshots().find((s) => s.runDir === dir);
      expect(byDir(runDirA)?.liveness).toBe('presumed_dead');
      expect(byDir(runDirB)?.liveness).toBe('alive');
    } finally {
      rmSync(runDirA, { recursive: true, force: true });
      rmSync(runDirB, { recursive: true, force: true });
    }
  });

  it('un dossier découvert avant events.jsonl (clé basename) puis re-projeté avec un runId différent ne crée pas de fantôme', () => {
    // runDir stable, runId potentiellement différent d'une absorption à l'autre
    // (ex. le fichier n'existait pas encore lors de la découverte initiale).
    const runDir = mkdtempSync(join(tmpdir(), 'supervision-service-ghost-'));
    try {
      // Première absorption : basename(runDir) sert de runId de repli côté
      // journal-validator (voir projectRun) tant qu'aucun events.jsonl n'existe.
      const first = service.absorb(runDir, runDir);
      expect(first.violations.length).toBeGreaterThan(0);

      writeRun(runDir, [runStarted('run-reel', 1, new Date().toISOString())]);
      const second = service.absorb(runDir, runDir);

      expect(second.runId).toBe('run-reel');
      // Une seule entrée pour ce runDir, jamais deux (pas de clé runId fantôme).
      expect(service.getSnapshots()).toHaveLength(1);
      expect(service.getSnapshots()[0]?.runDir).toBe(runDir);
    } finally {
      rmSync(runDir, { recursive: true, force: true });
    }
  });

  it('absorb() ne lance jamais quand events.jsonl est en réalité un dossier (EISDIR) : violation exposée, pas de crash', () => {
    // Un journal semi-hostile peut avoir été mal initialisé côté émetteur
    // (ex. `mkdir -p .supervision/runs/x/events.jsonl`) : la lecture doit
    // rester un échec « doux » — jamais une exception non rattrapée.
    mkdirSync(join(testDir, 'events.jsonl'));

    expect(() => service.absorb(testDir, testDir)).not.toThrow();

    const [snapshot] = service.getSnapshots();
    expect(snapshot?.violations.some((v) => v.code === 'watcher.read_error')).toBe(true);
    expect(snapshot?.liveness).toBe('alive');
  });

  it('un run "running" avec activité récente ne devient pas presumed_dead avant le seuil', () => {
    writeRun(testDir, [runStarted('run-1', 1, new Date().toISOString())]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MS - 1000);

    const [snapshot] = service.getSnapshots();
    expect(snapshot?.liveness).toBe('alive');
  });
});
