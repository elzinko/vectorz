/**
 * La carte zoomable du process (fiche 20261110185357446) : elle lit le contrat au daemon, montre les
 * skills, et dit pourquoi quand le contrat manque. jsdom ne mesure rien : ResizeObserver et
 * DOMMatrixReadOnly sont simulés ; le zoom, lui, est couvert par les tests de la projection.
 */
import { act, cleanup, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { ProcessMap } from './ProcessMap.js';
import { stubFlowBrowserApis } from './testing/flowStubs.js';
import { processShowExample } from './testing/processShowExample.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

beforeAll(stubFlowBrowserApis);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const example = processShowExample();

const project = { ...(BOARD_DATA.vectorz as BoardProject), name: 'vectorz' };

const serve = (body: unknown, status = 200) => {
  const fetchMock = vi.fn(async () => ({ status, json: async () => body }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('ProcessMap', () => {
  it('lit /api/process/<projet> et montre les 4 skills du contrat', async () => {
    const fetchMock = serve({ state: 'ok', process: example });
    render(<ProcessMap project={project} />);
    expect(await screen.findByText('Le backlog')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/process/vectorz');
    const skills = example.skills;
    expect(skills).toHaveLength(4);
    for (const { nom } of skills) expect(screen.getAllByText(nom).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Process de la méthode — vectorz' })).toBeTruthy();
  });

  it('n’affiche plus les étapes de sprint codées en dur', async () => {
    serve({ state: 'ok', process: example });
    render(<ProcessMap project={project} />);
    await screen.findByText('Le backlog');
    expect(screen.queryByText('BDD')).toBeNull();
  });

  it('process indisponible : dit la raison', async () => {
    serve({ state: 'unavailable', reason: 'ezk trop ancien' });
    render(<ProcessMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe('process indisponible : ezk trop ancien');
  });

  it('contrat incomplet (sans skills ni liens) : le dit au lieu de planter', async () => {
    serve({ state: 'ok', process: { schema_version: 1 } });
    render(<ProcessMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe(
      'process indisponible : contrat du process incomplet (skills ou liens absents)',
    );
  });

  it('daemon injoignable : le dit, après trois re-tentatives', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('down'))));
      render(<ProcessMap project={project} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000 + 4000 + 8000 + 1000);
      });
      expect(screen.getByRole('status').textContent).toBe(
        'process indisponible : serveur de mission control injoignable',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('en lecture : la carte attend', () => {
    serve({ state: 'loading' });
    render(<ProcessMap project={project} />);
    expect(screen.getByRole('status').textContent).toBe('process en cours de lecture');
  });
});
