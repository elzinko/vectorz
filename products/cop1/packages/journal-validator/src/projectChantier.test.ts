/**
 * Tests du read-model multi-journaux (ADR-079 §D8, fiche 20261015082118353).
 * Journaux posés à la main dans des dossiers temporaires (sans serveur).
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { projectChantiers, type ChantierInput } from './projectChantier.js';

let tmp: string;

beforeEach(() => {
  tmp = mkdtempSync(join(tmpdir(), 'cop1-chantier-'));
});
afterEach(() => {
  rmSync(tmp, { recursive: true, force: true });
});

interface EventSpec {
  type: string;
  seq: number;
  ts: string;
  payload?: Record<string, unknown>;
}

/** Écrit un journal de run et rend son ChantierInput. `chantier` est injecté dans le run.started. */
function makeRun(opts: {
  runId: string;
  projectRoot: string;
  sessionId?: string;
  chantier?: string;
  events: EventSpec[];
}): ChantierInput {
  const runDir = join(tmp, opts.runId);
  mkdirSync(runDir, { recursive: true });
  const lines = opts.events.map((e) => {
    const payload = { ...(e.payload ?? {}) };
    if (e.type === 'run.started' && opts.chantier !== undefined) payload.chantier = opts.chantier;
    return JSON.stringify({
      event_id: `${opts.runId}-${e.seq}`,
      run_id: opts.runId,
      ...(opts.sessionId !== undefined ? { session_id: opts.sessionId } : {}),
      seq: e.seq,
      ts: e.ts,
      contract: 'cop1/supervisability@0.2',
      type: e.type,
      payload,
    });
  });
  writeFileSync(join(runDir, 'events.jsonl'), `${lines.join('\n')}\n`);
  return { projectRoot: opts.projectRoot, runDir };
}

const ROOT_A = '/proj/a';
const ROOT_B = '/proj/b';

describe('projectChantiers — fusion par clé', () => {
  it('deux journaux même clé + même racine = UN chantier à deux sessions, évènements étiquetés', () => {
    const a = makeRun({
      runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'v0.18.0',
      events: [
        { type: 'run.started', seq: 1, ts: '2026-10-17T10:00:00.000Z' },
        { type: 'run.finished', seq: 2, ts: '2026-10-17T10:05:00.000Z', payload: { status: 'success' } },
      ],
    });
    const b = makeRun({
      runId: 'run-B', projectRoot: ROOT_A, sessionId: 'sB', chantier: 'v0.18.0',
      events: [
        { type: 'run.started', seq: 1, ts: '2026-10-17T10:01:00.000Z' },
        { type: 'run.finished', seq: 2, ts: '2026-10-17T10:06:00.000Z', payload: { status: 'success' } },
      ],
    });

    const chantiers = projectChantiers([a, b]);
    expect(chantiers).toHaveLength(1);
    const c = chantiers[0]!;
    expect(c.key).toBe('v0.18.0');
    expect(c.sessions.map((s) => s.sessionId).sort()).toEqual(['sA', 'sB']);
    expect(c.events).toHaveLength(4);
    expect(c.events.every((e) => e.sessionId === 'sA' || e.sessionId === 'sB')).toBe(true);
    expect(c.lifecycle).toBe('finished');
  });

  it('deux journaux même clé mais RACINES différentes ne fusionnent pas', () => {
    const a = makeRun({ runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'K',
      events: [{ type: 'run.started', seq: 1, ts: '2026-10-17T10:00:00.000Z' }] });
    const b = makeRun({ runId: 'run-B', projectRoot: ROOT_B, sessionId: 'sB', chantier: 'K',
      events: [{ type: 'run.started', seq: 1, ts: '2026-10-17T10:00:00.000Z' }] });

    const chantiers = projectChantiers([a, b]);
    expect(chantiers).toHaveLength(2);
    expect(chantiers.map((c) => c.projectRoot).sort()).toEqual([ROOT_A, ROOT_B]);
  });

  it('le run_id n’est pas une clé : deux run_id différents, même clé, fusionnent ; la clé de stockage est le dossier', () => {
    const a = makeRun({ runId: 'run-aaaa', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'v0.18.0',
      events: [{ type: 'run.started', seq: 1, ts: '2026-10-17T10:00:00.000Z' }] });
    const b = makeRun({ runId: 'run-bbbb', projectRoot: ROOT_A, sessionId: 'sB', chantier: 'v0.18.0',
      events: [{ type: 'run.started', seq: 1, ts: '2026-10-17T10:00:01.000Z' }] });

    const c = projectChantiers([a, b])[0]!;
    const dirs = c.sessions.flatMap((s) => s.runDirs).sort();
    expect(dirs).toEqual([a.runDir, b.runDir].sort());
  });
});

describe('projectChantiers — ordre tolérant (§D8)', () => {
  it('ts désordonné/cassé : ordonne par ts quand lisible, repli stable session+seq, sans crash', () => {
    const a = makeRun({ runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'K',
      events: [
        { type: 'run.started', seq: 1, ts: '2026-10-17T10:00:00.000Z' },
        { type: 'heartbeat', seq: 2, ts: 'pas-une-date' },
        { type: 'run.finished', seq: 3, ts: '2026-10-17T10:00:10.000Z', payload: { status: 'success' } },
      ],
    });

    const c = projectChantiers([a])[0]!;
    // ts valides en ordre ; l'évènement au ts cassé retombe sur l'ordre intra-session (seq), pas en tête.
    expect(c.events.map((e) => e.seq)).toEqual([1, 2, 3]);
    expect(c.lifecycle).toBe('finished');
  });
});

describe('projectChantiers — cycle de vie (§D8)', () => {
  const started = (ts: string): EventSpec => ({ type: 'run.started', seq: 1, ts });

  it('au jalon : un run avec gate.reached non repris', () => {
    const a = makeRun({ runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'K',
      events: [started('2026-10-17T10:00:00.000Z'),
        { type: 'gate.reached', seq: 2, ts: '2026-10-17T10:01:00.000Z', payload: { gate_id: 'g', outcome: 'ok' } }] });
    expect(projectChantiers([a])[0]!.lifecycle).toBe('at_gate');
  });

  it('en cours : run.started + heartbeat, pas de fin, sans horloge', () => {
    const a = makeRun({ runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'K',
      events: [started('2026-10-17T10:00:00.000Z'),
        { type: 'heartbeat', seq: 2, ts: '2026-10-17T10:00:30.000Z' }] });
    expect(projectChantiers([a])[0]!.lifecycle).toBe('running');
  });

  it('orphelin : run non terminal + horloge au-delà du seuil de silence', () => {
    const last = Date.parse('2026-10-17T10:00:30.000Z');
    const a = makeRun({ runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'K',
      events: [started('2026-10-17T10:00:00.000Z'),
        { type: 'heartbeat', seq: 2, ts: '2026-10-17T10:00:30.000Z' }] });
    expect(projectChantiers([a], { now: last + 10 * 60 * 1000 })[0]!.lifecycle).toBe('orphan');
  });

  it('fini : tous les runs terminaux', () => {
    const a = makeRun({ runId: 'run-A', projectRoot: ROOT_A, sessionId: 'sA', chantier: 'K',
      events: [started('2026-10-17T10:00:00.000Z'),
        { type: 'run.finished', seq: 2, ts: '2026-10-17T10:01:00.000Z', payload: { status: 'success' } }] });
    expect(projectChantiers([a])[0]!.lifecycle).toBe('finished');
  });
});
