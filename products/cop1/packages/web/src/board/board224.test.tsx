import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FichesView } from './FichesView.js';
import { verCat } from './helpers.js';
import type { BoardProject, FicheDetail, FicheStatus, Version } from './types.js';

afterEach(cleanup);

const V = (ver: string, over: Partial<Version> = {}): Version => ({
  ver,
  name: ver,
  done: 0,
  wip: 0,
  ready: 0,
  idea: 0,
  total: 0,
  ...over,
});

const fd = (id: string, title: string, status: FicheStatus, ver: string, prio = 'P2'): FicheDetail => ({
  id,
  title,
  prio,
  status,
  ver,
  enclair: '',
  ctx: '',
  crit: [],
  verif: '',
});

function makeProject(): BoardProject {
  return {
    name: 'p',
    desc: '',
    live: false,
    funnel: { idea: 0, ready: 0, wip: 0, unversioned: 0, parked: 0 },
    metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
    versions: {
      current: V('v2.0.0', { ready: 1, total: 1 }),
      upcoming: [V('v3.0.0', { idea: 1, total: 1 })],
      past: [V('v1.0.0', { done: 1, total: 1 })],
    },
    runs: {},
    fiches: {
      a: fd('a', 'Fiche en cours', 'ready', 'v2.0.0', 'P1'),
      b: fd('b', 'Fiche à venir', 'idea', 'v3.0.0'),
      c: fd('c', 'Fiche réalisée', 'done', 'v1.0.0'),
    },
  };
}

describe('verCat', () => {
  it('range une version par catégorie', () => {
    const p = makeProject();
    expect(verCat(p, 'v2.0.0')).toBe('encours');
    expect(verCat(p, 'v3.0.0')).toBe('avenir');
    expect(verCat(p, 'v1.0.0')).toBe('realisees');
    expect(verCat(p, undefined)).toBeNull();
  });
});

describe('FichesView', () => {
  it('cache les fiches réalisées par défaut', () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} />);
    expect(screen.getByText('Fiche en cours')).toBeTruthy();
    expect(screen.getByText('Fiche à venir')).toBeTruthy();
    expect(screen.queryByText('Fiche réalisée')).toBeNull();
    expect(screen.getByText('2 fiche(s)')).toBeTruthy();
  });

  it('cocher « réalisées » fait apparaître l’archive', async () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'réalisées' }));
    expect(screen.getByText('Fiche réalisée')).toBeTruthy();
    expect(screen.getByText('3 fiche(s)')).toBeTruthy();
  });

  it('le sélecteur de lot marque la version en cours', () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} />);
    expect(screen.getByRole('option', { name: /v2\.0\.0.*en cours/ })).toBeTruthy();
  });

  it('kanban et liste montrent le même ensemble filtré', async () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} />);
    // Kanban par défaut : 2 fiches visibles.
    expect(screen.getByText('Fiche en cours')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'En ligne' }));
    // Liste : mêmes 2 fiches, toujours pas l'archive.
    expect(screen.getByText('Fiche en cours')).toBeTruthy();
    expect(screen.getByText('Fiche à venir')).toBeTruthy();
    expect(screen.queryByText('Fiche réalisée')).toBeNull();
  });

  it('filtrer sur un lot précis ignore les catégories', async () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} />);
    await userEvent.selectOptions(screen.getByLabelText('Lot'), 'v1.0.0');
    // Le lot réalisé choisi explicitement : sa fiche apparaît.
    expect(screen.getByText('Fiche réalisée')).toBeTruthy();
    expect(screen.getByText('1 fiche(s)')).toBeTruthy();
  });

  it('cliquer une fiche ouvre sa modale', async () => {
    const onOpenFiche = vi.fn();
    render(<FichesView project={makeProject()} onOpenFiche={onOpenFiche} />);
    await userEvent.click(screen.getByText('Fiche en cours'));
    expect(onOpenFiche).toHaveBeenCalledWith('a');
  });

  it('trie par titre quand demandé', async () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'En ligne' }));
    await userEvent.selectOptions(screen.getByLabelText('Trier'), 'titre');
    const list = screen.getByText('Fiche en cours').closest('.flist') as HTMLElement;
    const titles = within(list)
      .getAllByText(/^Fiche/)
      .map((el) => el.textContent);
    expect(titles).toEqual(['Fiche à venir', 'Fiche en cours']);
  });

  it('la recherche filtre les fiches par titre', () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} query="cours" />);
    expect(screen.getByText('Fiche en cours')).toBeTruthy();
    expect(screen.queryByText('Fiche à venir')).toBeNull();
    expect(screen.getByText('1 fiche(s)')).toBeTruthy();
  });

  it('la recherche filtre aussi par id de fiche', () => {
    render(<FichesView project={makeProject()} onOpenFiche={() => {}} query="b" />);
    // Seule la fiche d'id « b » (à venir) correspond ; les titres ne contiennent pas « b ».
    expect(screen.getByText('Fiche à venir')).toBeTruthy();
    expect(screen.queryByText('Fiche en cours')).toBeNull();
    expect(screen.getByText('1 fiche(s)')).toBeTruthy();
  });
});
