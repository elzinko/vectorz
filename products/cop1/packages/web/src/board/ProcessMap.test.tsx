/**
 * L'écran Process de gauche à droite (fiche 20261117223348250, maquette B + panneau) : il lit le
 * contrat au daemon, dessine les phases, les liens et les boucles publiés, range l'archive dans la
 * boîte à outils, et ouvre le détail d'une étape dans le panneau. Il dit pourquoi quand le contrat
 * manque. jsdom ne mesure rien : la caméra est couverte par les tests de `processLayout`.
 */
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessMap } from './ProcessMap.js';
import type { ProcessShow } from './processShow.js';
import { processShowExample } from './testing/processShowExample.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject } from './types.js';

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

const open = async (contract: ProcessShow = example): Promise<void> => {
  serve({ state: 'ok', process: contract });
  render(<ProcessMap project={project} />);
  await screen.findByRole('button', { name: 'Zoomer sur Le backlog' });
};

/** Le libellé de chaque arc dessiné : ses lignes, remises bout à bout. */
const arcLabels = (): string[] =>
  [...document.querySelectorAll('svg text')].map((t) => [...t.querySelectorAll('tspan')].map((l) => l.textContent).join(' '));

const crumbs = (): string[] =>
  within(screen.getByRole('navigation', { name: "Fil d'Ariane du process" }))
    .getAllByText(/./, { selector: '.pr-crumb' })
    .map((el) => el.textContent ?? '');

describe('ProcessMap', () => {
  it('lit /api/process/<projet> : les trois phases du flux, et l’archive dans la boîte à outils', async () => {
    await open();
    expect(screen.getByRole('heading', { name: 'Process de la méthode — vectorz' })).toBeTruthy();
    for (const nom of ['Le backlog', 'Le sprint', 'La rétro', "L'archive"]) {
      expect(screen.getByRole('button', { name: `Zoomer sur ${nom}` })).toBeTruthy();
    }
    expect(screen.getByText('Boîte à outils · hors du flux')).toBeTruthy();
    expect(within(screen.getByRole('button', { name: "Zoomer sur L'archive" })).getByText('outil')).toBeTruthy();
  });

  it('dessine chaque lien et chaque boucle publiés, avec leur libellé, et rien d’autre', async () => {
    await open();
    const labels = arcLabels();
    expect(labels).toHaveLength(example.liens.length + example.boucles.length);
    for (const { libelle } of [...example.liens, ...example.boucles]) expect(labels).toContain(libelle);
  });

  it('une boucle ajoutée au contrat apparaît à l’écran, sans toucher au code', async () => {
    await open({ ...example, boucles: [...example.boucles, { de: 'ezk-retro:juge', vers: 'ezk-retro:cadrer', libelle: 'Juge en désaccord.' }] });
    expect(arcLabels()).toContain('Juge en désaccord.');
  });

  it('un clic sur une phase zoome dessus ; un clic sur une étape ouvre son détail dans le panneau', async () => {
    await open();
    expect(crumbs()).toEqual(['Process']);
    fireEvent.click(screen.getByRole('button', { name: 'Zoomer sur Le sprint' }));
    expect(crumbs()).toEqual(['Process', 'Le sprint']);
    expect(screen.getByRole('complementary', { name: 'Détail de la phase' })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Le sprint, étape 7 : Revue adverse' }));
    expect(crumbs()).toEqual(['Process', 'Le sprint', 'Revue adverse']);
    const panel = screen.getByRole('complementary', { name: "Détail de l'étape" });
    for (const title of ['Commandes', 'Agents', 'Règles', 'Réglages du projet']) expect(within(panel).getByText(title)).toBeTruthy();
    expect(within(panel).getByText('ezk-reviewer')).toBeTruthy();
    expect(within(panel).getByText('review.adverse = run')).toBeTruthy();
    // La revue adverse porte sa règle, rattachée par la méthode : l'écran la recopie, n'en invente aucune.
    expect(within(panel).getByText('development/acceptance-criteria-before-merge')).toBeTruthy();
    expect(within(panel).queryByText('aucune règle rattachée')).toBeNull();
  });

  it('une étape sans règle rattachée le dit, sans exemple inventé', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Zoomer sur La rétro' }));
    fireEvent.click(screen.getByRole('button', { name: 'La rétro, étape 3 : Juge' }));
    const panel = screen.getByRole('complementary', { name: "Détail de l'étape" });
    expect(within(panel).getByText('aucune règle rattachée')).toBeTruthy();
  });

  it('précédent / suivant passent à l’étape voisine ; Échap remonte d’un niveau, puis à la vue d’ensemble', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Zoomer sur Le sprint' }));
    fireEvent.click(screen.getByRole('button', { name: 'Le sprint, étape 1 : Cadrage' }));
    expect((screen.getByRole('button', { name: '← étape précédente' }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'étape suivante →' }));
    expect(crumbs().at(-1)).toBe('Archi');
    const stage = document.querySelector('.pr-stage') as HTMLElement;
    fireEvent.keyDown(stage, { key: 'ArrowRight' });
    expect(crumbs().at(-1)).toBe('Scénarios');
    fireEvent.keyDown(stage, { key: 'Escape' });
    expect(crumbs()).toEqual(['Process', 'Le sprint']);
    fireEvent.keyDown(stage, { key: 'Escape' });
    expect(crumbs()).toEqual(['Process']);
    expect(screen.queryByRole('complementary')).toBeNull();
  });

  it('de loin, un clic sur une étape zoome d’abord sur sa phase', async () => {
    await open();
    fireEvent.click(screen.getByRole('button', { name: 'Le backlog, étape 2 : Groomer' }));
    expect(crumbs()).toEqual(['Process', 'Le backlog']);
  });

  it('process indisponible : dit la raison', async () => {
    serve({ state: 'unavailable', reason: 'ezk trop ancien' });
    render(<ProcessMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe('process indisponible : ezk trop ancien');
  });

  it('contrat incomplet (sans skills, liens ni boucles) : le dit au lieu de planter', async () => {
    serve({ state: 'ok', process: { schema_version: 1 } });
    render(<ProcessMap project={project} />);
    expect((await screen.findByRole('status')).textContent).toBe(
      'process indisponible : contrat du process incomplet (skills, liens ou boucles absents)',
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
