/**
 * Le chargement partagé des cartes (fiche 20261117135600942) : il re-tente avec mesure, puis dit
 * pourquoi il s'arrête. L'horloge est simulée : aucun test n'attend une vraie minute.
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDaemonContract } from './useDaemonContract.js';

const READING = {
  path: 'process',
  field: 'process',
  isUsable: (v: unknown): boolean => typeof v === 'object' && v !== null,
  incompleteReason: 'contrat incomplet',
};

/** Une suite de réponses du daemon : un objet est une réponse JSON, `'down'` une erreur réseau. */
function serve(...replies: (Record<string, unknown> | 'down')[]): ReturnType<typeof vi.fn> {
  let i = 0;
  const fetchMock = vi.fn(async () => {
    const reply = replies[Math.min(i, replies.length - 1)];
    i += 1;
    if (reply === 'down') throw new Error('réseau coupé');
    return { status: 200, json: async () => reply };
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** Laisse passer `ms` millisecondes et les promesses en attente. */
async function wait(ms: number): Promise<void> {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(ms);
  });
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useDaemonContract — re-tentatives mesurées', () => {
  it('après 30 réponses « en cours de lecture », dit qu’il attend depuis plus d’une minute et s’arrête', async () => {
    const fetchMock = serve({ state: 'loading' });
    const { result } = renderHook(() => useDaemonContract('vectorz', READING));
    await wait(2000 * 35);
    expect(result.current).toEqual({
      kind: 'unavailable',
      reason: 'le daemon lit encore ce contrat depuis plus d’une minute',
    });
    const calls = fetchMock.mock.calls.length;
    await wait(10_000);
    expect(fetchMock.mock.calls.length).toBe(calls);
    expect(calls).toBe(30);
  });

  it('une erreur réseau suivie d’une bonne réponse affiche le contrat', async () => {
    serve('down', { state: 'ok', process: { skills: [] } });
    const { result } = renderHook(() => useDaemonContract('vectorz', READING));
    await wait(0);
    expect(result.current.kind).toBe('loading');
    await wait(2000);
    expect(result.current).toEqual({ kind: 'ok', contract: { skills: [] } });
  });

  it('après 4 erreurs réseau de suite, dit « injoignable » et s’arrête', async () => {
    const fetchMock = serve('down');
    const { result } = renderHook(() => useDaemonContract('vectorz', READING));
    await wait(2000 + 4000 + 8000 + 1000);
    expect(result.current).toEqual({ kind: 'unavailable', reason: 'serveur de mission control injoignable' });
    expect(fetchMock.mock.calls.length).toBe(4);
    await wait(20_000);
    expect(fetchMock.mock.calls.length).toBe(4);
  });

  it('une réponse reçue mais illisible le dit, sans la prendre pour une coupure ni re-tenter', async () => {
    const fetchMock = vi.fn(async () => ({
      status: 502,
      json: async () => {
        throw new SyntaxError('Unexpected token <');
      },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useDaemonContract('vectorz', READING));
    await wait(0);
    expect(result.current).toEqual({ kind: 'unavailable', reason: 'réponse illisible du daemon (HTTP 502)' });
    await wait(20_000);
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('un JSON valide mais vide (null) est aussi une réponse illisible, sans re-tentative', async () => {
    const fetchMock = serve(null as unknown as Record<string, unknown>);
    const { result } = renderHook(() => useDaemonContract('vectorz', READING));
    await wait(0);
    expect(result.current).toEqual({ kind: 'unavailable', reason: 'réponse illisible du daemon (HTTP 200)' });
    await wait(20_000);
    expect(fetchMock.mock.calls.length).toBe(1);
  });

  it('changer de projet arrête les re-tentatives du projet précédent', async () => {
    const fetchMock = serve({ state: 'loading' });
    const { rerender } = renderHook(({ name }) => useDaemonContract(name, READING), {
      initialProps: { name: 'vectorz' },
    });
    await wait(1000);
    rerender({ name: 'samplerz' });
    await wait(6000);
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls.filter((u) => u.endsWith('/vectorz'))).toHaveLength(1);
  });
});
