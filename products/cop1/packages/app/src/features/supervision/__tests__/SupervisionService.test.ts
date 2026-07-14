import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { EventBus } from '@cop1/shared-kernel';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SupervisionService } from '../application/SupervisionService.js';

const PRESUMED_DEAD_AFTER_MIN = 5;

function isoMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
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
      presumedDeadAfterMs: PRESUMED_DEAD_AFTER_MIN * 60_000,
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

  it('un silence prolongé en état "running" déclenche presumed_dead', () => {
    writeRun(testDir, [runStarted('run-1', 1, isoMinutesAgo(PRESUMED_DEAD_AFTER_MIN + 1))]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(0);

    const [snapshot] = service.getSnapshots();
    expect(snapshot?.state).toBe('running');
    expect(snapshot?.liveness).toBe('presumed_dead');
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

  it('un run "running" avec activité récente ne devient pas presumed_dead avant le seuil', () => {
    writeRun(testDir, [runStarted('run-1', 1, new Date().toISOString())]);

    service.absorb(testDir, testDir);
    vi.advanceTimersByTime(PRESUMED_DEAD_AFTER_MIN * 60_000 - 1000);

    const [snapshot] = service.getSnapshots();
    expect(snapshot?.liveness).toBe('alive');
  });
});
