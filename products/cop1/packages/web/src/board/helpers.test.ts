import { describe, expect, it } from 'vitest';
import {
  allVersions,
  isCurVer,
  svCmp,
  fmtDuree,
  fmtTokens,
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

  it('isCurVer', () => {
    expect(isCurVer(PROJECT, 'v0.3.0')).toBe(true);
    expect(isCurVer(PROJECT, 'v0.2.0')).toBe(false);
  });
});

describe('formats', () => {
  it('durée et jetons', () => {
    expect(fmtDuree(2_878_825)).toBe('48 min');
    expect(fmtDuree(5_400_000)).toBe('1 h 30');
    expect(fmtDuree(null)).toBe('non mesurée');
    expect(fmtTokens(28_240_940)).toBe('28,2 M');
    expect(fmtTokens(12_400)).toBe('12 k');
    expect(fmtTokens(null)).toBe('non mesurés');
  });
});
