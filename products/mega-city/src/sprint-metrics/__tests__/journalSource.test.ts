import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { SupervisionJournalSource } from '../adapters/journalSource.js';

let projectRoot: string;

function writeRunEvents(runId: string, lines: Record<string, unknown>[]): void {
  const runDir = join(projectRoot, '.supervision', 'runs', runId);
  mkdirSync(runDir, { recursive: true });
  const body = lines.map((l) => JSON.stringify(l)).join('\n') + '\n';
  writeFileSync(join(runDir, 'events.jsonl'), body, 'utf8');
}

function envelope(seq: number, ts: string, type: string, payload: Record<string, unknown>) {
  return { event_id: `evt-${seq}`, run_id: 'run-1', seq, ts, contract: 'cop1/supervisability@0.1', type, payload };
}

beforeEach(() => {
  projectRoot = mkdtempSync(join(tmpdir(), 'sprint-metrics-journal-'));
});

describe('SupervisionJournalSource (fixtures synthétiques, journal réel sur disque)', () => {
  it('extrait les 2 gates sprint-<slug>-checkpoint et ignore les autres gates', () => {
    writeRunEvents('run-1', [
      envelope(1, '2026-08-30T08:00:00.000Z', 'run.started', { method: { name: 'ezk-sprint', version: '1' } }),
      envelope(2, '2026-08-30T09:00:00.000Z', 'gate.reached', { gate_id: 'sprint-un-checkpoint', outcome: 'go' }),
      envelope(3, '2026-08-30T09:30:00.000Z', 'gate.reached', { gate_id: 'archi-review', outcome: 'go' }),
      envelope(4, '2026-08-30T11:00:00.000Z', 'gate.reached', { gate_id: 'sprint-deux-checkpoint', outcome: 'go' }),
    ]);

    const source = new SupervisionJournalSource();
    expect(source.listSprintCheckpoints(projectRoot)).toEqual([
      { ts: '2026-08-30T09:00:00.000Z', slug: 'un' },
      { ts: '2026-08-30T11:00:00.000Z', slug: 'deux' },
    ]);
    expect(source.earliestRunStartedTs(projectRoot)).toBe('2026-08-30T08:00:00.000Z');
  });

  it('extrait uniquement les escalades de type "blocked" (pas "authority")', () => {
    writeRunEvents('run-1', [
      envelope(1, '2026-08-30T09:15:00.000Z', 'escalation', { type: 'blocked', detail: 'CI rouge' }),
      envelope(2, '2026-08-30T09:20:00.000Z', 'escalation', { type: 'authority', detail: 'décision PO' }),
    ]);

    const source = new SupervisionJournalSource();
    expect(source.listBlockedEscalations(projectRoot)).toEqual([{ ts: '2026-08-30T09:15:00.000Z', detail: 'CI rouge' }]);
  });

  it('agrège plusieurs runs (toutes runs confondues)', () => {
    writeRunEvents('run-1', [envelope(1, '2026-08-30T09:00:00.000Z', 'gate.reached', { gate_id: 'sprint-un-checkpoint' })]);
    writeRunEvents('run-2', [envelope(1, '2026-08-30T11:00:00.000Z', 'gate.reached', { gate_id: 'sprint-deux-checkpoint' })]);

    const source = new SupervisionJournalSource();
    expect(source.listSprintCheckpoints(projectRoot)).toHaveLength(2);
  });

  it('aucun run → listes vides, jamais d’exception', () => {
    const source = new SupervisionJournalSource();
    expect(source.listSprintCheckpoints(projectRoot)).toEqual([]);
    expect(source.listBlockedEscalations(projectRoot)).toEqual([]);
    expect(source.earliestRunStartedTs(projectRoot)).toBeUndefined();
  });
});
