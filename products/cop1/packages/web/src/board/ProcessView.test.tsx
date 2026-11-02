/**
 * La vue Process (fiche 20261102123552183) : chaque fiche dans l'étape que publie la méthode, avec le
 * signal qui l'y place. Sans données, la vue dit pourquoi ; GitHub coupé, elle dit « en revue » inconnue.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ProcessView } from './ProcessView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, ProjectProcess } from './types.js';

afterEach(cleanup);

const base = BOARD_DATA.vectorz as BoardProject;
const fiche = (id: string, title: string, over: Partial<ProjectProcess['stages'][0]['fiches'][0]> = {}) => ({
  id,
  title,
  priority: 'P2',
  version: '',
  branch: null,
  pr: null,
  session: null,
  ...over,
});

const process: ProjectProcess = {
  github: true,
  reviewUnknown: false,
  stages: [
    { stage: 'idee', label: 'Idée', fiches: [fiche('1', 'Une idée')], total: 1 },
    { stage: 'prete', label: 'Prête', fiches: [], total: 0 },
    {
      stage: 'en-sprint',
      label: 'En sprint',
      fiches: [fiche('2', 'En cours', { branch: 'feat/2-x', session: '/wt/process' })],
      total: 1,
    },
    { stage: 'en-revue', label: 'En revue', fiches: [fiche('3', 'Relue', { branch: 'feat/3-y', pr: '#12' })], total: 1 },
    { stage: 'livree', label: 'Livrée', fiches: [fiche('4', 'Livrée hier')], total: 336 },
  ],
};

const show = (over: Partial<BoardProject>, onOpenFiche = vi.fn()) => {
  render(<ProcessView project={{ ...base, ...over }} onOpenFiche={onOpenFiche} />);
  return onOpenFiche;
};
const column = (label: string) => screen.getByRole('heading', { level: 4, name: new RegExp(`^${label}`) }).parentElement as HTMLElement;

describe('ProcessView — l’étape vient de la méthode', () => {
  it('chaque fiche est dans la colonne publiée', () => {
    show({ processState: { state: 'ok' }, process });
    expect(within(column('Idée')).getByText('Une idée')).toBeTruthy();
    expect(within(column('En sprint')).getByText('En cours')).toBeTruthy();
    expect(within(column('En revue')).getByText('Relue')).toBeTruthy();
  });

  it('une fiche en sprint ou en revue dit ce qui l’y place', () => {
    show({ processState: { state: 'ok' }, process });
    expect(screen.getByText('feat/2-x · session process')).toBeTruthy();
    expect(screen.getByText('#12 · feat/3-y')).toBeTruthy();
  });

  it('les livrées coupées le disent : affichées sur total', () => {
    show({ processState: { state: 'ok' }, process });
    expect(screen.getByLabelText('Livrée : 336 fiches').textContent).toBe('1 / 336');
  });

  it('un clic ouvre la fenêtre d’une fiche connue du board', async () => {
    const vectorzFiches = base.fiches ?? {};
    const [known] = Object.keys(vectorzFiches);
    if (!known) throw new Error('l’échantillon doit porter au moins une fiche');
    const p: ProjectProcess = { ...process, stages: [{ stage: 'idee', label: 'Idée', fiches: [fiche(known, 'Connue')], total: 1 }] };
    const onOpen = show({ processState: { state: 'ok' }, process: p });
    await userEvent.click(screen.getByRole('button', { name: /Connue/ }));
    expect(onOpen).toHaveBeenCalledWith(known);
  });
});

describe('ProcessView — jamais de faux chiffre', () => {
  it('GitHub coupé : « en revue » est dite inconnue', () => {
    show({ processState: { state: 'ok' }, process: { ...process, github: false, reviewUnknown: true } });
    expect(screen.getByRole('note').textContent).toMatch(/^Ce projet a coupé GitHub : l'étape « en revue » est inconnue/);
  });

  it('une méthode trop ancienne : la vue donne la raison d’ezk', () => {
    show({ processState: { state: 'unavailable', reason: 'ezk a échoué (code 2)' }, process: undefined });
    expect(screen.getByRole('status').textContent).toBe('process indisponible : ezk a échoué (code 2)');
    expect(screen.queryByRole('heading', { level: 4 })).toBeNull();
  });

  it('en lecture : la vue attend, sans colonnes', () => {
    show({ processState: { state: 'loading' }, process: undefined });
    expect(screen.getByRole('status').textContent).toBe('process indisponible : process en cours de lecture');
  });
});
