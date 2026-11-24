/**
 * Les pages Objectifs et Un objectif (fiche 20261124111115865) : le tableau dans l'ordre publié,
 * les filtres, la page d'un objectif et son fil d'Ariane. Rien n'est recalculé, aucun geste n'écrit.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ObjectifsView, activesInWords } from './ObjectifsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, FicheDetail, Objectif } from './types.js';

afterEach(cleanup);

const fiche = (id: string, title: string, extra: Partial<FicheDetail> = {}): FicheDetail =>
  ({ id, title, prio: 'P1', status: 'idea', ver: '', enclair: '', ctx: '', crit: [], verif: '', blocked: '', ...extra }) as FicheDetail;

const objectifs: Objectif[] = [
  {
    slug: 'parked',
    nom: null,
    status: 'idea',
    total: 84,
    shipped: 0,
    counts: { idea: 84 },
    aFaire: ['p1'],
    livrees: [],
    versions: [],
  },
  {
    slug: 'board',
    nom: 'Mission control lisible',
    status: 'in-progress',
    total: 4,
    shipped: 2,
    counts: { idea: 1, ready: 1, shipped: 2 },
    aFaire: ['a1', 'a2'],
    livrees: ['l1', 'l2'],
    versions: ['v0.17.0', 'v0.23.0'],
  },
  {
    slug: 'qualite',
    nom: null,
    status: 'shipped',
    total: 1,
    shipped: 1,
    counts: { shipped: 1 },
    aFaire: [],
    livrees: ['l3'],
    versions: [],
  },
];

const project: BoardProject = {
  ...(BOARD_DATA.vectorz as BoardProject),
  plan: { state: 'ok' },
  objectifs,
  fiches: {
    a1: fiche('a1', 'Une idée bloquée', { blocked: 'panel' }),
    a2: fiche('a2', 'Une fiche prête', { status: 'ready' }),
    l1: fiche('l1', 'Une livrée étiquetée', { status: 'done', ver: 'v0.17.0' }),
    l2: fiche('l2', 'Une livrée sans version', { status: 'done' }),
    l3: fiche('l3', 'Une autre livrée', { status: 'done' }),
  },
};

const rowSlugs = (): string[] =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[1]?.querySelector('button')?.textContent ?? '');

describe('ObjectifsView — le tableau', () => {
  it('liste les objectifs dans l’ordre publié, sans « parked », avec rang, nom et versions', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} />);
    expect(rowSlugs()).toEqual(['board', 'qualite']);
    const board = screen.getAllByRole('row')[1] as HTMLElement;
    expect(board.textContent).toContain('Mission control lisible');
    expect(board.textContent).toContain('2 / 4');
    expect(board.textContent).toContain('1 idée · 1 prête · 1 bloquée (1 panel)');
    expect(board.textContent).toContain('v0.17.0');
    const qualite = screen.getAllByRole('row')[2] as HTMLElement;
    expect(qualite.textContent).toContain('nom non publié');
    expect(qualite.textContent).toContain('aucune version posée');
  });

  it('range « parked » à part, avec une phrase qui dit pourquoi', () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} />);
    expect(screen.getByText(/84 fiches mises de côté\. Ce n'est pas un objectif/)).toBeTruthy();
  });

  it('les filtres réduisent la liste et la page dit combien de lignes restent', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} />);
    expect(screen.getByRole('status').textContent).toBe('2 sur 2 objectifs');
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par état'), 'in-progress');
    expect(rowSlugs()).toEqual(['board']);
    expect(screen.getByRole('status').textContent).toBe('1 sur 2 objectifs');
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par état'), '');
    await userEvent.selectOptions(screen.getByLabelText('Filtrer par version'), '-');
    expect(rowSlugs()).toEqual(['qualite']);
  });
});

describe('ObjectifsView — la page d’un objectif', () => {
  it('s’ouvre au clic, montre ses fiches par leur titre, et le fil d’Ariane ramène au tableau', async () => {
    const onOpenFiche = vi.fn();
    render(<ObjectifsView project={project} onOpenFiche={onOpenFiche} />);
    await userEvent.click(screen.getByRole('button', { name: 'board' }));
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane des objectifs" }).textContent).toBe('Objectifs › board');
    expect(screen.getByText('Fiches à faire — 2')).toBeTruthy();
    expect(screen.getByText('bloquée : panel')).toBeTruthy();
    expect(screen.getByText('Fiches livrées — 2')).toBeTruthy();
    expect(screen.getByText(/1 livrées sans numéro de version/)).toBeTruthy();
    expect(screen.getByText(/à étiqueter/)).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Une fiche prête' }));
    expect(onOpenFiche).toHaveBeenCalledWith('a2');
    await userEvent.click(screen.getByRole('button', { name: 'Objectifs' }));
    expect(rowSlugs()).toEqual(['board', 'qualite']);
  });

  it('« Groomer ses fiches » n’écrit rien : il montre la commande de la première fiche à faire', async () => {
    render(<ObjectifsView project={project} onOpenFiche={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'board' }));
    await userEvent.click(screen.getByRole('button', { name: 'Groomer ses fiches' }));
    expect(screen.getByRole('status').textContent).toBe('à lancer : /ezk-backlog groom a1');
  });
});

describe('ObjectifsView — les actives en mots', () => {
  it('compte les fiches en cours telles que la méthode les publie (`in-progress`)', () => {
    const o: Objectif = { ...(objectifs[1] as Objectif), counts: { 'in-progress': 2, shipped: 2 }, aFaire: [] };
    expect(activesInWords(o, project)).toBe('2 en cours');
  });
});

describe('ObjectifsView — jamais de faux chiffre', () => {
  it('sans objectifs publiés, la page dit pourquoi', () => {
    const { objectifs: _o, ...without } = project;
    render(<ObjectifsView project={without} onOpenFiche={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('objectifs indisponible');
  });
});
