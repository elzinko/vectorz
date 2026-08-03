import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ProjectsView } from './ProjectsView.js';

describe('ProjectsView (fiche 0062)', () => {
  beforeEach(() => {
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
                  projectRoot: '/repo/vectorz',
                  state: 'running',
                  method: { name: 'mega-city', version: '0.0.0' },
                  lastAbsorbedAt: '2026-08-03T10:00:00.000Z',
                },
              ]),
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

  it('n’émet aucun POST (lecture seule)', async () => {
    render(<ProjectsView onOpenProject={vi.fn()} />);
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalled();
    });
    const calls = vi.mocked(globalThis.fetch).mock.calls;
    for (const [url, init] of calls) {
      expect(url).toMatch(/^\/api\/supervision\/(projects|runs)$/);
      expect(init && typeof init === 'object' && 'method' in init ? init.method : 'GET').toBe(
        'GET',
      );
    }
  });
});
