import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App.js';

describe('App', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'EventSource',
      vi.fn().mockImplementation(() => ({ onmessage: null, close: vi.fn() })),
    );
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/supervision/projects' || url === '/api/supervision/runs') {
          return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
        }
        return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve([]) });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('fiche 0062 — onglets Projets et Activité', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Projets' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Activité' })).toBeTruthy();
    expect(await screen.findByText(/projets supervisés/i)).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Activité' }));
    expect(await screen.findByText(/runs supervisés/i)).toBeTruthy();
    expect(screen.getByText(/aucun run surveillé/i)).toBeTruthy();
  });

  it('époque 2 — no BMAD-in-monitor piloting controls in the shell', () => {
    render(<App />);
    expect(screen.queryByRole('button', { name: 'Run' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Rules' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Connexion' })).toBeNull();
    expect(screen.queryByRole('button', { name: /lancer/i })).toBeNull();
    expect(screen.queryByRole('button', { name: /stop/i })).toBeNull();
  });

  it('fiche 0062 — clic projet filtre l’activité', async () => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string) => {
        if (url === '/api/supervision/projects') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  id: 'vectorz',
                  path: '.',
                  method: 'mega-city',
                  projectRoot: '/repo/vectorz',
                },
              ]),
          });
        }
        if (url === '/api/supervision/runs') {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve([
                {
                  runId: 'run-1',
                  state: 'running',
                  gates: [],
                  violations: [],
                  notices: [],
                  tokens: { provenance: 'measured' },
                  method: { name: 'mega-city', version: '0.0.0' },
                  projectRoot: '/repo/vectorz',
                  runDir: '/repo/vectorz/.supervision/runs/run-1',
                  liveness: 'alive',
                  emissionClass: 'B',
                },
                {
                  runId: 'run-other',
                  state: 'finished',
                  gates: [],
                  violations: [],
                  notices: [],
                  tokens: { provenance: 'measured' },
                  method: { name: 'other', version: '1.0.0' },
                  projectRoot: '/other',
                  runDir: '/other/.supervision/runs/run-other',
                  liveness: 'alive',
                  emissionClass: 'B',
                },
              ]),
          });
        }
        return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
      }),
    );

    render(<App />);
    expect(await screen.findByText('vectorz')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: /vectorz/i }));

    expect(await screen.findByText(/Runs · vectorz/i)).toBeTruthy();
    expect(screen.getByText(/mega-city/)).toBeTruthy();
    expect(screen.queryByText(/other/)).toBeNull();
    expect(screen.getByRole('button', { name: /voir tous les runs/i })).toBeTruthy();
  });
});
