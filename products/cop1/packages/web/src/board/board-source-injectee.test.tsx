/**
 * Sœur « tuyau » de board-web (fiche 20261024130841976) : le board lit une SOURCE INJECTÉE
 * (`/api/board`) au lieu de `BOARD_DATA` en dur, et retombe sur l'échantillon — signalé à
 * l'écran — quand la source est injoignable. On éprouve les deux bords en moquant `fetch`.
 */
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Board from './Board.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('board-web : source injectée + repli signalé', () => {
  it('fetch échoue (pas de daemon) → repli sur l’échantillon, SIGNALÉ, sans crash', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('ECONNREFUSED')));
    render(<Board />);
    // Le repli est explicite à l'écran — jamais un faux chiffre muet.
    expect(await screen.findByText(/échantillon · live indisponible/)).toBeTruthy();
    // Et le board reste fonctionnel sur l'échantillon (le projet par défaut s'affiche).
    expect(screen.getByText("Vue d'ensemble — vectorz")).toBeTruthy();
  });

  it('fetch réussit → la source live remplace l’échantillon, pas de bandeau « indisponible »', async () => {
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
    await waitFor(() => expect(screen.queryByText(/échantillon · live indisponible/)).toBeNull());
    // Le sélecteur de projet montre le projet live, pas un projet de l'échantillon.
    expect(screen.getByText('projet-live')).toBeTruthy();
  });
});
