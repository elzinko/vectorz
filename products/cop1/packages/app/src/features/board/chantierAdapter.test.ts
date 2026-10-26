/**
 * Contrat de l'adaptateur `projectChantiers → LiveBoard` (fiche 20261024130842250, ADR-084 G5).
 * Sur fixtures : on construit des `ChantierProjection` à la main (pas de disque) et on vérifie les
 * trois mappings + l'absence honnête + le cas vide. Le périmètre MINCE est assumé : moments de
 * fiche, jetons et verdicts ne sont PAS produits (le journal ne les émet pas).
 */
import { describe, expect, it } from 'vitest';
import type { ChantierEvent, ChantierProjection } from '@cop1/journal-validator';
import {
  adaptChantiers,
  chantierToLive,
  compactWhen,
  eventToLive,
  lifecycleToState,
  MAX_CHANTIERS,
  runStateToState,
  versionOfKey,
} from './chantierAdapter.js';

const NOW = Date.parse('2026-10-26T12:00:00.000Z');

function ev(type: string, secondsAgo: number, payload: Record<string, unknown> = {}, sessionId = 's1'): ChantierEvent {
  return {
    sessionId,
    runId: 'run-1',
    type,
    ts: new Date(NOW - secondsAgo * 1000).toISOString(),
    seq: 1,
    payload,
  };
}

function chantier(over: Partial<ChantierProjection> = {}): ChantierProjection {
  return {
    key: 'board:v0.24.0',
    projectRoot: '/repo',
    sessions: [{ sessionId: 's1', branch: 'feat/x', runDirs: ['d1'], state: 'running', eventCount: 3 }],
    events: [
      ev('run.started', 600),
      ev('heartbeat', 300, { note: 'travail' }),
      ev('gate.reached', 60, { gate_id: 'sprint-x-checkpoint' }),
    ],
    lifecycle: 'running',
    ...over,
  };
}

describe('mappings purs', () => {
  it('cycle de vie → état', () => {
    expect(lifecycleToState('running')).toBe('live');
    expect(lifecycleToState('at_gate')).toBe('gate');
    expect(lifecycleToState('finished')).toBe('done');
    expect(lifecycleToState('orphan')).toBe('dead');
  });

  it('état de run → état de session', () => {
    expect(runStateToState('launched')).toBe('live');
    expect(runStateToState('running')).toBe('live');
    expect(runStateToState('at_gate')).toBe('gate');
    expect(runStateToState('finished')).toBe('done');
    expect(runStateToState('finished_at_gate')).toBe('done');
    expect(runStateToState('aborted')).toBe('dead');
  });

  it('version portée par la clé de chantier', () => {
    expect(versionOfKey('board:v0.24.0')).toBe('v0.24.0');
    expect(versionOfKey('v0.23.0')).toBe('v0.23.0');
  });

  it('temps compact, tolérant à un ts illisible', () => {
    expect(compactWhen(new Date(NOW - 10_000).toISOString(), NOW)).toBe('maintenant');
    expect(compactWhen(new Date(NOW - 120_000).toISOString(), NOW)).toBe('il y a 2 min');
    expect(compactWhen(new Date(NOW - 7_200_000).toISOString(), NOW)).toBe('il y a 2 h');
    expect(compactWhen(new Date(NOW - 86_400_000).toISOString(), NOW)).toBe('hier');
    expect(compactWhen('pas-une-date', NOW)).toBe('—');
    expect(compactWhen(undefined, NOW)).toBe('—');
  });
});

describe('évènement → jalon (seuls lancement et gate sont des jalons)', () => {
  it('run.started → lancement', () => {
    expect(eventToLive(ev('run.started', 10), NOW)).toMatchObject({ kind: 'lancement', live: true });
  });
  it('gate.reached → gate, avec le gate_id', () => {
    expect(eventToLive(ev('gate.reached', 10, { gate_id: 'g1' }), NOW)).toMatchObject({
      kind: 'gate',
      title: 'Jalon g1',
    });
  });
  it('gate.resumed → gate', () => {
    expect(eventToLive(ev('gate.resumed', 10), NOW)?.kind).toBe('gate');
  });
  it('heartbeat / escalation / run.finished → pas un jalon', () => {
    expect(eventToLive(ev('heartbeat', 10), NOW)).toBeNull();
    expect(eventToLive(ev('escalation', 10), NOW)).toBeNull();
    expect(eventToLive(ev('run.finished', 10, { status: 'success' }), NOW)).toBeNull();
  });
});

describe('chantier → chantier d’affichage', () => {
  it('mappe état, sessions, âge, et exclut les heartbeats du fil', () => {
    const c = chantierToLive(chantier(), NOW);
    expect(c.key).toBe('board:v0.24.0');
    expect(c.ver).toBe('v0.24.0');
    expect(c.state).toBe('live');
    expect(c.age).toBe('il y a 1 min'); // dernier évènement = gate.reached à 60 s
    expect(c.sessions).toHaveLength(1);
    expect(c.sessions[0]).toMatchObject({ id: 's1', label: 'feat/x', state: 'live' });
    // 3 évènements en entrée, le heartbeat exclu → 2 jalons, du plus récent au plus ancien.
    expect(c.merged.map((e) => e.kind)).toEqual(['gate', 'lancement']);
    // Le badge de session porte la branche, jamais l'id brut.
    expect(c.merged.every((e) => e.session === 'feat/x')).toBe(true);
  });

  it('marque la session pilote', () => {
    const c = chantierToLive(
      chantier({ sessions: [{ sessionId: 's1', runDirs: ['d1'], state: 'running', eventCount: 1, pilotedBy: 'orchestration' }] }),
      NOW,
    );
    expect(c.sessions[0]?.pilot).toBe(true);
  });
});

describe('adaptChantiers — part live du board', () => {
  it('entrée vide → sortie vide honnête (aucun faux run)', () => {
    expect(adaptChantiers([], NOW)).toEqual({ runs: {}, chantiers: [] });
  });

  it('un chantier keyé → un run, un chantier, un fil des jalons récent-d’abord', () => {
    const live = adaptChantiers([chantier()], NOW);
    expect(Object.keys(live.runs)).toEqual(['board:v0.24.0']);
    expect(live.runs['board:v0.24.0']).toMatchObject({ ver: 'v0.24.0', live: true, sessions: ['s1'] });
    expect(live.chantiers).toHaveLength(1);
    expect(live.chantiers[0]?.merged.map((e) => e.kind)).toEqual(['gate', 'lancement']);
  });

  it('un run fini n’est plus live', () => {
    const live = adaptChantiers([chantier({ lifecycle: 'finished' })], NOW);
    expect(live.runs['board:v0.24.0']?.live).toBe(false);
  });

  it('borne la sortie aux MAX_CHANTIERS les plus récents', () => {
    const many = Array.from({ length: MAX_CHANTIERS + 5 }, (_, i) =>
      chantier({ key: `board:v0.${i}.0`, events: [ev('run.started', i + 1)] }),
    );
    const live = adaptChantiers(many, NOW);
    expect(live.chantiers).toHaveLength(MAX_CHANTIERS);
    expect(Object.keys(live.runs)).toHaveLength(MAX_CHANTIERS);
  });
});
