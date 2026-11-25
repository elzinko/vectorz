import { describe, expect, it } from 'vitest';
import { isLaunchable } from './pipeline.js';
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

/** Un projet avec un lot lançable et des versions à d'autres étapes. */
function makeProject(over: Partial<BoardProject> = {}): BoardProject {
  return {
    name: 'p',
    desc: '',
    live: false,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
    versions: {
      current: V('v2.0.0', { ready: 3, total: 3 }), // cadré, done 0 → à développer / lançable
      upcoming: [
        V('v2.1.0', { idea: 4, total: 4 }), // rien groomé → à cadrer
        V('v2.2.0', { ready: 2, idea: 3, total: 5 }), // partiellement groomé → en cadrage
      ],
      past: [
        V('v1.5.0', { done: 2, ready: 1, total: 4 }), // dev en cours
        V('v1.0.0', { done: 3, total: 3 }), // tout livré
      ],
    },
    runs: {},
    ...over,
  };
}

describe('pipeline — lot lançable', () => {
  it('isLaunchable : cadré, done 0, sans run', () => {
    const p = makeProject();
    expect(isLaunchable(p, p.versions.current as Version)).toBe(true);
  });

  it('isLaunchable : faux si un run est en cours sur la version', () => {
    const p = makeProject({
      runs: { r: { id: 'r', name: 'run', ver: 'v2.0.0', live: true } },
    });
    expect(isLaunchable(p, p.versions.current as Version)).toBe(false);
  });
});
