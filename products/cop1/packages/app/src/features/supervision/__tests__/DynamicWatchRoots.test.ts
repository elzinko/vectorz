/**
 * Tests du coordinateur `DynamicWatchRoots` (fiche 20261015082118368, ADR-079 §D9).
 * Énumérateur et fabrique de watcher injectés : on observe le cycle de vie
 * (démarrage/arrêt par racine) sans toucher au file-system ni aux vrais watchers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DynamicWatchRoots, type WatcherUnit } from '../infrastructure/DynamicWatchRoots.js';

interface FakeUnit extends WatcherUnit {
  root: string;
  started: number;
  stopped: number;
}

function makeFakeFactory() {
  const units: FakeUnit[] = [];
  const createWatcher = (root: string): WatcherUnit => {
    const unit: FakeUnit = {
      root,
      started: 0,
      stopped: 0,
      start() {
        this.started += 1;
      },
      stop() {
        this.stopped += 1;
      },
    };
    units.push(unit);
    return unit;
  };
  return { units, createWatcher };
}

const RESYNC = 10_000;

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('DynamicWatchRoots', () => {
  const noop = () => {};

  it('démarre un watcher par racine énumérée au lancement', () => {
    const { units, createWatcher } = makeFakeFactory();
    const roots = ['/a', '/a/.worktrees/x'];
    const dyn = new DynamicWatchRoots(['/a'], noop, {
      enumerate: () => roots,
      createWatcher,
      resyncIntervalMs: RESYNC,
    });

    dyn.start();
    expect(dyn.watchedRoots().sort()).toEqual(['/a', '/a/.worktrees/x']);
    expect(units.every((u) => u.started === 1)).toBe(true);

    dyn.stop();
  });

  it('un worktree qui APPARAÎT après coup est surveillé à la ré-énumération, sans redémarrage', () => {
    const { createWatcher } = makeFakeFactory();
    let roots = ['/a'];
    const dyn = new DynamicWatchRoots(['/a'], noop, {
      enumerate: () => roots,
      createWatcher,
      resyncIntervalMs: RESYNC,
    });
    dyn.start();
    expect(dyn.watchedRoots()).toEqual(['/a']);

    roots = ['/a', '/a/.worktrees/new'];
    vi.advanceTimersByTime(RESYNC);

    expect(dyn.watchedRoots().sort()).toEqual(['/a', '/a/.worktrees/new']);
    dyn.stop();
  });

  it('un worktree qui DISPARAÎT voit son watcher stoppé et retiré (aucun orphelin)', () => {
    const { units, createWatcher } = makeFakeFactory();
    let roots = ['/a', '/a/.worktrees/gone'];
    const dyn = new DynamicWatchRoots(['/a'], noop, {
      enumerate: () => roots,
      createWatcher,
      resyncIntervalMs: RESYNC,
    });
    dyn.start();

    roots = ['/a'];
    vi.advanceTimersByTime(RESYNC);

    expect(dyn.watchedRoots()).toEqual(['/a']);
    const gone = units.find((u) => u.root === '/a/.worktrees/gone')!;
    expect(gone.stopped).toBe(1);
    dyn.stop();
  });

  it('stop() arrête tous les watchers et la ré-énumération', () => {
    const { units, createWatcher } = makeFakeFactory();
    const dyn = new DynamicWatchRoots(['/a'], noop, {
      enumerate: () => ['/a', '/b'],
      createWatcher,
      resyncIntervalMs: RESYNC,
    });
    dyn.start();
    dyn.stop();

    expect(units.every((u) => u.stopped === 1)).toBe(true);
    expect(dyn.watchedRoots()).toEqual([]);

    // plus aucune ré-énumération après stop
    vi.advanceTimersByTime(RESYNC * 3);
    expect(units).toHaveLength(2);
  });
});
