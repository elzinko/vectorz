/**
 * La vue Cartes (fiche 20261102123552184) : la liste vient du daemon, qui la tient de la méthode, et un
 * document s'ouvre dans un cadre isolé. Sans la méthode, la vue dit pourquoi, jamais une liste vide.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MapsView } from './MapsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const project = BOARD_DATA.vectorz as BoardProject;
const documents = [
  { id: 'methode-mega-city', titre: 'La méthode en une carte', type: 'html', fichier: 'carte-interactive.html', donnees: 'carte-interactive.data.js' },
  { id: 'qualite-composants', titre: 'Qualité — composants', type: 'svg', fichier: 'diagram.svg', donnees: null },
];

function answer(status: number, body: unknown) {
  const fetchMock = vi.fn(async () => ({ ok: status === 200, status, json: async () => body }) as Response);
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

describe('MapsView — les documents de la méthode', () => {
  it('liste les documents que le daemon tient de la méthode', async () => {
    const fetchMock = answer(200, { documents });
    render(<MapsView project={project} />);
    expect(await screen.findByText('Documents — 2')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith(`/api/maps/${project.name}`);
    expect(screen.getByRole('button', { name: /La méthode en une carte/ })).toBeTruthy();
  });

  it('un clic ouvre le document dans un cadre isolé (scripts oui, origine non)', async () => {
    answer(200, { documents });
    render(<MapsView project={project} />);
    await userEvent.click(await screen.findByRole('button', { name: /La méthode en une carte/ }));
    const frame = screen.getByTitle('La méthode en une carte');
    expect(frame.getAttribute('sandbox')).toBe('allow-scripts');
    expect(frame.getAttribute('src')).toBe(`/api/maps/${project.name}/methode-mega-city/carte-interactive.html`);
  });
});

describe('MapsView — jamais de liste inventée', () => {
  it('la méthode répond mal : la vue donne sa raison', async () => {
    answer(502, { error: 'ezk a échoué (code 127) : ezk: command not found' });
    render(<MapsView project={project} />);
    await vi.waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe(
        'cartes indisponibles : ezk a échoué (code 127) : ezk: command not found',
      ),
    );
    expect(screen.queryByText(/Documents —/)).toBeNull();
  });

  it('le serveur ne répond pas : la vue le dit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('ECONNREFUSED'))));
    render(<MapsView project={project} />);
    await vi.waitFor(() =>
      expect(screen.getByRole('status').textContent).toBe('cartes indisponibles : serveur de mission control injoignable'),
    );
  });
});
