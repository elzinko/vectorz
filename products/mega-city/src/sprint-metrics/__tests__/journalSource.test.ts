import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { SupervisionJournalSource, resolveSupervisionRoot } from '../adapters/journalSource.js';

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
      { ts: '2026-08-30T09:00:00.000Z', slug: 'un', runId: 'run-1' },
      { ts: '2026-08-30T11:00:00.000Z', slug: 'deux', runId: 'run-1' },
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
    // Le run courant = le plus récent par id (run-2 > run-1 lexicographiquement).
    expect(source.latestRunId(projectRoot)).toBe('run-2');
  });

  it('aucun run → listes vides, jamais d’exception', () => {
    const source = new SupervisionJournalSource();
    expect(source.listSprintCheckpoints(projectRoot)).toEqual([]);
    expect(source.listBlockedEscalations(projectRoot)).toEqual([]);
    expect(source.earliestRunStartedTs(projectRoot)).toBeUndefined();
  });
});

describe('resolveSupervisionRoot — la racine déclarée dans .mcp.json (fiche 20261002230039863)', () => {
  it('depuis un sous-dossier, remonte au .mcp.json et suit SUPERVISION_PROJECT_ROOT', () => {
    const top = mkdtempSync(join(tmpdir(), 'sup-'));
    writeFileSync(
      join(top, '.mcp.json'),
      JSON.stringify({ mcpServers: { supervision: { env: { SUPERVISION_PROJECT_ROOT: '/declared/root' } } } }),
      'utf8',
    );
    const deep = join(top, 'a', 'b', 'c');
    mkdirSync(deep, { recursive: true });
    expect(resolveSupervisionRoot(deep)).toBe('/declared/root');
  });

  it('sans .mcp.json accessible, retombe sur le projectRoot donné (comportement d’avant)', () => {
    const solo = mkdtempSync(join(tmpdir(), 'sup-solo-'));
    expect(resolveSupervisionRoot(solo)).toBe(solo);
  });

  it('.mcp.json malformé ne bloque pas : on continue de remonter / on retombe sur le défaut', () => {
    const top = mkdtempSync(join(tmpdir(), 'sup-bad-'));
    writeFileSync(join(top, '.mcp.json'), '{ pas du json', 'utf8');
    expect(resolveSupervisionRoot(top)).toBe(top);
  });
});
