/**
 * La vue Pilotage (fiche 20261102123552182) : l'avancement par milestone et les sessions closes que la
 * méthode publie. Sans ces données, la vue dit pourquoi, jamais une liste vide présentée comme réelle.
 */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Board from './Board.js';
import { PilotageView } from './PilotageView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardData, BoardProject, Pilotage } from './types.js';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const pilotage: Pilotage = {
  milestones: [
    { name: 'board', status: 'in-progress', total: 38, shipped: 31 },
    { name: 'fondation', status: 'shipped', total: 9, shipped: 9 },
  ],
  sessions: [
    { date: '2026-11-02', title: 'Run autonome du soir', file: 'docs/sessions/2026-11-02-run.md', fiches: ['1', '2'], prs: [] },
    { date: '2026-10-30', title: 'Session du matin', file: 'docs/sessions/2026-10-30-matin.md', fiches: [], prs: ['171'] },
  ],
};

const base = BOARD_DATA.vectorz as BoardProject;

describe('PilotageView — ce que la méthode publie', () => {
  it('montre chaque milestone avec ses livrées sur son total', () => {
    render(<PilotageView onOpenFiche={() => {}} project={{ ...base, plan: { state: 'ok' }, pilotage }} />);
    expect(screen.getByLabelText('board : 31 livrées sur 38').textContent).toBe('31/38 livrées');
    expect(screen.getByLabelText('fondation : 9 livrées sur 9')).toBeTruthy();
  });

  it('liste les sessions closes dans l’ordre publié, avec leurs fiches et leurs PR', () => {
    render(<PilotageView onOpenFiche={() => {}} project={{ ...base, plan: { state: 'ok' }, pilotage }} />);
    expect(screen.getByText('Sessions closes — 2')).toBeTruthy();
    const titles = screen.getAllByText(/Run autonome du soir|Session du matin/).map((e) => e.textContent);
    expect(titles).toEqual(['Run autonome du soir', 'Session du matin']);
    expect(document.querySelector('.sessrow')?.textContent).toContain(
      '2 fiche(s) : 1 (titre indisponible) · 2 (titre indisponible)',
    );
    expect(screen.getByText('#171')).toBeTruthy();
  });
});

describe('PilotageView — jamais de faux chiffre', () => {
  // fiche 20261103203943915 — une fiche connue se lit par son titre, et s'ouvre d'un clic
  it('une fiche connue s’affiche par son titre cliquable, jamais par son id nu', async () => {
    const onOpenFiche = vi.fn();
    const known = {
      ...base,
      plan: { state: 'ok' as const },
      fiches: {
        '1': { id: '1', title: 'Le board dit vrai', prio: 'P2', status: 'done' as const, ver: 'v0.9.0', enclair: '', ctx: '', crit: [], verif: '' },
      },
      pilotage,
    };
    render(<PilotageView project={known} onOpenFiche={onOpenFiche} />);
    const link = screen.getByRole('button', { name: 'Le board dit vrai' });
    await userEvent.click(link);
    expect(onOpenFiche).toHaveBeenCalledWith('1');
    expect(document.querySelector('.sessrow')?.textContent).toContain('2 (titre indisponible)');
    expect(screen.queryByText(/: 1, 2/)).toBeNull();
  });

  it('une méthode qui ne publie pas les sessions : la vue le dit', () => {
    render(<PilotageView onOpenFiche={() => {}} project={{ ...base, plan: { state: 'ok' }, pilotage: undefined }} />);
    expect(screen.getByRole('status').textContent).toMatch(/^pilotage indisponible : la méthode installée ne publie pas/);
    expect(screen.queryByText(/Sessions closes/)).toBeNull();
  });

  it('un plan indisponible : la vue donne la raison de la méthode', () => {
    render(<PilotageView onOpenFiche={() => {}} project={{ ...base, plan: { state: 'unavailable', reason: 'ezk introuvable' }, pilotage }} />);
    expect(screen.getByRole('status').textContent).toBe('pilotage indisponible : ezk introuvable');
    expect(screen.queryByText(/Milestones/)).toBeNull();
  });

  it('un plan en chargement : la vue attend, sans liste', () => {
    render(<PilotageView onOpenFiche={() => {}} project={{ ...base, plan: { state: 'loading' } }} />);
    expect(screen.getByRole('status').textContent).toBe('pilotage indisponible : plan en cours de chargement');
  });
});

describe('Board — l’entrée « Pilotage »', () => {
  it('ouvre la vue Pilotage depuis la navigation du projet', async () => {
    const data: BoardData = { vectorz: { ...base, plan: { state: 'ok' }, pilotage } };
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, json: async () => data }) as Response),
    );
    render(<Board />);
    await userEvent.click(await screen.findByRole('button', { name: 'Pilotage' }));
    expect(await screen.findByText('Milestones — avancement cumulé')).toBeTruthy();
  });
});
