/**
 * La carte de la méthode (fiche 20261117114544792) : elle lit le contrat au daemon, montre les 7
 * familles, allume une brique et ses voisins au clic, et dit pourquoi quand le contrat manque. jsdom ne
 * mesure rien : le zoom est couvert par les tests de la projection, et le niveau 2 se force par
 * `initialLevel`.
 */
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { GraphMap } from './GraphMap.js';
import { stubFlowBrowserApis } from './testing/flowStubs.js';
import { graphCheckExample } from './testing/graphCheckExample.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

beforeAll(stubFlowBrowserApis);

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const example = graphCheckExample();
const project = { ...(BOARD_DATA.vectorz as BoardProject), name: 'vectorz' };

const serve = (body: unknown, status = 200) => {
  const fetchMock = vi.fn(async () => ({ status, json: async () => body }));
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('GraphMap', () => {
  it('lit /api/graph/<projet> et montre les 7 familles avec leur compte', async () => {
    const fetchMock = serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} />);
    expect(await screen.findByText('Compétences')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/graph/vectorz');
    for (const label of ['Profils', 'Paquets', 'Agents', 'Règles', 'Outils', 'Commandes'])
      expect(screen.getAllByText(label).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Carte de la méthode — vectorz' })).toBeTruthy();
  });

  it('contrat indisponible : dit la raison', async () => {
    serve({ state: 'unavailable', reason: 'ezk trop ancien' });
    render(<GraphMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe('carte indisponible : ezk trop ancien');
  });

  it('contrat incomplet : le dit au lieu de planter', async () => {
    serve({ state: 'ok', graph: { nodes: [] } });
    render(<GraphMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe(
      'carte indisponible : contrat du graphe incomplet (briques ou liens absents)',
    );
  });

  it('daemon injoignable : le dit', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('down'))));
    render(<GraphMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe(
      'carte indisponible : serveur de mission control injoignable',
    );
  });

  it('en lecture : la carte attend', () => {
    serve({ state: 'loading' });
    render(<GraphMap project={project} />);
    expect(screen.getByRole('status').textContent).toBe('carte en cours de lecture');
  });
});

describe('GraphMap — sélection d’une brique (niveau 2)', () => {
  const brick = (name: string): HTMLElement => screen.getByText(name, { selector: '.gm-brique-nom' }).closest('.gm-brique') as HTMLElement;

  async function open(): Promise<void> {
    serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} initialLevel={2} />);
    await screen.findByText('ezk forge integrate');
  }

  it('un clic allume la brique et ses voisins, estompe le reste ; un second clic rétablit', async () => {
    await open();
    fireEvent.click(brick('ezk forge integrate'));
    expect(brick('ezk forge integrate').className).toContain('gm-self');
    expect(brick('ezk-sprint').className).toContain('gm-neighbor');
    expect(brick('bin/forge-integrate.ts').className).toContain('gm-neighbor');
    expect(brick('clean-code/no-dead-code').className).toContain('gm-dim');
    fireEvent.click(brick('ezk forge integrate'));
    for (const name of ['ezk forge integrate', 'ezk-sprint', 'clean-code/no-dead-code'])
      expect(brick(name).className).not.toMatch(/gm-(self|neighbor|dim)/);
  });

  it('un clic dans le vide rétablit la carte', async () => {
    await open();
    fireEvent.click(brick('ezk help'));
    expect(brick('ezk-sprint').className).toContain('gm-dim');
    fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);
    expect(brick('ezk-sprint').className).not.toContain('gm-dim');
  });

  it('un clic sur une autre brique déplace la sélection', async () => {
    await open();
    fireEvent.click(brick('ezk help'));
    fireEvent.click(brick('ezk-sprint'));
    expect(brick('ezk-sprint').className).toContain('gm-self');
    expect(brick('ezk help').className).toContain('gm-dim');
  });
});

describe('GraphMap — panneau des voisins et sélection entre niveaux', () => {
  const brick = (name: string): HTMLElement => screen.getByText(name, { selector: '.gm-brique-nom' }).closest('.gm-brique') as HTMLElement;
  const panel = (): HTMLElement => screen.getByRole('complementary', { name: 'Voisins de la brique' });

  async function open(level: 1 | 2 = 2): Promise<void> {
    serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} initialLevel={level} />);
    await screen.findByText('Compétences');
  }

  it('sans sélection, le panneau dit « clique une brique »', async () => {
    await open();
    expect(panel().textContent).toContain('clique une brique');
  });

  it('avec une sélection, liste les voisins par sens et verbe ; un clic sur un voisin le sélectionne', async () => {
    await open();
    fireEvent.click(brick('ezk-sprint'));
    expect(panel().textContent).toContain('ezk-sprint');
    expect(panel().textContent).toContain('applique');
    fireEvent.click(within(panel()).getByRole('button', { name: 'ezk forge integrate' }));
    expect(brick('ezk forge integrate').className).toContain('gm-self');
    expect(within(panel()).getByRole('button', { name: 'ezk-sprint' })).toBeTruthy();
  });
});
