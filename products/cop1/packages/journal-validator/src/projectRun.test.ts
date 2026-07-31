import { mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectRun } from './projectRun.js';

const FIXTURES_ROOT = join(__dirname, '..', 'fixtures');

function fixture(name: string): string {
  return join(FIXTURES_ROOT, name);
}

function realRunToyDir(): string {
  const base = fixture('real-run-toy');
  const [runFolder] = readdirSync(base);
  return join(base, runFolder as string);
}

describe('projectRun — read-model de projection live (fiche 0031 / ADR-028)', () => {
  it('projette runId, state, gates et tokens (jamais de champ phase)', () => {
    const projection = projectRun(realRunToyDir());

    expect(projection.runId).toBeTruthy();
    expect(projection.state).toBe('finished');
    expect(projection.tokens).toEqual({ provenance: 'absent' });
    expect(projection).not.toHaveProperty('phase');
    for (const gate of projection.gates) {
      expect(gate).not.toHaveProperty('phase');
    }
  });

  it('projette la méthode et le siège déclarés par run.started (fiche 0061)', () => {
    const projection = projectRun(realRunToyDir());

    expect(projection.method).toEqual({ name: 'supervision-demo', version: '0.0.1' });
    expect(projection.seat).toBe('human');
  });

  it('un journal sans run.started projette method/seat undefined, sans casser (fiche 0061)', () => {
    const projection = projectRun(fixture('run-started-missing'));

    expect(projection.method).toBeUndefined();
    expect(projection.seat).toBeUndefined();
  });

  it('un gate.resumed avec command_ref est projeté avec origine "command"', () => {
    const projection = projectRun(fixture('commands-resume-origin'));

    expect(projection.gates).toHaveLength(1);
    expect(projection.gates[0]?.resumeOrigin).toBe('command');
  });

  it('un gate.resumed sans command_ref est projeté avec origine "self_reported"', () => {
    const projection = projectRun(realRunToyDir());

    const resumedGate = projection.gates.find((g) => g.resumeOrigin !== undefined);
    expect(resumedGate?.resumeOrigin).toBe('self_reported');
  });

  it('une ligne invalide produit une violation contract.violation sans casser la projection', () => {
    const projection = projectRun(fixture('invalid-line'));

    const violation = projection.violations.find(
      (v) => v.code === 'contract.violation' && v.line === 2,
    );
    expect(violation).toBeDefined();
    // le run reste consultable : au moins un événement valide a été projeté
    expect(projection.state).not.toBe('launched');
  });

  it('un trou de séquence (seq_gap) est une violation sans casser la projection', () => {
    const projection = projectRun(fixture('seq-gap'));

    const violation = projection.violations.find((v) => v.code === 'envelope.seq_gap');
    expect(violation).toBeDefined();
    expect(projection.runId).toBeTruthy();
  });

  it('un gate.resumed orphelin est une violation et ne projette pas un at_gate repris', () => {
    const projection = projectRun(fixture('gate-resumed-orphan'));

    const violation = projection.violations.find((v) => v.code === 'state.gate_resumed_orphan');
    expect(violation).toBeDefined();
    // aucun gate n'a été ouvert (le seul événement gate.reached n'existe pas
    // dans cette fixture) : le gate.resumed orphelin ne doit pas en faire naître un.
    expect(projection.gates).toEqual([]);
    expect(projection.state).toBe('running');
  });

  // Fiche 0082 — écart de méthode
  it('un _method_mismatch dans run.started produit une Notice registry.method_mismatch (fiche 0082)', () => {
    const misMatchDir = join(fixture('run-method-mismatch'), '2026-01-01T00-00-00-000Z-deadbeef');
    const projection = projectRun(misMatchDir);

    const notice = projection.notices.find((n) => n.code === 'registry.method_mismatch');
    expect(notice).toBeDefined();
    expect(notice!.message).toContain('bmad');
    expect(notice!.message).toContain('mega-city');
    // L'écart est une Notice, jamais une Violation : le run reste valide
    expect(projection.violations).toHaveLength(0);
    expect(projection.state).toBe('finished');
  });

  it('run.started sans _method_mismatch ne produit pas de Notice registry.method_mismatch (fiche 0082)', () => {
    const projection = projectRun(realRunToyDir());

    const notice = projection.notices.find((n) => n.code === 'registry.method_mismatch');
    expect(notice).toBeUndefined();
  });

  it('projette abandonedBy depuis run.finished {status:abandoned} (ADR-035)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jv-abandon-'));
    const lines = [
      {
        event_id: 'e1',
        run_id: 'abandon-seat',
        seq: 1,
        ts: '2026-07-31T10:00:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'm' }, seat: 'human' },
      },
      {
        event_id: 'e2',
        run_id: 'abandon-seat',
        seq: 2,
        ts: '2026-07-31T10:01:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.finished',
        payload: { status: 'abandoned', abandoned_by: 'seat' },
      },
    ];
    writeFileSync(join(dir, 'events.jsonl'), `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`);
    try {
      const projection = projectRun(dir);
      expect(projection.state).toBe('finished');
      expect(projection.abandonedBy).toBe('seat');
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it('ignore un run.finished post_finished pour abandonedBy (premier terminal gagne)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jv-abandon-post-'));
    const lines = [
      {
        event_id: 'e1',
        run_id: 'abandon-post',
        seq: 1,
        ts: '2026-07-31T10:00:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.started',
        payload: { method: { name: 'm' }, seat: 'human' },
      },
      {
        event_id: 'e2',
        run_id: 'abandon-post',
        seq: 2,
        ts: '2026-07-31T10:01:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.finished',
        payload: { status: 'success' },
      },
      {
        event_id: 'e3',
        run_id: 'abandon-post',
        seq: 3,
        ts: '2026-07-31T10:02:00.000Z',
        contract: 'cop1/supervisability@0.1',
        type: 'run.finished',
        payload: { status: 'abandoned', abandoned_by: 'seat' },
      },
    ];
    writeFileSync(join(dir, 'events.jsonl'), `${lines.map((l) => JSON.stringify(l)).join('\n')}\n`);
    try {
      const projection = projectRun(dir);
      expect(projection.state).toBe('finished');
      expect(projection.abandonedBy).toBeUndefined();
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
