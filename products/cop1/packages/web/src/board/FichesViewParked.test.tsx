/**
 * La vue Fiches range les parkées à part (fiche 20261104090517494) : la méthode publie l'état, la vue
 * les cache par défaut, et son compte d'idées rejoint celui de la Vue d'ensemble.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import { FichesView } from './FichesView.js';
import type { BoardProject, FicheDetail, FicheStatus } from './types.js';

afterEach(cleanup);

const fd = (id: string, title: string, status: FicheStatus): FicheDetail => ({
  id,
  title,
  prio: 'P2',
  status,
  ver: '',
  enclair: '',
  ctx: '',
  crit: [],
  verif: '',
});

const project: BoardProject = {
  name: 'p',
  desc: '',
  live: false,
  funnel: { idea: 1, ready: 0, wip: 0, unversioned: 2, parked: 1 },
  metrics: { done: 0, tokens: '', temps: '', perFiche: '', sprints: 0, runs: 0, retros: 0 },
  versions: { current: null, upcoming: [], past: [] },
  runs: {},
  fiches: {
    i: fd('i', 'Une idée vivante', 'idea'),
    p: fd('p', 'Une idée parkée', 'parked'),
  },
} as BoardProject;

const heading = (label: string) => screen.queryByRole('heading', { level: 4, name: new RegExp(`^${label}`) });

describe('FichesView — les parkées à part', () => {
  it('par défaut, une parkée n’apparaît pas, et les idées ne comptent que les vivantes', () => {
    render(<FichesView project={project} onOpenFiche={() => {}} />);
    expect(screen.queryByText('Une idée parkée')).toBeNull();
    expect(heading('Idées')?.textContent).toBe('Idées 1');
    expect(heading('Parkées')).toBeNull();
  });

  it('la bascule montre la colonne « Parkées » avec son nombre', async () => {
    render(<FichesView project={project} onOpenFiche={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'montrer les parkées (1)' }));
    expect(heading('Parkées')?.textContent).toBe('Parkées 1');
    expect(screen.getByText('Une idée parkée')).toBeTruthy();
  });

  it('en liste, une parkée montrée porte l’étiquette « parkée »', async () => {
    render(<FichesView project={project} onOpenFiche={() => {}} />);
    await userEvent.click(screen.getByRole('button', { name: 'montrer les parkées (1)' }));
    await userEvent.click(screen.getByRole('button', { name: 'En ligne' }));
    expect(screen.getByText('parkée')).toBeTruthy();
  });
});
