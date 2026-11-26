/**
 * Vue d'ensemble (fiche 20261126170000102) : la carte du projet courant, puis « Objectifs en cours ».
 * L'Entonnoir et la table « Versions dans le process » n'existent plus.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { OverviewView } from './OverviewView.js';
import type { BoardProject, Objectif } from './types.js';

afterEach(cleanup);

const objectif = (slug: string, over: Partial<Objectif> = {}): Objectif => ({
  slug,
  nom: slug,
  status: 'in-progress',
  total: 5,
  shipped: 2,
  counts: {},
  aFaire: [],
  livrees: [],
  versions: [],
  ...over,
});

const PROJECT: BoardProject = {
  name: 'demo',
  desc: 'projet de démonstration',
  live: true,
  funnel: { idea: 10, ready: 4, wip: 1, unversioned: 3, parked: 7 },
  metrics: { done: 42, tokens: '9 M', temps: '~20 h', perFiche: '70 k', sprints: 30, runs: 8, retros: 5 },
  versions: { current: null, upcoming: [], past: [] },
  runs: {},
  objectifs: [
    objectif('carte', { nom: 'La carte', shipped: 2, total: 5 }),
    objectif('menu', { nom: 'Le menu', shipped: 1, total: 4 }),
    objectif('fini', { nom: 'Fini', status: 'shipped', shipped: 3, total: 3 }),
  ],
};

const show = (over: Partial<BoardProject> = {}, onOpenObjectifs = () => {}) =>
  render(<OverviewView project={{ ...PROJECT, ...over }} onOpenObjectifs={onOpenObjectifs} />);

describe('OverviewView', () => {
  it('ouvre par le titre et la description du projet', () => {
    show();
    expect(screen.getByText("Vue d'ensemble — demo")).toBeTruthy();
    expect(screen.getAllByRole('button', { name: /Aide : projet de démonstration/ })).toHaveLength(1);
  });

  it('montre la même carte de projet que la page Projets', () => {
    show();
    expect(screen.getByLabelText('Depuis le début').textContent).toMatch(/42\s*livrées/);
    expect(screen.getByRole('group', { name: 'Dernier objectif' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Dernier sprint' })).toBeTruthy();
    expect(screen.getByRole('group', { name: 'Dernière rétro' })).toBeTruthy();
  });

  it('plan pas reçu : la carte ne montre aucun faux zéro', () => {
    show({ plan: { state: 'loading' } });
    expect(screen.getByLabelText('Depuis le début').textContent).toMatch(/—\s*livrées/);
  });
});

describe('OverviewView — Objectifs en cours', () => {
  it('une vignette par objectif en cours : sa pastille, son nom en infobulle, livrées / total', () => {
    show();
    const block = screen.getByRole('region', { name: 'Objectifs en cours' });
    expect(within(block).getByText('carte').getAttribute('title')).toBe('La carte');
    expect(within(block).getByText('2/5')).toBeTruthy();
    expect(within(block).getByText('menu').getAttribute('title')).toBe('Le menu');
    expect(within(block).getByText('1/4')).toBeTruthy();
    expect(within(block).queryByText('fini')).toBeNull();
  });

  it('le lien « Tous les objectifs (N) » compte tous les objectifs et ouvre la page Objectifs', async () => {
    const onOpenObjectifs = vi.fn();
    show({}, onOpenObjectifs);
    await userEvent.click(screen.getByRole('button', { name: 'Tous les objectifs (3) →' }));
    expect(onOpenObjectifs).toHaveBeenCalledTimes(1);
  });

  it('un objectif sans nom publié le dit dans l\'infobulle de sa pastille', () => {
    show({ objectifs: [objectif('x', { nom: null })] });
    expect(screen.getByText('x').getAttribute('title')).toBe('nom non publié');
  });

  it('aucun objectif en cours : le bloc le dit', () => {
    show({ objectifs: [objectif('fini', { status: 'shipped', shipped: 3, total: 3 })] });
    expect(screen.getByText('aucun objectif en cours')).toBeTruthy();
  });

  it('objectifs non publiés : « non publié », sans lien ni zéro', () => {
    show({ objectifs: undefined });
    const block = screen.getByRole('region', { name: 'Objectifs en cours' });
    expect(block.textContent).toContain('non publié');
    expect(within(block).queryByRole('button', { name: /Tous les objectifs/ })).toBeNull();
  });
});

describe('OverviewView — ce qui a disparu', () => {
  it('ni Entonnoir, ni « Versions dans le process », ni session', () => {
    const { container } = show();
    expect(container.textContent).not.toMatch(/Entonnoir/);
    expect(container.textContent).not.toMatch(/Versions dans le process/);
    expect(container.textContent).not.toMatch(/session/i);
    expect(container.querySelector('.funnel, .ptrow')).toBeNull();
  });
});
