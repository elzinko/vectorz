import { readdirSync } from 'node:fs';
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
});
