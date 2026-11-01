/**
 * Le board lit une SOURCE INJECTÉE (`/api/board`) et n'affiche jamais de chiffres d'exemple
 * (ADR-086) : serveur injoignable → un message clair, pas un échantillon. On éprouve les bords en
 * moquant `fetch`.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Board from './Board.js';
import { BOARD_DATA } from './testing/sampleBoard.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('board-web : source injectée, jamais d’échantillon', () => {
  it('fetch échoue (pas de daemon) → « serveur injoignable », jamais les chiffres d’exemple', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    render(<Board />);
    expect(await screen.findByText(/serveur de mission control injoignable/)).toBeTruthy();
    expect(screen.queryByText(/échantillon/)).toBeNull();
    expect(screen.queryByText("Vue d'ensemble — vectorz")).toBeNull();
    expect(document.body.textContent).not.toContain(String(BOARD_DATA.vectorz?.metrics.done));
  });

  it('fetch répond une erreur HTTP → même message, pas d’échantillon', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 } as Response));
    render(<Board />);
    expect(await screen.findByText(/serveur de mission control injoignable/)).toBeTruthy();
    expect(screen.queryByText(/échantillon/)).toBeNull();
  });

  it('fetch répond sans aucun projet → le dit, sans échantillon', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve({}) } as Response));
    render(<Board />);
    expect(await screen.findByText(/aucun projet surveillé/)).toBeTruthy();
    expect(screen.queryByText(/échantillon/)).toBeNull();
  });

  it('fetch réussit → la source live s’affiche, sans bandeau', async () => {
    const live = {
      'projet-live': {
        name: 'projet-live',
        live: true,
        versions: { current: { ver: 'v9.9', fiches: [], done: 0, total: 0 }, upcoming: [], past: [] },
        funnel: [],
        fiches: [],
        runs: [],
        chantiers: [],
        timeline: [],
        moments: [],
        metrics: { done: 0 },
      },
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(live) } as Response),
    );
    render(<Board />);
    await waitFor(() => expect(screen.getByText('projet-live')).toBeTruthy());
    expect(screen.queryByText(/injoignable/)).toBeNull();
    expect(screen.queryByText(/plan indisponible/)).toBeNull();
  });
});
