import { describe, expect, it } from 'vitest';
import {
  allVersions,
  cadre,
  groomed,
  isCurVer,
  isPastVer,
  liveRuns,
  runByVer,
  svCmp,
  svKey,
} from './helpers.js';
import type { BoardProject, Version } from './types.js';

const V = (ver: string, over: Partial<Version> = {}): Version => ({
  ver,
  name: ver,
  done: 0,
  wip: 0,
  ready: 0,
  idea: 0,
  total: 0,
  ...over,
});

describe('svKey / svCmp', () => {
  it('lit major.minor.patch', () => {
    expect(svKey('v0.11.0')).toEqual([0, 11, 0]);
    expect(svKey('1.8')).toEqual([1, 8, 0]);
  });

  it('ordonne numériquement, pas lexicalement (v0.8 < v0.11)', () => {
    expect(svCmp('v0.8.0', 'v0.11.0')).toBeLessThan(0);
    expect(svCmp('v0.11.0', 'v0.8.0')).toBeGreaterThan(0);
  });

  it('range une version non numérique en queue', () => {
    expect(svCmp('v1.0.0', 'à cadrer')).toBeLessThan(0);
  });
});

describe('groomed / cadre', () => {
  it('groomed = done + wip + ready', () => {
    expect(groomed(V('v1', { done: 2, wip: 1, ready: 3, total: 9 }))).toBe(6);
  });

  it('cadre quand tout le lot est groomé', () => {
    expect(cadre(V('v1', { ready: 9, total: 9 }))).toBe(true);
    expect(cadre(V('v1', { ready: 8, total: 9 }))).toBe(false);
    expect(cadre(V('v1', { total: 0 }))).toBe(false);
  });
});

const PROJECT: BoardProject = {
  name: 'p',
  desc: '',
  live: true,
  funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
  metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
  versions: {
    current: V('v0.3.0', { ready: 3, total: 3 }),
    upcoming: [V('v0.4.0', { idea: 2, total: 2 })],
    past: [V('v0.2.0', { done: 2, total: 2 }), V('v0.1.0', { done: 1, total: 1 })],
  },
  runs: {
    live1: { id: 'live1', name: 'run vivant', ver: 'v0.3.0', live: true },
    dead1: { id: 'dead1', name: 'run clos', ver: 'v0.2.0', live: false },
  },
};

describe('versions', () => {
  it('allVersions : courante, à venir, passées', () => {
    expect(allVersions(PROJECT).map((v) => v.ver)).toEqual(['v0.3.0', 'v0.4.0', 'v0.2.0', 'v0.1.0']);
  });

  it('isCurVer / isPastVer', () => {
    expect(isCurVer(PROJECT, 'v0.3.0')).toBe(true);
    expect(isCurVer(PROJECT, 'v0.2.0')).toBe(false);
    expect(isPastVer(PROJECT, 'v0.2.0')).toBe(true);
    expect(isPastVer(PROJECT, 'v0.3.0')).toBe(false);
  });

  it('liveRuns ne garde que les runs vivants', () => {
    expect(liveRuns(PROJECT).map((r) => r.id)).toEqual(['live1']);
  });

  it('runByVer indexe le run vivant par version', () => {
    const idx = runByVer(PROJECT);
    expect(idx['v0.3.0']?.id).toBe('live1');
    expect(idx['v0.2.0']).toBeUndefined();
  });
});
