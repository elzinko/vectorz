/**
 * Les pages Sprints et Un sprint (fiche 20261124111115955) : la liste publiée, du plus récent au plus
 * ancien, le filtre par période, la troncature dite, la page d'un sprint, et « non publié » à la place
 * de ce que la méthode ne publie pas encore.
 */
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SprintsView } from './SprintsView.js';
import { BOARD_DATA } from './testing/sampleBoard.js';
import type { BoardProject, FicheDetail, SprintSummary } from './types.js';

afterEach(cleanup);

const sprint = (slug: string, jour: string, extra: Partial<SprintSummary> = {}): SprintSummary => ({
  slug,
  fichier: `docs/sprints/${jour}-sprint-${slug}.md`,
  jour,
  fin: `${jour}T17:50:00.000Z`,
  dureeMs: 1_980_000,
  tokens: null,
  livrees: [{ id: 'f1', title: 'Une fiche livrée' }],
  blocages: 0,
  ...extra,
});

const base = BOARD_DATA.vectorz as BoardProject;
const project: BoardProject = {
  ...base,
  plan: { state: 'ok' },
  metrics: { ...base.metrics, sprints: 55 },
  lastSprints: [sprint('pages-objectifs', '2026-11-24'), sprint('menu-par-portee', '2026-11-19'), sprint('vieux', '2026-10-01')],
  fiches: {
    f1: { id: 'f1', title: 'Une fiche livrée', prio: 'P1', status: 'done', ver: '', enclair: '', ctx: '', crit: [], verif: '', blocked: '' } as FicheDetail,
  },
};
const now = new Date('2026-11-24T21:00:00Z');

const firstCells = (): string[] =>
  screen
    .getAllByRole('row')
    .slice(1)
    .map((r) => within(r).getAllByRole('cell')[0]?.textContent ?? '');

describe('SprintsView — la liste', () => {
  it('liste les sprints publiés dans l’ordre publié, avec jour, durée et fiches ; session et rétro « non publié »', () => {
    render(<SprintsView project={project} onOpenFiche={() => {}} now={now} />);
    expect(firstCells()).toEqual(['pages-objectifs', 'menu-par-portee', 'vieux']);
    const row = screen.getAllByRole('row')[1] as HTMLElement;
    expect(row.textContent).toContain('2026-11-24 · 17:50');
    expect(row.textContent).toContain('33 min');
    expect(within(row).getAllByText('non publié')).toHaveLength(2);
  });

  it('dit combien de sprints elle montre sur combien, tant que la liste est tronquée', () => {
    render(<SprintsView project={project} onOpenFiche={() => {}} now={now} />);
    expect(screen.getByRole('note').textContent).toBe('3 sprints montrés sur 55 : la méthode ne publie que les derniers');
  });

  it('le filtre par période réduit la liste et dit combien restent', async () => {
    render(<SprintsView project={project} onOpenFiche={() => {}} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: '7 derniers jours' }));
    expect(firstCells()).toEqual(['pages-objectifs', 'menu-par-portee']);
    expect(screen.getByRole('status').textContent).toBe('2 sur 3 sprints');
  });
});

describe('SprintsView — la page d’un sprint', () => {
  it('s’ouvre au clic, montre en-tête, fiches et compte rendu ; le fil d’Ariane ramène à la liste', async () => {
    const onOpenFiche = vi.fn();
    render(<SprintsView project={project} onOpenFiche={onOpenFiche} now={now} />);
    await userEvent.click(screen.getByRole('button', { name: 'pages-objectifs' }));
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane des sprints" }).textContent).toBe('Sprints › pages-objectifs');
    expect(screen.getByText('non mesurés')).toBeTruthy();
    expect(screen.getByText('docs/sprints/2026-11-24-sprint-pages-objectifs.md')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Une fiche livrée' }));
    expect(onOpenFiche).toHaveBeenCalledWith('f1');
    await userEvent.click(screen.getByRole('button', { name: 'Lancer une rétro' }));
    expect(screen.getByRole('status').textContent).toBe('à lancer : /ezk-retro run "sprint pages-objectifs"');
    await userEvent.click(screen.getByRole('button', { name: 'Sprints' }));
    expect(firstCells()).toHaveLength(3);
  });

  it('avec un sprint d’essai qui publie numéro, but et session, la page les affiche sans autre changement', async () => {
    const p = { ...project, lastSprints: [sprint('s61', '2026-11-24', { numero: 61, but: 'Pages Sprints', branche: 'feat/x' })] };
    render(<SprintsView project={p} onOpenFiche={() => {}} now={now} />);
    expect(firstCells()).toEqual(['Sprint 61 — Pages Sprints']);
    expect(screen.getByText('feat/x')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Sprint 61 — Pages Sprints' }));
    expect(screen.getByText('61')).toBeTruthy();
  });

  it('s’ouvre d’entrée sur le sprint demandé par une autre page', () => {
    render(<SprintsView project={project} onOpenFiche={() => {}} now={now} initialOpen="vieux" />);
    expect(screen.getByRole('navigation', { name: "Fil d'Ariane des sprints" }).textContent).toBe('Sprints › vieux');
  });
});

describe('SprintsView — jamais de faux chiffre', () => {
  it('sans sprints publiés, la page dit pourquoi', () => {
    const { lastSprints: _l, ...without } = project;
    render(<SprintsView project={without} onOpenFiche={() => {}} />);
    expect(screen.getByRole('status').textContent).toContain('sprints indisponible');
  });
});
