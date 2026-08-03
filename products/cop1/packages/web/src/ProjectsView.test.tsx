import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsView } from './ProjectsView.js';

describe('ProjectsView (fiche 0062 + 0063)', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((url: string, init?: RequestInit) => {
        if (url === '/api/supervision/projects' && (!init || init.method === undefined || init.method === 'GET')) {
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
                  projectRoot: '/repo/vectorz',
                  state: 'running',
                  method: { name: 'mega-city', version: '0.0.0' },
                  lastAbsorbedAt: '2026-08-03T10:00:00.000Z',
                },
              ]),
          });
        }
        if (url === '/api/supervision/projects/anchor' && init?.method === 'POST') {
          return Promise.resolve({
            ok: true,
            status: 200,
            json: () =>
              Promise.resolve({
                ok: true,
                id: 'nouveau',
                daemonRestartRequired: true,
              }),
          });
        }
        return Promise.resolve({ ok: false, json: () => Promise.resolve([]) });
      }),
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('liste méthode, localisation et statut, puis ouvre le projet au clic', async () => {
    const onOpen = vi.fn();
    const user = userEvent.setup();
    render(<ProjectsView onOpenProject={onOpen} />);

    expect(await screen.findByText('vectorz')).toBeTruthy();
    expect(screen.getByText(/mega-city · 0\.0\.0/)).toBeTruthy();
    expect(screen.getByText('Actif')).toBeTruthy();

    await user.click(screen.getByRole('button', { name: /vectorz/i }));
    expect(onOpen).toHaveBeenCalledWith('/repo/vectorz');
  });

  it('fiche 0063 — formulaire POST anchor puis message de redémarrage', async () => {
    const user = userEvent.setup();
    render(<ProjectsView onOpenProject={vi.fn()} />);
    expect(await screen.findByText(/Ajouter un projet/i)).toBeTruthy();

    await user.type(screen.getByPlaceholderText(/\/Users\//), '/tmp/nouveau-projet');
    await user.click(screen.getByRole('button', { name: /Ajouter le projet/i }));

    expect(await screen.findByText(/ancré/i)).toBeTruthy();
    expect(screen.getByText(/Redémarre le daemon/i)).toBeTruthy();

    const post = vi.mocked(globalThis.fetch).mock.calls.find(
      ([url, init]) => url === '/api/supervision/projects/anchor' && init?.method === 'POST',
    );
    expect(post).toBeTruthy();
    expect(JSON.parse(String(post?.[1]?.body))).toMatchObject({
      projectRoot: '/tmp/nouveau-projet',
      mode: 'supervised',
    });
  });
});
