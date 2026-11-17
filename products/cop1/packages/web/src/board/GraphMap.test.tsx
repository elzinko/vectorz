/**
 * La carte de la méthode (fiche 20261117114544792) : elle lit le contrat au daemon, montre les 7
 * familles, allume une brique et ses voisins au clic, et dit pourquoi quand le contrat manque. jsdom ne
 * mesure rien : le zoom est couvert par les tests de la projection, et le niveau 2 se force par
 * `initialLevel`.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
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
  it('lit /api/graph/<projet> et montre les 8 familles avec leur compte', async () => {
    const fetchMock = serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} />);
    expect(await screen.findByText('Compétences')).toBeTruthy();
    expect(fetchMock).toHaveBeenCalledWith('/api/graph/vectorz');
    for (const label of ['Profils', 'Paquets', 'Agents', 'Règles', 'Outils', 'Commandes', 'Recettes'])
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

  it('daemon injoignable : le dit, après trois re-tentatives', async () => {
    vi.useFakeTimers();
    try {
      vi.stubGlobal('fetch', vi.fn(async () => Promise.reject(new Error('down'))));
      render(<GraphMap project={project} />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(2000 + 4000 + 8000 + 1000);
      });
      expect(screen.getByRole('status').textContent).toBe(
        'carte indisponible : serveur de mission control injoignable',
      );
    } finally {
      vi.useRealTimers();
    }
  });

  it('en lecture : la carte attend', () => {
    serve({ state: 'loading' });
    render(<GraphMap project={project} />);
    expect(screen.getByRole('status').textContent).toBe('carte en cours de lecture');
  });
});

describe('GraphMap — vue d’ensemble avec une brique choisie (niveau 1)', () => {
  const family = (label: string): HTMLElement =>
    screen.getByText(label, { selector: '.gm-famille-nom' }).closest('.gm-famille') as HTMLElement;

  it('nomme la brique choisie, compte les voisins par famille, estompe les familles sans voisin', async () => {
    serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} initialLevel={1} initialSelection="skill:ezk-sprint" />);
    await screen.findByText('Compétences', { selector: '.gm-famille-nom' });
    expect(within(family('Compétences')).getByText('brique choisie : ezk-sprint')).toBeTruthy();
    expect(family('Règles').className).not.toContain('gm-dim');
    const voisins = (label: string): string[] =>
      [...family(label).querySelectorAll('.gm-famille-voisins')].map((v) => (v.textContent ?? '').replace(/\s+/g, ' ').trim());
    expect(voisins('Règles')).toEqual(['1 voisin · applique']);
    expect(voisins('Commandes')).toEqual(['1 voisin · utilise']);
    expect(family('Agents').className).toContain('gm-dim');
    expect(family('Recettes').className).toContain('gm-dim');
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

describe('GraphMap — chercher une brique (fiche 20261117153250174)', () => {
  const panel = (): HTMLElement => screen.getByRole('complementary', { name: 'Voisins de la brique' });
  const field = (): HTMLInputElement => screen.getByRole('searchbox', { name: 'chercher une brique' });

  async function open(): Promise<void> {
    serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} />);
    await screen.findByText('Compétences');
  }

  it('la saisie propose les briques avec leur famille ; un clic en choisit une et vide le champ', async () => {
    await open();
    fireEvent.change(field(), { target: { value: 'forge' } });
    const propositions = within(panel()).getByRole('list', { name: 'briques trouvées' });
    const options = within(propositions).getAllByRole('button');
    expect(options.map((o) => o.textContent)).toEqual(['bin/forge-integrate.tsOutils', 'ezk forge integrateCommandes']);
    fireEvent.click(options[1] as HTMLElement);
    expect(within(panel()).getByRole('heading', { level: 4 }).textContent).toBe('ezk forge integrate');
    expect(field().value).toBe('');
  });

  it('Entrée choisit la première proposition', async () => {
    await open();
    fireEvent.change(field(), { target: { value: 'sprint' } });
    fireEvent.submit(field());
    expect(within(panel()).getByRole('heading', { level: 4 }).textContent).toBe('ezk-sprint');
  });

  it('plus de 8 résultats : 8 propositions et « 8 sur N »', async () => {
    const many = Array.from({ length: 11 }, (_, i) => ({ kind: 'rule' as const, id: `review/regle-${i}`, file: null }));
    serve({ state: 'ok', graph: { ...example, nodes: [...example.nodes, ...many] } });
    render(<GraphMap project={project} />);
    await screen.findByText('Compétences');
    fireEvent.change(field(), { target: { value: 'review/' } });
    const propositions = within(panel()).getByRole('list', { name: 'briques trouvées' });
    expect(within(propositions).getAllByRole('button')).toHaveLength(8);
    expect(panel().textContent).toContain('8 sur 11');
  });

  it('aucun résultat : le dit, et rien n’est choisi', async () => {
    await open();
    fireEvent.change(field(), { target: { value: 'zzz' } });
    expect(panel().textContent).toContain('aucune brique ne contient « zzz »');
    fireEvent.submit(field());
    expect(panel().textContent).toContain('clique une brique');
  });
});

describe('GraphMap — la recherche se vide au changement de brique (fiche 20261117161542365)', () => {
  const field = (): HTMLInputElement => screen.getByRole('searchbox', { name: 'chercher une brique' });
  const brick = (name: string): HTMLElement => screen.getByText(name, { selector: '.gm-brique-nom' }).closest('.gm-brique') as HTMLElement;

  async function openWithQuery(): Promise<void> {
    serve({ state: 'ok', graph: example });
    render(<GraphMap project={project} initialLevel={2} />);
    await screen.findByText('ezk forge integrate', { selector: '.gm-brique-nom' });
    fireEvent.change(field(), { target: { value: 'forge' } });
    expect(screen.getByRole('list', { name: 'briques trouvées' })).toBeTruthy();
  }

  it('un clic sur une brique de la carte vide le champ et retire les propositions', async () => {
    await openWithQuery();
    fireEvent.click(brick('ezk help'));
    expect(field().value).toBe('');
    expect(screen.queryByRole('list', { name: 'briques trouvées' })).toBeNull();
  });

  it('un clic dans le vide vide aussi le champ', async () => {
    await openWithQuery();
    fireEvent.click(brick('ezk help'));
    fireEvent.change(field(), { target: { value: 'forge' } });
    fireEvent.click(document.querySelector('.react-flow__pane') as HTMLElement);
    expect(field().value).toBe('');
  });
});
